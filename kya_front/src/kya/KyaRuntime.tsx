import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AgentDecisionEvent, AgentRecord, ExplorerFeedItem, VerificationRequest, VerificationResult } from "./types";
import { loadJson, saveJson } from "./storage";
import { getAgentApi, getAgentLogsApi, registerAgentApi, solToLamports, verifyIntentApi } from "../api/kyaApi";

type ViewState =
  | { view: "landing" }
  | { view: "register" }
  | { view: "dashboard" }
  | { view: "agent"; agentId: string }
  | { view: "explorer" }
  | { view: "demo" };

type KyaState = {
  view: ViewState;
  agents: AgentRecord[];
  explorerFeed: ExplorerFeedItem[];
  activeVerification:
    | { agentId: string; result: VerificationResult | null; running: boolean; steps: VerificationResult["steps"] | null }
    | null;
};

type KyaActions = {
  navigate: (next: ViewState) => void;
  createAgent: (input: { name: string; description: string; transactionLimitSol: number }) => Promise<AgentRecord>;
  runVerification: (req: VerificationRequest) => Promise<VerificationResult>;
  selectAgent: (agentId: string) => void;
  resetDemo: () => void;
};

type KyaRuntime = KyaState & KyaActions;

const STORAGE_KEY = "kya_demo_runtime_v1";

const KyaContext = createContext<KyaRuntime | null>(null);

