import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentRecord } from "../kya/types";

type Node = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function trustNodeClass(trust: number) {
  if (trust >= 85) return "bg-emerald-500 ring-emerald-200";
  if (trust >= 65) return "bg-emerald-400 ring-emerald-100";
  return "bg-amber-500 ring-amber-200";
}

function edgeTone(from: number, to: number) {
  const avg = (from + to) / 2;
  if (avg >= 80) return "#9de6c3";
  if (avg >= 62) return "#b9c9c0";
  return "#d1b07a";
}

export default function TrustGraphLive({
  agents,
  selectedAgentId,
  onSelect,
}: {
  agents: AgentRecord[];
  selectedAgentId: string;
  onSelect: (agentId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);

  const edges = useMemo(() => {
    const ids = agents.map((a) => a.id);
    const pairs: Array<{ a: string; b: string }> = [];
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        // Keep it looking alive but not cluttered.
        if ((i + j) % 2 === 0) pairs.push({ a: ids[i], b: ids[j] });
      }
    }
    return pairs.slice(0, 7);
  }, [agents]);

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width || 720;
    const h = rect.height || 240;

    const frame = requestAnimationFrame(() => {
      setNodes((prev) => {
        const prevById = new Map(prev.map((n) => [n.id, n]));
        return agents.map((agent, idx) => {
          const existing = prevById.get(agent.id);
          if (existing) return existing;
          const jitter = (idx + 1) * 0.07;
          return {
            id: agent.id,
            x: w * (0.18 + (idx % 3) * 0.28 + jitter),
            y: h * (0.28 + Math.floor(idx / 3) * 0.34 + jitter),
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
          };
        });
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [agents]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (t: number) => {
      const dt = clamp((t - last) / 16.7, 0.5, 1.8);
      last = t;

      setNodes((prev) => {
        const host = containerRef.current?.getBoundingClientRect();
        const w = host?.width ?? 720;
        const h = host?.height ?? 240;
        const pad = 18;

        return prev.map((n) => {
          const wobble = 0.12;
          const ax = (Math.random() - 0.5) * wobble;
          const ay = (Math.random() - 0.5) * wobble;
          let vx = clamp(n.vx + ax, -1.1, 1.1);
          let vy = clamp(n.vy + ay, -1.1, 1.1);

          let x = n.x + vx * dt;
          let y = n.y + vy * dt;

          if (x < pad || x > w - pad) vx *= -0.92;
          if (y < pad || y > h - pad) vy *= -0.92;
          x = clamp(x, pad, w - pad);
          y = clamp(y, pad, h - pad);

          return { ...n, x, y, vx, vy };
        });
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const agentById = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);

  return (
    <div
      ref={containerRef}
      className="relative mt-4 h-60 overflow-hidden rounded-2xl border border-[#d9e3de] bg-[#f8fbf9]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:linear-gradient(to_right,#dbe5df_1px,transparent_1px),linear-gradient(to_bottom,#dbe5df_1px,transparent_1px)] [background-size:24px_24px]" />

      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        {edges.map((e) => {
          const a = nodeById.get(e.a);
          const b = nodeById.get(e.b);
          if (!a || !b) return null;
          const agA = agentById.get(e.a);
          const agB = agentById.get(e.b);
          const stroke = edgeTone(agA?.trustScore ?? 0, agB?.trustScore ?? 0);
          return (
            <line
              key={`${e.a}_${e.b}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={stroke}
              strokeWidth={1}
              opacity={0.55}
            />
          );
        })}
      </svg>

      {agents.map((agent) => {
        const node = nodeById.get(agent.id);
        if (!node) return null;
        const active = agent.id === selectedAgentId;
        const size = clamp(Math.round(18 + Math.sqrt(agent.totalChecks + 1) * 1.8), 22, 38);

        return (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelect(agent.id)}
            style={{ left: node.x, top: node.y, width: size, height: size }}
            className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 transition-all duration-200 ${trustNodeClass(
              agent.trustScore,
            )} ${active ? "scale-110" : "hover:scale-105"}`}
          >
            <span className="pointer-events-none absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded border border-[#d1ddd6] bg-white px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#395448] group-hover:block">
              {agent.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

