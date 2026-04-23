import type { VerificationStep } from "../kya/types";

function statusTone(status: VerificationStep["status"]) {
  if (status === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "error") return "border-rose-200 bg-rose-50 text-rose-800";
  if (status === "running") return "border-[#cfe0d6] bg-[#f7faf8] text-[#29473a]";
  return "border-[#dbe5df] bg-white text-[#5f7369]";
}

function statusLabel(status: VerificationStep["status"]) {
  if (status === "success") return "complete";
  if (status === "warning") return "attention";
  if (status === "error") return "blocked";
  if (status === "running") return "running";
  return "queued";
}

export default function VerificationStepper({
  steps,
  title = "Intent verification pipeline",
  subtitle = "Verification pipeline with production-style delays and logs.",
}: {
  steps: VerificationStep[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)]">
      <h3 className="text-lg font-semibold text-[#1a2b23]">{title}</h3>
      <p className="mt-1 text-xs text-[#5f7369]">{subtitle}</p>

      <ol className="mt-4 space-y-2">
        {steps.map((step, idx) => (
          <li key={step.id} className="rounded-2xl border border-[#dbe5df] bg-[#f9fcfa] p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border border-[#dbe5df] bg-white font-mono text-[11px] text-[#4f6359]">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-[#203229]">{step.title}</p>
                  <p className="mt-0.5 text-xs text-[#4f6359]">{step.summary}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${statusTone(step.status)}`}>
                  {statusLabel(step.status)}
                </span>
                {typeof step.durationMs === "number" ? (
                  <span className="font-mono text-[11px] text-[#5f7369]">{Math.round(step.durationMs)}ms</span>
                ) : null}
              </div>
            </div>

            {step.log.length ? (
              <div className="mt-3 rounded-xl border border-[#dbe5df] bg-white px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#607469]">Reasoning / log</p>
                <ul className="mt-2 space-y-1">
                  {step.log.map((line) => (
                    <li key={line} className="text-xs text-[#30433a]">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
