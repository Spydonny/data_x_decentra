import { useState } from "react";
import type { AgentRecord } from "./types";
import StatusBadge from "./StatusBadge";

interface AgentModuleProps {
  agent: AgentRecord;
  active: boolean;
  onOpen: () => void;
}

export default function AgentModule({ agent, active, onOpen }: AgentModuleProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={`group rounded-2xl border p-4 transition-all duration-200 ${
        active
          ? "border-emerald-500/45 bg-[#12201a] shadow-[0_0_0_1px_rgba(78,173,129,0.14)]"
          : "border-[#2b3431] bg-[#121918]/90 hover:border-[#3a4742]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-[#8ea399]">Agent Module</p>
          <h4 className="mt-1 text-base font-medium text-[#edf4f0]">{agent.name}</h4>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg border border-[#2a3531] bg-[#0e1412] p-2">
          <p className="uppercase tracking-[0.1em] text-[#82948c]">Trust</p>
          <p className="mt-1 font-mono text-[#e5eeea]">{agent.trust}%</p>
        </div>
        <div className="rounded-lg border border-[#2a3531] bg-[#0e1412] p-2">
          <p className="uppercase tracking-[0.1em] text-[#82948c]">Verified</p>
          <p className="mt-1 font-mono text-[#e5eeea]">{agent.verifications24h}</p>
        </div>
        <div className="rounded-lg border border-[#2a3531] bg-[#0e1412] p-2">
          <p className="uppercase tracking-[0.1em] text-[#82948c]">Rejected</p>
          <p className="mt-1 font-mono text-[#e5eeea]">{agent.rejected24h}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#8fa197]">{agent.reasonSummary}</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-[#26322e]">
          <div
            className="h-full rounded-full bg-emerald-400/80 transition-all duration-300"
            style={{ width: `${agent.intentCoverage}%` }}
          />
        </div>
        <p className="font-mono text-[11px] text-[#9db2a8]">{agent.intentCoverage}% intent coverage</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onOpen}
          className="text-xs uppercase tracking-[0.14em] text-emerald-300 transition-colors duration-200 hover:text-emerald-200"
        >
          Open Agent
        </button>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-xs uppercase tracking-[0.14em] text-[#a7bbb2] transition-colors duration-200 hover:text-[#dbe7e2]"
        >
          {expanded ? "Hide Reasoning" : "Expand Reasoning"}
        </button>
      </div>

      <div
        className={`grid transition-all duration-300 ${expanded ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="rounded-xl border border-[#2a3531] bg-[#0d1312] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8ca097]">Decision Log</p>
            <ul className="mt-2 space-y-1.5">
              {agent.reasoningLog.map((entry) => (
                <li key={entry} className="text-xs text-[#bdccc6]">
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}
