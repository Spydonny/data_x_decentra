import type { AgentRecord } from "./types";

interface TrustConstellationProps {
  agents: AgentRecord[];
  selectedAgentId: string;
  onSelect: (id: string) => void;
}

function trustTone(trust: number) {
  if (trust >= 85) return "bg-emerald-300";
  if (trust >= 65) return "bg-emerald-500/90";
  return "bg-amber-300";
}

function trustRing(trust: number) {
  if (trust >= 85) return "ring-emerald-300/45";
  if (trust >= 65) return "ring-emerald-500/40";
  return "ring-amber-300/45";
}

export default function TrustConstellation({
  agents,
  selectedAgentId,
  onSelect,
}: TrustConstellationProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#2b3431] bg-[#101715]/95 p-5">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background:linear-gradient(to_right,#2a3531_1px,transparent_1px),linear-gradient(to_bottom,#2a3531_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="relative">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#8ea399]">Signature Element</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#edf4f0]">
              Trust Constellation
            </h3>
            <p className="mt-1 text-xs text-[#8ea399]">
              Node size reflects verification load. Path links indicate recent interaction overlap.
            </p>
          </div>
          <p className="font-mono text-xs text-[#95aca1]">Mesh / 24h</p>
        </div>

        <div className="relative mt-5 h-56 rounded-2xl border border-[#24302c] bg-[#0d1312]/90 p-4">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
            <line x1="16" y1="24" x2="41" y2="18" stroke="#32403b" strokeWidth="0.45" />
            <line x1="41" y1="18" x2="72" y2="30" stroke="#32403b" strokeWidth="0.45" />
            <line x1="72" y1="30" x2="82" y2="70" stroke="#32403b" strokeWidth="0.45" />
            <line x1="41" y1="18" x2="24" y2="66" stroke="#32403b" strokeWidth="0.45" />
            <line x1="24" y1="66" x2="82" y2="70" stroke="#32403b" strokeWidth="0.45" />
            <line x1="16" y1="24" x2="24" y2="66" stroke="#2a3632" strokeWidth="0.35" />
          </svg>

          {agents.map((agent, index) => {
            const positions = [
              "left-[14%] top-[19%]",
              "left-[38%] top-[13%]",
              "left-[69%] top-[26%]",
              "left-[22%] top-[62%]",
              "left-[80%] top-[67%]",
            ];
            const size = Math.max(10, Math.min(18, Math.round(agent.verifications24h / 10)));
            const active = selectedAgentId === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => onSelect(agent.id)}
                className={`group absolute ${positions[index]} -translate-x-1/2 -translate-y-1/2`}
              >
                <span
                  className={`flex items-center justify-center rounded-full ring-2 transition-all duration-200 ${trustTone(
                    agent.trust,
                  )} ${trustRing(agent.trust)} ${
                    active ? "scale-110 ring-emerald-200/70" : "scale-100 opacity-85 group-hover:scale-105"
                  }`}
                  style={{ width: `${size * 2}px`, height: `${size * 2}px` }}
                />
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded border border-[#31403a] bg-[#0f1513] px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-[#b8c9c1] group-hover:block">
                  {agent.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
