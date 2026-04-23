import { useMemo, useState } from "react";
import { FaArrowRight, FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import { useKyaRuntime } from "../kya/KyaRuntime";
import type { VerificationDecision } from "../kya/types";

function timeAgo(ts: number) {
  const delta = Math.max(0, Date.now() - ts);
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return `${days} days ago`;
}

function decisionTone(decision: VerificationDecision) {
  if (decision === "approve") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (decision === "flag") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

export default function Explorer() {
  const { explorerFeed, selectAgent } = useKyaRuntime();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return explorerFeed;
    return explorerFeed.filter((item) => {
      return (
        item.agentId.toLowerCase().includes(q) ||
        item.agentName.toLowerCase().includes(q) ||
        item.recipient.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.decision.toLowerCase().includes(q)
      );
    });
  }, [explorerFeed, query]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="rounded-3xl border border-[#d3ddd7] bg-white/85 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-12">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#16241d]">Explorer</h2>
          <p className="mt-2 text-sm text-[#4f6359]">
            Investigate recent verifications and inspect why intents were approved or blocked.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#d2ddd7] bg-[#f8fbf9] px-3 py-2.5">
            <FaSearch className="text-xs text-emerald-600" />
            <input
              className="w-full bg-transparent text-sm text-[#1c2b24] outline-none"
              placeholder="Search by agent ID or wallet address"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-[#d3ddd7] bg-white/85 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#1a2b23]">Explorer Feed</h3>
              <p className="mt-1 text-xs text-[#5f7369]">Auto-updating feed of recent verifications.</p>
            </div>
            <span className="rounded-full border border-[#d1ddd6] bg-[#f7faf8] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#577064]">
              Verification record
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {filtered.map((item) => {
              const expanded = item.id === expandedId;
              const verdictTone = decisionTone(item.decision);

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#dbe4df] bg-[#f9fcfa] px-4 py-3 transition-all duration-200 hover:border-[#bdd0c6]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      className="flex-1 text-left"
                      onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-[#1f3028]">{item.agentId}</span>
                        <span className="text-sm text-[#4f6359]">{item.agentName}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.13em] ${verdictTone}`}>
                          {item.decision}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-[#4c6257]">
                        <span className="font-mono text-[#1f3028]">{item.amountSol.toFixed(3)} SOL</span>
                        <span>-&gt; {item.recipient}</span>
                        <FaArrowRight className="text-[10px] text-emerald-600" />
                      </p>
                    </button>

                    <div className="flex items-center gap-2 text-xs text-[#5f7369]">
                      <span>{timeAgo(item.timestamp)}</span>
                      {expanded ? <FaChevronUp /> : <FaChevronDown />}
                      <button
                        type="button"
                        className="rounded-lg border border-[#d0dcd5] bg-white px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#40564a] hover:border-[#b7c8be]"
                        onClick={() => selectAgent(item.agentId)}
                      >
                        open
                      </button>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="mt-3 rounded-xl border border-[#d7e2dc] bg-white px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#5f7369]">Rationale</p>
                      <p className="mt-1 text-sm text-[#30433a]">{item.reasonShort}</p>
                      <p className="mt-1 text-xs text-[#5f7369]">{item.recordTag}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}

            {!filtered.length ? (
              <div className="rounded-2xl border border-[#dbe4df] bg-[#f9fcfa] px-4 py-3 text-sm text-[#4f645a]">
                No matching records.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