function newEventId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function computeCoverageDelta(decision: VerificationResult["decision"]) {
  const drift = decision === "approve" ? 0.8 : decision === "flag" ? 0.3 : -0.1;
  const noise = (Math.random() - 0.5) * 0.6;
  return drift + noise;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function trustDeltaFor(decision: VerificationResult["decision"], riskScore01: number) {
  if (decision === "approve") return clamp(Math.round((0.9 - riskScore01) * 3), 1, 3);
  if (decision === "flag") return -clamp(Math.round((riskScore01 - 0.35) * 4), 1, 4);
  return -clamp(Math.round((riskScore01 + 0.15) * 5), 2, 8);
}

function statusFromTrust(trustScore: number): AgentRecord["status"] {
  return trustScore >= 80 ? "trusted" : trustScore >= 62 ? "unknown" : "risky";
}

function decisionFromApi(decision: "approve" | "reject" | "escalate"): VerificationResult["decision"] {
  return decision === "escalate" ? "flag" : decision;
}

function reasonShortFor(decision: VerificationResult["decision"]) {
  if (decision === "approve") return "Policy match successful.";
  if (decision === "flag") return "Moderate risk score.";
  return "Risk score exceeded threshold.";
}

function makeTxSig(prefix = "api") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function shortAddress(addr: string) {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function newFeedId() {
  return `feed_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function toExplorerFeedItem(agent: AgentRecord, res: VerificationResult): ExplorerFeedItem {
  return {
    id: newFeedId(),
    timestamp: res.timestamp,
    agentId: agent.id,
    agentName: agent.name,
    action: res.request.action,
    amountSol: res.request.amountSol,
    recipient: shortAddress(res.request.recipient),
    decision: res.decision,
    reasonShort: res.reasonShort,
    recordTag: "Verification record",
  };
}

function stableFallbackTxSig(agentId: string, intentId: number) {
  return `intent_${agentId.slice(0, 6)}_${intentId}`;
}

type AgentLogsResponse = Awaited<ReturnType<typeof getAgentLogsApi>>;
type ApiAgentLog = AgentLogsResponse["logs"][number];

function stepsFromApiLog(log: ApiAgentLog): VerificationResult["steps"] {
  const mappedDecision = decisionFromApi(log.decision);
  const timestamp = log.timestamp;

  return [
    {
      id: "intent_parsing",
      title: "Intent parsing",
      status: "success",
      summary: "Intent parsed and normalized by API.",
      log: [`Intent: ${log.intent_text.slice(0, 200)}`],
      startedAt: timestamp,
      completedAt: timestamp,
      durationMs: 0,
    },
    {
      id: "policy_matching",
      title: "Policy matching",
      status: "success",
      summary: "Server-side policy evaluation completed.",
      log: ["Policy evaluation: ok"],
      startedAt: timestamp,
      completedAt: timestamp,
      durationMs: 0,
    },
    {
      id: "risk_scoring",
      title: "Risk scoring",
      status: log.risk_level >= 70 ? "warning" : "success",
      summary: `Risk level ${Math.round(log.risk_level)}/100.`,
      log: [`Risk: ${log.risk_level}`, `Raw decision: ${log.decision}`],
      startedAt: timestamp,
      completedAt: timestamp,
      durationMs: 0,
    },
    {
      id: "tx_preflight",
      title: "Transaction preflight",
      status: log.tx_signature ? "success" : "warning",
      summary: log.tx_signature ? "Log signature produced." : "No signature produced.",
      log: [log.tx_signature ? `sig: ${log.tx_signature}` : "sig: null"],
      startedAt: timestamp,
      completedAt: timestamp,
      durationMs: 0,
    },
    {
      id: "execution_decision",
      title: "Execution decision",
      status: mappedDecision === "approve" ? "success" : mappedDecision === "flag" ? "warning" : "error",
      summary: `Decision: ${mappedDecision.toUpperCase()}`,
      log: [log.reasoning],
      startedAt: timestamp,
      completedAt: timestamp,
      durationMs: 0,
    },
  ];
}

function historyFromApiLogs(agentId: string, logs: AgentLogsResponse["logs"]) {
  return [...logs]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((log): AgentDecisionEvent => {
      const mappedDecision = decisionFromApi(log.decision);
      return {
        id: `evt_${agentId}_${log.intent_id}`,
        timestamp: log.timestamp,
        decision: mappedDecision,
        action: log.action,
        amountSol: log.amount_sol,
        recipient: log.recipient,
        reason: log.reasoning,
        riskScore: clamp(log.risk_level / 100, 0, 1),
        txSig: log.tx_signature ?? stableFallbackTxSig(agentId, log.intent_id),
        steps: stepsFromApiLog(log),
      };
    });
}

function hydrate() {
  const saved = loadJson<KyaState>(STORAGE_KEY);
  if (!saved) return null;
  if (!saved.agents?.length) return null;
  return saved;
}

export function KyaRuntimeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<KyaState>(() => {
    const saved = hydrate();
    if (saved) return { ...saved, activeVerification: null };

    return {
      view: { view: "landing" },
      agents: [],
      explorerFeed: [],
      activeVerification: null,
    };
  });

  useEffect(() => {
    const persistable = {
      view: state.view,
      agents: state.agents,
      explorerFeed: state.explorerFeed,
    };
    saveJson(STORAGE_KEY, persistable);
  }, [state]);

  const runtime: KyaRuntime = useMemo(() => {
    async function createAgent(input: { name: string; description: string; transactionLimitSol: number }) {
      const reg = await registerAgentApi({
        agent_name: input.name.trim(),
        max_amount_lamports: solToLamports(input.transactionLimitSol),
      });

      const agentApi = await getAgentApi(reg.agent_id);
      const maxSol = agentApi.max_amount / 1_000_000_000;
      const trustScore = clamp(agentApi.trust_level, 0, 100);
      const status = statusFromTrust(trustScore);

      const out = {
        agent: {
          id: agentApi.owner,
          name: agentApi.agent_name,
          description: input.description.trim() || "No description provided.",
          pdaAddress: agentApi.agent_record_address,
          status,
          trustScore,
          transactionLimitSol: clamp(maxSol, 0.001, 10_000),
          totalChecks: 0,
          rejectedActions: 0,
          intentCoveragePct: 60,
          createdAt: Date.now(),
          behavior: "unknown" as const,
          decisionHistory: [],
        } satisfies AgentRecord,
      };
      setState((prev) => ({
        ...prev,
        agents: [out.agent, ...prev.agents],
        view: { view: "agent", agentId: out.agent.id },
      }));
      return out.agent;
    }

    function navigate(next: ViewState) {
      setState((prev) => ({ ...prev, view: next }));
    }

    function selectAgent(agentId: string) {
      setState((prev) => ({ ...prev, view: { view: "agent", agentId } }));
    }

    async function runVerification(req: VerificationRequest) {
      const agent = state.agents.find((a) => a.id === req.agentId);
      if (!agent) throw new Error("Agent not found");

      setState((prev) => ({ ...prev, activeVerification: { agentId: req.agentId, result: null, running: true, steps: null } }));

      const startedAt = Date.now();
      const startedStepAt = Date.now();

      const seedSteps: VerificationResult["steps"] = [
        { id: "intent_parsing", title: "Intent parsing", status: "running", summary: "Submitting intent to verifier...", log: [], startedAt: startedStepAt },
        { id: "policy_matching", title: "Policy matching", status: "pending", summary: "Queued...", log: [] },
        { id: "risk_scoring", title: "Risk scoring", status: "pending", summary: "Queued...", log: [] },
        { id: "tx_preflight", title: "Transaction preflight", status: "pending", summary: "Queued...", log: [] },
        { id: "execution_decision", title: "Execution decision", status: "pending", summary: "Queued...", log: [] },
      ];

      setState((prev) => {
        if (!prev.activeVerification || prev.activeVerification.agentId !== req.agentId) return prev;
        return { ...prev, activeVerification: { ...prev.activeVerification, steps: seedSteps } };
      });

      try {
        const safeRecipient = req.recipient.trim() || "unknown";
        const safeAmountSol = Number.isFinite(req.amountSol) && req.amountSol >= 0 ? req.amountSol : 0;
        const safeContext = req.context?.trim() ? req.context.trim() : null;
        const intentText = `${req.action.toUpperCase()} ${safeAmountSol.toFixed(3)} SOL -> ${safeRecipient}${safeContext ? ` | ${safeContext}` : ""}`;

        const apiRes = await verifyIntentApi({
          agent_id: req.agentId,
          intent_text: intentText,
          context_json: safeContext,
          action: req.action,
          amount_sol: safeAmountSol,
          recipient: safeRecipient,
        });

        let syncedAgentApi: Awaited<ReturnType<typeof getAgentApi>> | null = null;
        let syncedLogs: AgentLogsResponse | null = null;

        try {
          const [nextAgentApi, nextLogs] = await Promise.all([getAgentApi(req.agentId), getAgentLogsApi(req.agentId)]);
          syncedAgentApi = nextAgentApi;
          syncedLogs = nextLogs;
        } catch {
          // Keep runtime responsive even if post-verify sync fails.
        }

        const decision = decisionFromApi(apiRes.decision);
        const riskScore01 = clamp(apiRes.risk_level / 100, 0, 1);
        const trustDelta = trustDeltaFor(decision, riskScore01);
        const fallbackTrust = clamp(agent.trustScore + trustDelta, 0, 100);
        const updatedTrustScore = clamp(
          apiRes.updated_trust_level ?? syncedAgentApi?.trust_level ?? fallbackTrust,
          0,
          100,
        );

        const finishedAt = Date.now();
        const withStep = (id: VerificationResult["steps"][number]["id"], patch: Partial<VerificationResult["steps"][number]>) =>
          seedSteps.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...patch,
                  completedAt: finishedAt,
                  durationMs: finishedAt - (s.startedAt ?? finishedAt),
                }
              : s,
          );

        let steps = withStep("intent_parsing", {
          status: "success",
          summary: "Intent received by API.",
          log: [`Intent: ${intentText.slice(0, 200)}`],
        });

        steps = steps.map((s) =>
          s.id === "policy_matching"
            ? {
                ...s,
                status: "success",
                summary: "Server-side policy evaluation completed.",
                log: ["Policy evaluation: ok"],
                startedAt: startedStepAt,
                completedAt: finishedAt,
                durationMs: 0,
              }
            : s,
        );
        steps = steps.map((s) =>
          s.id === "risk_scoring"
            ? {
                ...s,
                status: apiRes.risk_level >= 70 ? "warning" : "success",
                summary: `Risk level ${Math.round(apiRes.risk_level)}/100.`,
                log: [`Risk: ${apiRes.risk_level}`, `Raw decision: ${apiRes.decision}`],
                startedAt: startedStepAt,
                completedAt: finishedAt,
                durationMs: 0,
              }
            : s,
        );
        steps = steps.map((s) =>
          s.id === "tx_preflight"
            ? {
                ...s,
                status: apiRes.intent_log_signature ? "success" : "warning",
                summary: apiRes.intent_log_signature ? "Log signature produced." : "No signature produced.",
                log: [apiRes.intent_log_signature ? `sig: ${apiRes.intent_log_signature}` : "sig: null"],
                startedAt: startedStepAt,
                completedAt: finishedAt,
                durationMs: 0,
              }
            : s,
        );
        steps = steps.map((s) =>
          s.id === "execution_decision"
            ? {
                ...s,
                status: decision === "approve" ? "success" : decision === "flag" ? "warning" : "error",
                summary: `Decision: ${decision.toUpperCase()}`,
                log: [apiRes.reasoning],
                startedAt: startedStepAt,
                completedAt: finishedAt,
                durationMs: 0,
              }
            : s,
        );

        const fallbackTxSig =
          typeof apiRes.intent_id === "number" ? stableFallbackTxSig(req.agentId, apiRes.intent_id) : makeTxSig("intent");

        const result: VerificationResult = {
          request: { ...req, amountSol: safeAmountSol, recipient: safeRecipient, context: safeContext ?? undefined },
          decision,
          reason: apiRes.reasoning,
          reasonShort: reasonShortFor(decision),
          riskScore: riskScore01,
          trustDelta,
          updatedTrustScore,
          txSig: apiRes.intent_log_signature ?? fallbackTxSig,
          steps,
          wroteMockChainRecord: Boolean(apiRes.intent_log_signature),
          timestamp: startedAt,
        };

        setState((prev) => {
          if (!prev.activeVerification || prev.activeVerification.agentId !== req.agentId) return prev;
          return { ...prev, activeVerification: { ...prev.activeVerification, steps } };
        });

        const eventId = typeof apiRes.intent_id === "number" ? `evt_${req.agentId}_${apiRes.intent_id}` : newEventId("evt");
        const event: AgentDecisionEvent = {
          id: eventId,
          timestamp: result.timestamp,
          decision: result.decision,
          action: result.request.action,
          amountSol: result.request.amountSol,
          recipient: result.request.recipient,
          reason: result.reason,
          riskScore: result.riskScore,
          txSig: result.txSig,
          steps: result.steps,
        };

        setState((prev) => {
          const agents = prev.agents.map((a) => {
            if (a.id !== req.agentId) return a;

            const serverHistory = syncedLogs ? historyFromApiLogs(req.agentId, syncedLogs.logs) : null;
            const mergedHistory = serverHistory
              ? serverHistory.map((historyEvent) => (historyEvent.id === event.id ? event : historyEvent))
              : [event, ...a.decisionHistory];

            const nextTotalChecks = syncedLogs ? syncedLogs.logs.length : a.totalChecks + 1;
            const nextRejected = syncedLogs
              ? syncedLogs.logs.filter((log) => decisionFromApi(log.decision) === "reject").length
              : a.rejectedActions + (result.decision === "reject" ? 1 : 0);
            const nextCoverage = Math.max(8, Math.min(99, a.intentCoveragePct + computeCoverageDelta(result.decision)));
            const nextTrust = clamp(apiRes.updated_trust_level ?? syncedAgentApi?.trust_level ?? result.updatedTrustScore, 0, 100);

            return {
              ...a,
              trustScore: nextTrust,
              status: statusFromTrust(nextTrust),
              totalChecks: nextTotalChecks,
              rejectedActions: nextRejected,
              intentCoveragePct: Math.round(nextCoverage),
              decisionHistory: mergedHistory.slice(0, 60),
            };
          });

          const updatedAgent = agents.find((a) => a.id === req.agentId) ?? agent;
          const feedItem = toExplorerFeedItem(updatedAgent, result);

          return {
            ...prev,
            agents,
            explorerFeed: [feedItem, ...prev.explorerFeed].slice(0, 30),
            activeVerification: { agentId: req.agentId, result, running: false, steps: result.steps },
          };
        });

        return result;
      } catch (error) {
        const finishedAt = Date.now();
        const errorMessage = error instanceof Error ? error.message : "Unexpected API error.";
        const failureSteps = seedSteps.map((step) => {
          if (step.status === "pending") {
            return {
              ...step,
              status: "warning" as const,
              summary: "Skipped due to API error.",
              log: [errorMessage],
              startedAt: startedStepAt,
              completedAt: finishedAt,
              durationMs: 0,
            };
          }
          return {
            ...step,
            status: "error" as const,
            summary: "Verification failed.",
            log: [errorMessage],
            completedAt: finishedAt,
            durationMs: finishedAt - (step.startedAt ?? finishedAt),
          };
        });

        setState((prev) => {
          if (!prev.activeVerification || prev.activeVerification.agentId !== req.agentId) return prev;
          return {
            ...prev,
            activeVerification: { agentId: req.agentId, result: null, running: false, steps: failureSteps },
          };
        });

        throw error;
      }
    }

    function resetDemo() {
      localStorage.removeItem(STORAGE_KEY);
      setState({
        view: { view: "landing" },
        agents: [],
        explorerFeed: [],
        activeVerification: null,
      });
    }

    return {
      ...state,
      navigate,
      createAgent,
      runVerification,
      selectAgent,
      resetDemo,
    };
  }, [state]);

  return <KyaContext.Provider value={runtime}>{children}</KyaContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useKyaRuntime() {
  const ctx = useContext(KyaContext);
  if (!ctx) throw new Error("useKyaRuntime must be used inside KyaRuntimeProvider");
  return ctx;
}
