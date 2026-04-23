import type { ReactNode } from "react";

interface MetricModuleProps {
  label: string;
  value: string;
  caption: string;
  icon: ReactNode;
  trend?: string;
}

export default function MetricModule({ label, value, caption, icon, trend }: MetricModuleProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[#2b3431] bg-[#141b19]/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3a4642]">
      <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 translate-x-7 -translate-y-7 rounded-full bg-emerald-300/5 transition-all duration-200 group-hover:bg-emerald-300/10" />
      <div className="flex items-start justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#8ea399]">{label}</p>
        <div className="text-[#9fb9ad]">{icon}</div>
      </div>
      <p className="mt-3 font-mono text-2xl font-semibold text-[#edf4f0]">{value}</p>
      <p className="mt-2 text-xs text-[#8fa197]">{caption}</p>
      {trend ? (
        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-emerald-300/85">{trend}</p>
      ) : null}
    </article>
  );
}
