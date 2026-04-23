import type { AgentStatus } from "./types";

interface StatusBadgeProps {
  status: AgentStatus;
}

const statusMap: Record<AgentStatus, { label: string; dot: string; tone: string }> = {
  trusted: {
    label: "Trusted",
    dot: "bg-emerald-300",
    tone: "border-emerald-700/60 bg-emerald-900/30 text-emerald-100",
  },
  risky: {
    label: "Risky",
    dot: "bg-amber-300",
    tone: "border-amber-700/60 bg-amber-900/20 text-amber-100",
  },
  unknown: {
    label: "Unknown",
    dot: "bg-slate-400",
    tone: "border-slate-600/60 bg-slate-800/40 text-slate-200",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${config.tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
