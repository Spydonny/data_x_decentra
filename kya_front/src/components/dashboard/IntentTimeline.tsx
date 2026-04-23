const stages = [
  {
    title: "Intent Parsed",
    time: "08:42:11",
    text: "Swap SOL to USDC from treasury wallet with slippage cap.",
  },
  {
    title: "Policy Match",
    time: "08:42:12",
    text: "Matched low-risk policy profile and whitelist destination set.",
  },
  {
    title: "Preflight Check",
    time: "08:42:12",
    text: "Preflight checks passed. No privileged instruction mismatch.",
  },
  {
    title: "Execution Gate",
    time: "08:42:13",
    text: "Approved by verifier quorum. Signed payload forwarded on-chain.",
  },
];

export default function IntentTimeline() {
  return (
    <section className="rounded-3xl border border-[#2b3431] bg-[#101715]/90 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#8ea399]">Intent Verification Flow</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#edf4f0]">Execution Timeline</h3>
        </div>
        <p className="font-mono text-xs text-[#95aca1]">4-stage</p>
      </div>

      <ol className="mt-5 space-y-3">
        {stages.map((stage, index) => (
          <li
            key={stage.title}
            className="group rounded-xl border border-[#25312d] bg-[#0f1513] px-3 py-2.5 transition-colors duration-200 hover:border-[#3a4742]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-700/70 bg-emerald-900/20 font-mono text-[11px] text-emerald-200">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm text-[#dbe6e1]">{stage.title}</p>
                  <p className="text-xs text-[#8da097]">{stage.text}</p>
                </div>
              </div>
              <p className="font-mono text-[11px] text-[#8fa197]">{stage.time}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
