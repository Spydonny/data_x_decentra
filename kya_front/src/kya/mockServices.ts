import type {
  AgentRecord,
  ExplorerFeedItem,
  VerificationDecision,
  VerificationRequest,
  VerificationResult,
  VerificationStep,
  VerificationStepId,
  VerificationStepStatus,
} from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(items: readonly T[]) {
  return items[randInt(0, items.length - 1)];
}

export async function delayMs(min = 500, max = 1500) {
  const ms = randInt(min, max);
  await new Promise((resolve) => setTimeout(resolve, ms));
  return ms;
}

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function randomBase58(len: number) {
  let out = "";
  for (let i = 0; i < len; i += 1) out += BASE58[randInt(0, BASE58.length - 1)];
  return out;
}

function shortAddress(addr: string) {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function newId(prefix: string) {
  return `${prefix}_${randomBase58(7)}`.toLowerCase();
}

export type RegisterAgentInput = {
  name: string;
  description: string;
  transactionLimitSol: number;
};

export type RegisterAgentOutput = {
  agent: AgentRecord;
  explorerUrl: string;
  recordTag: "Mock blockchain write";
};

export async function registerAgent(input: RegisterAgentInput): Promise<RegisterAgentOutput> {
  await delayMs(650, 1250);

  const trustScore = randInt(52, 78);
  const status: AgentRecord["status"] = trustScore >= 80 ? "trusted" : trustScore >= 65 ? "unknown" : "risky";

  const agentId = newId("agt");
  const pdaAddress = randomBase58(44);

  const agent: AgentRecord = {
    id: agentId,
    name: input.name.trim(),
    description: input.description.trim() || "No description provided.",
    pdaAddress,
    status,
    trustScore,
    transactionLimitSol: clamp(input.transactionLimitSol, 0.01, 1000),
    totalChecks: 0,
    rejectedActions: 0,
    intentCoveragePct: randInt(54, 86),
    createdAt: Date.now(),
    behavior: pick(["safe", "unknown", "unknown"] as const),
    decisionHistory: [],
  };

  return {
    agent,
    explorerUrl: `https://explorer.solana.com/address/${pdaAddress}?cluster=devnet`,
    recordTag: "Mock blockchain write",
  };
}

function baseSteps(): VerificationStep[] {
  return [
    {
      id: "intent_parsing",
      title: "Intent parsing",
      status: "pending",
      summary: "Waiting to parse high-level intent.",
      log: [],
    },
    {
      id: "policy_matching",
      title: "Policy matching",
      status: "pending",
      summary: "Waiting to match policies.",
      log: [],
    },
    {
      id: "risk_scoring",
      title: "Risk scoring",
      status: "pending",
      summary: "Waiting to compute risk score.",
      log: [],
    },
    {
      id: "tx_preflight",
      title: "Transaction preflight",
      status: "pending",
      summary: "Waiting to run transaction preflight checks.",
      log: [],
    },
    {
      id: "execution_decision",
      title: "Execution decision",
      status: "pending",
      summary: "Waiting to decide execution gate.",
      log: [],
    },
  ];
}

function updateStep(steps: VerificationStep[], id: VerificationStepId, patch: Partial<VerificationStep>) {
  return steps.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

function stepStatusForDecision(stepId: VerificationStepId, decision: VerificationDecision): VerificationStepStatus {
  if (stepId !== "execution_decision") return "success";
  if (decision === "approve") return "success";
  if (decision === "flag") return "warning";
  return "error";
}

export async function analyzeIntent(req: VerificationRequest) {
  const duration = await delayMs(550, 1400);
  const normalizedRecipient = req.recipient.trim() || shortAddress(randomBase58(44));
  const actionText =
    req.action === "swap"
      ? "Swap SOL into stable asset route"
      : req.action === "pay"
        ? "Payment to service address"
        : "Direct transfer to recipient wallet";

  const log = [
    `Parsed action: ${req.action}`,
    `Recipient: ${normalizedRecipient}`,
    `Amount: ${req.amountSol.toFixed(3)} SOL`,
  ];
  if (req.context?.trim()) log.push(`Context extracted: "${req.context.trim().slice(0, 80)}"`);
  else log.push("Context extracted: none provided");

  const summary = `${actionText} with ${req.amountSol.toFixed(3)} SOL.`;
  return { duration, summary, log, normalizedRecipient };
}

export async function matchPolicy(agent: AgentRecord, req: VerificationRequest) {
  const duration = await delayMs(520, 1400);
  const limitExceeded = req.amountSol > agent.transactionLimitSol;
  const policyId = pick(["A-12", "B-07", "C-03", "D-19", "E-04"] as const);

  const log = [
    `Candidate policies evaluated: ${randInt(4, 9)}`,
    `Matched policy: ${policyId}`,
    `Transaction limit: ${agent.transactionLimitSol.toFixed(3)} SOL`,
  ];
  if (limitExceeded) log.push("Hard constraint hit: per-transaction limit exceeded.");
  else log.push("Hard constraints: satisfied.");

  const summary = limitExceeded ? `Policy ${policyId} matched, but limit exceeded.` : `Policy ${policyId} matched successfully.`;
  return { duration, summary, log, policyId, limitExceeded };
}

export async function computeRiskScore(agent: AgentRecord, req: VerificationRequest, policyId: string) {
  const duration = await delayMs(500, 1500);
  const amountFactor = clamp(req.amountSol / Math.max(agent.transactionLimitSol, 0.01), 0, 3.5);
  const behaviorBias = agent.behavior === "safe" ? -0.08 : agent.behavior === "malicious" ? 0.17 : 0.06;
  const variance = rand(-0.06, 0.08);

  let risk = 0.18 + amountFactor * 0.16 + behaviorBias + variance;
  if (req.action === "swap") risk += 0.05;
  if (req.action === "transfer") risk += 0.03;
  risk = clamp(risk, 0.02, 0.98);

  const log = [
    `Policy context: ${policyId}`,
    `Amount factor: ${amountFactor.toFixed(2)}`,
    `Behavior bias: ${behaviorBias >= 0 ? "+" : ""}${behaviorBias.toFixed(2)}`,
    `Variance: ${variance >= 0 ? "+" : ""}${variance.toFixed(2)}`,
    `Computed risk: ${(risk * 100).toFixed(1)}%`,
  ];

  const summary =
    risk < 0.35 ? "Risk score indicates low anomaly variance." : risk < 0.62 ? "Risk score indicates moderate uncertainty." : "Risk score indicates elevated anomaly patterns.";

  return { duration, summary, log, riskScore: risk };
}

export async function runPreflight(req: VerificationRequest, riskScore: number) {
  const duration = await delayMs(650, 1500);
  const failChance = clamp(0.04 + Math.max(0, riskScore - 0.6) * 0.5, 0.04, 0.42);
  const preflightOk = Math.random() > failChance;
  const computeUnits = randInt(132_000, 242_000);
  const feeSol = rand(0.000004, 0.000012);

  const log = [
    `Preflight compute units: ${computeUnits.toLocaleString("en-US")}`,
    `Estimated fee: ${feeSol.toFixed(6)} SOL`,
    `Recipient check: ${req.recipient ? "provided" : "autofilled"}`,
  ];

  if (preflightOk) log.push("Preflight result: success (no privileged instruction mismatch).");
  else log.push("Preflight result: failure (unexpected program interaction / constraint mismatch).");

  const summary = preflightOk ? "Transaction preflight passed." : "Transaction preflight detected a mismatch.";
  return { duration, summary, log, preflightOk };
}

function decisionReason(agent: AgentRecord, req: VerificationRequest, riskScore: number, limitExceeded: boolean, preflightOk: boolean) {
  if (limitExceeded) {
    return {
      decision: "reject" as const,
      reason: `Rejected due to abnormal transaction size exceeding agent limit (${req.amountSol.toFixed(3)} SOL > ${agent.transactionLimitSol.toFixed(3)} SOL).`,
    };
  }

  if (!preflightOk) {
    return {
      decision: "flag" as const,
      reason: "Flagged due to a preflight mismatch indicating an unknown interaction pattern.",
    };
  }

  if (riskScore >= 0.72) {
    return {
      decision: "reject" as const,
      reason: "Rejected due to elevated risk score and unstable interaction profile for this intent.",
    };
  }

  if (riskScore >= 0.52) {
    return {
      decision: "flag" as const,
      reason: "Flagged due to moderate risk score and incomplete intent coverage history.",
    };
  }

  const positive = [
    "Approved due to stable behavioral profile and strong policy alignment.",
    "Approved because transaction stayed within configured limits and matched a known execution template.",
    "Approved after a low-risk score and successful preflight checks.",
  ] as const;

  return { decision: "approve" as const, reason: pick(positive) };
}

function trustDeltaFor(decision: VerificationDecision, riskScore: number) {
  if (decision === "approve") return clamp(Math.round((0.9 - riskScore) * 3), 1, 3);
  if (decision === "flag") return -clamp(Math.round((riskScore - 0.35) * 4), 1, 4);
  return -clamp(Math.round((riskScore + 0.15) * 5), 2, 8);
}

export async function runDecisionPipeline(
  agent: AgentRecord,
  req: VerificationRequest,
  onProgress?: (steps: VerificationStep[]) => void,
): Promise<VerificationResult> {
  let steps = baseSteps();
  const startedAt = Date.now();
  const publish = (next: VerificationStep[]) => {
    onProgress?.(next);
    return next;
  };

  steps = updateStep(steps, "intent_parsing", {
    status: "running",
    summary: "Analyzing intent...",
    startedAt: Date.now(),
  });
  steps = publish(steps);
  const intent = await analyzeIntent(req);
  steps = updateStep(steps, "intent_parsing", {
    status: "success",
    summary: intent.summary,
    log: intent.log,
    completedAt: Date.now(),
    durationMs: intent.duration,
  });
  steps = publish(steps);

  steps = updateStep(steps, "policy_matching", {
    status: "running",
    summary: "Matching policies...",
    startedAt: Date.now(),
  });
  steps = publish(steps);
  const policy = await matchPolicy(agent, req);
  steps = updateStep(steps, "policy_matching", {
    status: policy.limitExceeded ? "warning" : "success",
    summary: policy.summary,
    log: policy.log,
    completedAt: Date.now(),
    durationMs: policy.duration,
  });
  steps = publish(steps);

  steps = updateStep(steps, "risk_scoring", {
    status: "running",
    summary: "Computing risk score...",
    startedAt: Date.now(),
  });
  steps = publish(steps);
  const risk = await computeRiskScore(agent, req, policy.policyId);
  steps = updateStep(steps, "risk_scoring", {
    status: risk.riskScore >= 0.7 ? "warning" : "success",
    summary: risk.summary,
    log: risk.log,
    completedAt: Date.now(),
    durationMs: risk.duration,
  });
  steps = publish(steps);

  steps = updateStep(steps, "tx_preflight", {
    status: "running",
    summary: "Running preflight checks...",
    startedAt: Date.now(),
  });
  steps = publish(steps);
  const preflight = await runPreflight(req, risk.riskScore);
  steps = updateStep(steps, "tx_preflight", {
    status: preflight.preflightOk ? "success" : "warning",
    summary: preflight.summary,
    log: preflight.log,
    completedAt: Date.now(),
    durationMs: preflight.duration,
  });
  steps = publish(steps);

  steps = updateStep(steps, "execution_decision", {
    status: "running",
    summary: "Applying execution gate...",
    startedAt: Date.now(),
  });
  steps = publish(steps);
  await delayMs(520, 1200);
  const decisionBlock = decisionReason(agent, req, risk.riskScore, policy.limitExceeded, preflight.preflightOk);
  const txSig = randomBase58(24);
  const trustDelta = trustDeltaFor(decisionBlock.decision, risk.riskScore);
  const updatedTrustScore = clamp(agent.trustScore + trustDelta, 0, 100);

  steps = updateStep(steps, "execution_decision", {
    status: stepStatusForDecision("execution_decision", decisionBlock.decision),
    summary: decisionBlock.decision === "approve" ? "Approved for execution." : decisionBlock.decision === "flag" ? "Flagged for review." : "Rejected before signing.",
    log: [
      `Decision: ${decisionBlock.decision}`,
      `Reason: ${decisionBlock.reason}`,
      `Mock signature: ${txSig}`,
      `Trust delta: ${trustDelta > 0 ? `+${trustDelta}` : `${trustDelta}`}`,
    ],
    completedAt: Date.now(),
    durationMs: Date.now() - (steps.find((s) => s.id === "execution_decision")?.startedAt ?? Date.now()),
  });
  steps = publish(steps);

  const reasonShort =
    decisionBlock.decision === "reject"
      ? pick(["Policy hard-stop triggered.", "Risk score exceeded threshold.", "Limit exceeded."])
      : decisionBlock.decision === "flag"
        ? pick(["Unknown interaction pattern.", "Moderate risk score.", "Insufficient intent history."])
        : pick(["Low-risk profile.", "Policy match successful.", "Preflight passed."]);

  return {
    request: { ...req, recipient: intent.normalizedRecipient },
    decision: decisionBlock.decision,
    reason: decisionBlock.reason,
    reasonShort,
    riskScore: risk.riskScore,
    trustDelta,
    updatedTrustScore,
    txSig,
    steps,
    wroteMockChainRecord: true,
    timestamp: startedAt,
  };
}

export function toExplorerFeedItem(agent: AgentRecord, res: VerificationResult): ExplorerFeedItem {
  return {
    id: newId("feed"),
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
