import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaExternalLinkAlt, FaShieldAlt, FaTimesCircle } from "react-icons/fa";
import { HiOutlineCheckBadge } from "react-icons/hi2";
import { useKyaRuntime } from "../kya/KyaRuntime";
import type { AgentStatus } from "../kya/types";
import TrustGraphLive from "./TrustGraphLive";

const OWNER_PDA = "9zF4g6k8Qj3nP2x7Yc1mA4uR5wT8bV6dN0hL2sE1";
const OWNER_PDA_SHORT = "9zF4...sE1";
const OWNER_PDA_EXPLORER = `https://explorer.solana.com/address/${OWNER_PDA}?cluster=devnet`;

const statusStyles: Record<AgentStatus, { label: string; badge: string; dot: string }> = {
  trusted: {
    label: "Trusted",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  risky: {
    label: "Risky",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  unknown: {
    label: "Unknown",
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-400",
  },
};
export default function Dashboard() {
  const { agents, selectAgent, navigate } = useKyaRuntime();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [filter, setFilter] = useState<AgentStatus | "all">("all");

  useEffect(() => {
    if (agents.length === 0) return;
    if (!selectedAgentId) {
      setSelectedAgentId(agents[0].id);
      return;
    }
    if (!agents.some((a) => a.id === selectedAgentId)) setSelectedAgentId(agents[0].id);
  }, [agents, selectedAgentId]);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? agents[0],
    [agents, selectedAgentId],
  );

  const totals = useMemo(
    () =>
      agents.reduce(
        (result, agent) => {
          result.verified += Math.max(0, agent.totalChecks - agent.rejectedActions);
          result.rejected += agent.rejectedActions;
          return result;
        },
        { verified: 0, rejected: 0 },
      ),
    [agents],
  );

  const totalChecks = totals.verified + totals.rejected;
  const passRatio = totalChecks > 0 ? Math.round((totals.verified / totalChecks) * 1000) / 10 : 0;

  const filteredAgents = useMemo(() => {
    if (filter === "all") return agents;
    return agents.filter((a) => a.status === filter);
  }, [agents, filter]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#5f7469]">Control Surface</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#16241d]">KYA Operations Grid</h2>
              <p className="mt-1 text-xs text-[#5d7267]">Authority PDA: {OWNER_PDA_SHORT}</p>
            </div>
            <div className="rounded-xl border border-[#d4dfd9] bg-[#f7faf8] px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#607469]">Focused Agent</p>
              <p className="mt-1 text-sm font-medium text-[#1f3128]">{selectedAgent?.name ?? "—"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#5f7469]">Agent Authority</p>
          <div className="mt-3 rounded-xl border border-[#d6e2db] bg-[#f8fbf9] p-3">
            <p className="text-[11px] uppercase tracking-[0.13em] text-[#5f7469]">Owner PDA</p>
            <p className="mt-1 font-mono text-sm text-[#1e2f27]">{OWNER_PDA_SHORT}</p>
          </div>
          <a
            href={OWNER_PDA_EXPLORER}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-[#29473a] transition-colors duration-150 hover:text-[#183126]"
          >
            Open in Explorer
            <FaExternalLinkAlt className="text-[10px]" />
          </a>
          <button
            type="button"
            className="mt-3 block text-xs uppercase tracking-[0.12em] text-[#29473a] transition-colors duration-150 hover:text-[#183126]"
            onClick={() => (selectedAgent ? selectAgent(selectedAgent.id) : null)}
          >
            Open agent detail
          </button>
          <button
            type="button"
            className="mt-3 block text-xs uppercase tracking-[0.12em] text-[#5f7369] transition-colors duration-150 hover:text-[#385245]"
            onClick={() => navigate({ view: "register" })}
          >
            Register new agent
          </button>
        </section>

        <section className="grid gap-3 lg:col-span-4">
          <article className="rounded-2xl border border-[#d9e3de] bg-white/90 p-4 shadow-[0_6px_18px_rgba(47,74,60,0.06)]">
            <div className="flex items-start justify-between">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#607469]">Active Agents</p>
              <HiOutlineCheckBadge className="text-[#2d4f40]" />
            </div>
            <p className="mt-2 font-mono text-2xl text-[#13221b]">{agents.length}</p>
            <p className="mt-1 text-xs text-[#5f7369]">Modules currently monitored by KYA.</p>
          </article>

          <article className="rounded-2xl border border-[#d9e3de] bg-white/90 p-4 shadow-[0_6px_18px_rgba(47,74,60,0.06)]">
            <div className="flex items-start justify-between">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#607469]">Verified Intents</p>
              <FaShieldAlt className="text-[#2d4f40]" />
            </div>
            <p className="mt-2 font-mono text-2xl text-[#13221b]">{totals.verified}</p>
            <p className="mt-1 text-xs text-[#5f7369]">Pass ratio: {passRatio}%</p>
          </article>

          <article className="rounded-2xl border border-[#d9e3de] bg-white/90 p-4 shadow-[0_6px_18px_rgba(47,74,60,0.06)]">
            <div className="flex items-start justify-between">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#607469]">Rejected Intents</p>
              <FaTimesCircle className="text-[#8b5d28]" />
            </div>
            <p className="mt-2 font-mono text-2xl text-[#13221b]">{totals.rejected}</p>
            <p className="mt-1 text-xs text-[#5f7369]">Containment stable</p>
          </article>
        </section>

        <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#5f7469]">Signature Element</p>
              <h3 className="mt-1 text-lg font-semibold text-[#1a2b23]">Trust Graph</h3>
              <p className="mt-1 text-xs text-[#5f7369]">Node size = verification load, color = trust band.</p>
            </div>
            <p className="font-mono text-xs text-[#5f7369]">Mesh / 24h</p>
          </div>

          <TrustGraphLive agents={agents} selectedAgentId={selectedAgentId} onSelect={setSelectedAgentId} />
        </section>

        <section className="space-y-3 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d8e2dd] bg-white/90 p-4 shadow-[0_6px_18px_rgba(47,74,60,0.06)]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#607469]">Agents</p>
              <p className="mt-1 text-sm text-[#4f6359]">Filter and open detailed profiles.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em]">
              {(["all", "trusted", "unknown", "risky"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={
                    filter === id
                      ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800"
                      : "rounded-full border border-[#d6e2db] bg-[#f7faf8] px-3 py-1 text-[#5f7369] hover:border-[#b9ccc1]"
                  }
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {filteredAgents.map((agent) => {
            const selected = agent.id === selectedAgentId;
            const status = statusStyles[agent.status];
            const verified = Math.max(0, agent.totalChecks - agent.rejectedActions);

            return (
              <article
                key={agent.id}
                className={`rounded-2xl border bg-white/90 p-4 shadow-[0_6px_18px_rgba(47,74,60,0.06)] transition-colors duration-150 ${
                  selected ? "border-emerald-300" : "border-[#d8e2dd]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#607469]">Agent Module</p>
                    <h4 className="mt-1 text-base font-semibold text-[#1f3128]">{agent.name}</h4>
                    <p className="mt-1 text-xs text-[#5f7369]">{agent.id}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${status.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-[#dde6e1] bg-[#f7faf8] p-2">
                    <p className="uppercase tracking-[0.1em] text-[#607469]">Trust</p>
                    <p className="mt-1 font-mono text-[#17261f]">{agent.trustScore}%</p>
                  </div>
                  <div className="rounded-lg border border-[#dde6e1] bg-[#f7faf8] p-2">
                    <p className="uppercase tracking-[0.1em] text-[#607469]">Checks</p>
                    <p className="mt-1 font-mono text-[#17261f]">{agent.totalChecks}</p>
                  </div>
                  <div className="rounded-lg border border-[#dde6e1] bg-[#f7faf8] p-2">
                    <p className="uppercase tracking-[0.1em] text-[#607469]">Rejected</p>
                    <p className="mt-1 font-mono text-[#17261f]">{agent.rejectedActions}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-[#4f6359]">{agent.description}</p>

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-[#d7e3dc]">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${agent.intentCoveragePct}%` }} />
                  </div>
                  <p className="font-mono text-[11px] text-[#5f7369]">{agent.intentCoveragePct}% intent coverage</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => selectAgent(agent.id)}
                    className="text-xs uppercase tracking-[0.12em] text-[#28473a] transition-colors duration-150 hover:text-[#173126]"
                  >
                    Open agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="text-xs uppercase tracking-[0.12em] text-[#5f7369] transition-colors duration-150 hover:text-[#385245]"
                  >
                    Focus
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-[#dbe5df] bg-[#f8fbf9] p-3">
                    <p className="uppercase tracking-[0.12em] text-[#607469]">Verified</p>
                    <p className="mt-1 font-mono text-[#1f3128]">{verified}</p>
                  </div>
                  <div className="rounded-xl border border-[#dbe5df] bg-[#f8fbf9] p-3">
                    <p className="uppercase tracking-[0.12em] text-[#607469]">Limit</p>
                    <p className="mt-1 font-mono text-[#1f3128]">{agent.transactionLimitSol.toFixed(3)} SOL</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-5">
          <h3 className="text-lg font-semibold text-[#1a2b23]">Verification Summary</h3>
          <p className="mt-1 text-xs text-[#5f7369]">Pipeline decisions with explainable logs.</p>

          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-[#dbe5df] bg-[#f9fcfa] p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#607469]">Focused agent</p>
              <p className="mt-1 text-sm font-medium text-[#203229]">{selectedAgent?.name ?? "—"}</p>
              <p className="mt-1 text-xs text-[#4f6359]">
                Checks: <span className="font-mono text-[#1f3128]">{selectedAgent?.totalChecks ?? 0}</span> · Rejected:{" "}
                <span className="font-mono text-[#1f3128]">{selectedAgent?.rejectedActions ?? 0}</span>
              </p>
            </div>

            <div className="rounded-xl border border-[#dbe5df] bg-[#f9fcfa] p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#607469]">Last decision</p>
              {selectedAgent?.decisionHistory?.[0] ? (
                <div className="mt-1">
                  <p className="text-sm font-medium text-[#203229]">
                    {selectedAgent.decisionHistory[0].decision.toUpperCase()} ·{" "}
                    <span className="font-mono">{selectedAgent.decisionHistory[0].amountSol.toFixed(3)} SOL</span>
                  </p>
                  <p className="mt-1 text-xs text-[#4f6359]">{selectedAgent.decisionHistory[0].reason}</p>
                </div>
              ) : (
                <p className="mt-1 text-xs text-[#4f6359]">No verifications yet. Open the agent profile to run a check.</p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="inline-flex items-center gap-2">
              <FaCheckCircle className="text-xs" />
              Verification records are written through the API simulator (not mainnet).
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
