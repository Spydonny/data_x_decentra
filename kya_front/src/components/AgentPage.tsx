import { useMemo, useState } from "react";
import { FaArrowLeft, FaCheckCircle, FaChevronDown, FaChevronUp, FaExternalLinkAlt, FaHistory, FaTimesCircle } from "react-icons/fa";
import { useKyaRuntime } from "../kya/KyaRuntime";
import type { VerificationDecision } from "../kya/types";
import VerificationStepper from "./VerificationStepper";

function short(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function timeAgo(ts: number) {
  const delta = Math.max(0, Date.now() - ts);
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function decisionTone(decision: VerificationDecision) {
  if (decision === "approve") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (decision === "flag") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

export default function AgentPage({ agentId }: { agentId: string }) {
  const { agents, navigate, runVerification, activeVerification } = useKyaRuntime();
  const agent = useMemo(() => agents.find((a) => a.id === agentId), [agents, agentId]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [action, setAction] = useState<"transfer" | "pay" | "swap">("transfer");
  const [amountSol, setAmountSol] = useState("0.023");
  const [recipient, setRecipient] = useState("");
  const [context, setContext] = useState("");

  const running = activeVerification?.running && activeVerification.agentId === agentId;
  const visibleSteps = activeVerification?.agentId === agentId ? activeVerification.steps : null;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="rounded-3xl border border-[#d3ddd7] bg-white/85 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#5f7469]">Agent Profile</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#14211b]">{agent?.name ?? "Unknown agent"}</h2>
              <p className="mt-2 max-w-2xl text-sm text-[#4d6258]">{agent?.description ?? "Agent not found in this demo runtime."}</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#cad8d1] bg-[#f7faf8] px-3 py-2 text-xs uppercase tracking-[0.12em] text-[#1f3128] transition-colors duration-150 hover:border-[#b6cabc]"
              onClick={() => navigate({ view: "dashboard" })}
            >
              <FaArrowLeft className="text-[11px]" />
              Back to dashboard
            </button>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-[#4d6258]">
            Verification runs through the API with production-style delays and logged reasoning.
          </p>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#dde6e1] bg-[#f7faf8] px-4 py-3">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-[#607469]">Trust level</dt>
              <dd className="mt-1 font-mono text-lg text-[#12221b]">{agent ? `${agent.trustScore} / 100` : "—"}</dd>
            </div>
            <div className="rounded-2xl border border-[#dde6e1] bg-[#f7faf8] px-4 py-3">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-[#607469]">Verifications</dt>
              <dd className="mt-1 font-mono text-lg text-[#12221b]">{agent ? agent.totalChecks : "—"}</dd>
            </div>
            <div className="rounded-2xl border border-[#dde6e1] bg-[#f7faf8] px-4 py-3">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-[#607469]">Rejections</dt>
              <dd className="mt-1 font-mono text-lg text-[#12221b]">{agent ? agent.rejectedActions : "—"}</dd>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-emerald-700">Status</dt>
              <dd className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {agent?.status ?? "unknown"}
              </dd>
            </div>
            <div className="rounded-2xl border border-[#dde6e1] bg-[#f7faf8] px-4 py-3">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-[#607469]">Transaction limit</dt>
              <dd className="mt-1 font-mono text-lg text-[#12221b]">{agent ? `${agent.transactionLimitSol.toFixed(3)} SOL` : "—"}</dd>
            </div>
            <div className="rounded-2xl border border-[#dde6e1] bg-[#f7faf8] px-4 py-3">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-[#607469]">Intent coverage</dt>
              <dd className="mt-1 font-mono text-lg text-[#12221b]">{agent ? `${agent.intentCoveragePct}%` : "—"}</dd>
            </div>
            <div className="rounded-2xl border border-[#dde6e1] bg-[#f7faf8] px-4 py-3 sm:col-span-2">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-[#607469]">Agent ID</dt>
              <dd className="mt-1 font-mono text-sm text-[#12221b]">{agent?.id ?? agentId}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-3xl border border-[#d3ddd7] bg-white/85 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-4">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#1b2b23]">Agent PDA</p>
          <p className="mt-3 text-sm text-[#4c6157]">Deterministic on-chain address for this agent profile.</p>
          <div className="mt-4 rounded-2xl border border-[#dbe5df] bg-[#f8fbf9] p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#607469]">PDA Address</p>
            <p className="mt-1 font-mono text-sm text-[#1c2b24]">{agent?.pdaAddress ? short(agent.pdaAddress) : "—"}</p>
          </div>
          <a
            href={agent?.pdaAddress ? `https://explorer.solana.com/address/${agent.pdaAddress}?cluster=devnet` : undefined}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-[#29473a] transition-colors duration-150 hover:text-[#183126]"
          >
            Open in Explorer
            <FaExternalLinkAlt className="text-[10px]" />
          </a>

          <div className="mt-4 rounded-2xl border border-[#dbe5df] bg-[#f9fcfa] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#607469]">Demo verification mode</p>
            <p className="mt-1 text-xs text-[#5f7369]">Trigger a check and watch the pipeline run (500–1500ms per step).</p>

            <div className="mt-3 space-y-3 text-sm">
              <label className="block text-sm text-[#30443a]">
                Action
                <select
                  className="mt-1.5 w-full rounded-xl border border-[#d3dfd8] bg-[#f8fbf9] px-3 py-2.5 text-sm text-[#17261f] outline-none transition-colors duration-150 focus:border-emerald-400"
                  value={action}
                  onChange={(e) => setAction(e.target.value as "transfer" | "pay" | "swap")}
                  disabled={running}
                >
                  <option value="transfer">Transfer</option>
                  <option value="pay">Pay</option>
                  <option value="swap">Swap</option>
                </select>
              </label>

              <label className="block text-sm text-[#30443a]">
                Amount (SOL)
                <input
                  className="mt-1.5 w-full rounded-xl border border-[#d3dfd8] bg-[#f8fbf9] px-3 py-2.5 text-sm text-[#17261f] outline-none transition-colors duration-150 focus:border-emerald-400"
                  type="number"
                  value={amountSol}
                  onChange={(e) => setAmountSol(e.target.value)}
                  disabled={running}
                />
              </label>

              <label className="block text-sm text-[#30443a]">
                Recipient address
                <input
                  className="mt-1.5 w-full rounded-xl border border-[#d3dfd8] bg-[#f8fbf9] px-3 py-2.5 text-sm text-[#17261f] outline-none transition-colors duration-150 focus:border-emerald-400"
                  placeholder="9pK2...mF4a"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={running}
                />
              </label>

              <label className="block text-sm text-[#30443a]">
                Context (optional)
                <textarea
                  className="mt-1.5 min-h-24 w-full rounded-xl border border-[#d3dfd8] bg-[#f8fbf9] px-3 py-2.5 text-sm text-[#17261f] outline-none transition-colors duration-150 focus:border-emerald-400"
                  placeholder="Why is this transaction needed?"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  disabled={running}
                />
              </label>

              <button
                type="button"
                disabled={!agent || running}
                className="w-full rounded-xl bg-[#173528] px-4 py-2 text-sm text-white transition-colors duration-150 hover:bg-[#1e4433] disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() =>
                  agent
                    ? runVerification({
                        agentId: agent.id,
                        action,
                        amountSol: Number(amountSol),
                        recipient,
                        context,
                      })
                    : null
                }
              >
                {running ? "Running verification..." : "Run verification"}
              </button>

              <div className="rounded-xl border border-[#dbe5df] bg-white px-3 py-2 text-xs text-[#5f7369]">
                Output includes: verdict, reasoning, trust delta, and an API signature (not mainnet).
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-12">
          {visibleSteps?.length ? (
            <VerificationStepper
              steps={visibleSteps}
              title="Intent verification system"
              subtitle={running ? "Pipeline running with live delays..." : "Latest pipeline output."}
            />
          ) : (
            <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)]">
              <h3 className="text-lg font-semibold text-[#1a2b23]">Intent verification system</h3>
              <p className="mt-1 text-xs text-[#5f7369]">Run a verification to populate the step-by-step reasoning logs.</p>
            </section>
          )}
        </section>

        <section className="rounded-3xl border border-[#d3ddd7] bg-white/85 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-12">
          <h3 className="flex items-center gap-2 text-lg font-medium text-[#1a2b23]">
            <FaHistory className="text-sm text-emerald-600" />
            Decision History
          </h3>
          <p className="mt-1 text-xs text-[#5e7368]">Every record includes an explanation. Expand to view step logs.</p>

          <div className="mt-4 space-y-2">
            {(agent?.decisionHistory ?? []).length ? (
              agent!.decisionHistory.map((evt) => {
                const expanded = expandedId === evt.id;
                return (
                  <article
                    key={evt.id}
                    className="rounded-2xl border border-[#dbe4df] bg-[#f9fcfa] px-4 py-3 transition-all duration-200 hover:border-[#bdd0c6]"
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => setExpandedId((prev) => (prev === evt.id ? null : evt.id))}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="flex flex-wrap items-center gap-2 text-sm text-[#1d2c25]">
                            {evt.decision === "approve" ? (
                              <FaCheckCircle className="text-xs text-emerald-600" />
                            ) : evt.decision === "reject" ? (
                              <FaTimesCircle className="text-xs text-rose-600" />
                            ) : (
                              <FaTimesCircle className="text-xs text-amber-500" />
                            )}
                            <span className="font-semibold uppercase tracking-[0.08em]">{evt.decision}</span>
                            <span className="font-mono">{evt.amountSol.toFixed(3)} SOL</span>
                            <span className="text-[#62766c]">-&gt; {short(evt.recipient)}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.13em] ${decisionTone(evt.decision)}`}>
                              verification record
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-[#4f645a]">{evt.reason}</p>
                          <p className="mt-1 font-mono text-[11px] text-[#5f7369]">tx: {evt.txSig}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="whitespace-nowrap text-xs text-[#5f7369]">{timeAgo(evt.timestamp)}</span>
                          {expanded ? <FaChevronUp className="text-xs text-[#5f7369]" /> : <FaChevronDown className="text-xs text-[#5f7369]" />}
                        </div>
                      </div>
                    </button>

                    {expanded ? (
                      <div className="mt-3 rounded-xl border border-[#d7e2dc] bg-white px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-[#5f7369]">Pipeline snapshot</p>
                        <ol className="mt-2 space-y-2">
                          {evt.steps.map((s) => (
                            <li key={s.id} className="rounded-lg border border-[#e1ebe6] bg-[#f8fbf9] px-3 py-2">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-medium text-[#1f3128]">{s.title}</p>
                                  <p className="mt-0.5 text-xs text-[#4f6359]">{s.summary}</p>
                                </div>
                                <span className="font-mono text-[11px] text-[#5f7369]">{typeof s.durationMs === "number" ? `${Math.round(s.durationMs)}ms` : "—"}</span>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-[#dbe4df] bg-[#f9fcfa] px-4 py-3 text-sm text-[#4f645a]">
                No decisions yet. Run a verification to generate a full decision history.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
