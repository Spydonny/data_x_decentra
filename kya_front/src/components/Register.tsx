import { useMemo, useState, type FormEvent } from "react";
import { FaCheckCircle, FaExternalLinkAlt, FaShieldAlt, FaUserPlus } from "react-icons/fa";
import { useKyaRuntime } from "../kya/KyaRuntime";
import type { AgentRecord } from "../kya/types";

function short(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function Register() {
  const { createAgent, navigate } = useKyaRuntime();
  const [submitted, setSubmitted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<AgentRecord | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxTx, setMaxTx] = useState("");

  const maxTxNum = useMemo(() => {
    const n = Number(maxTx);
    if (!Number.isFinite(n)) return 0;
    return n;
  }, [maxTx]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const agent = await createAgent({
        name,
        description,
        transactionLimitSol: maxTxNum || 0.35,
      });
      setCreated(agent);
      setSubmitted(true);
    } finally {
      setCreating(false);
    }
  };

  const explorerUrl = created ? `https://explorer.solana.com/address/${created.pdaAddress}?cluster=devnet` : "";

  if (submitted && created) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <section className="rounded-3xl border border-emerald-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)]">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-emerald-800">
            <FaCheckCircle className="text-emerald-600" />
            Agent Registered
          </h2>
          <p className="mt-2 text-sm text-[#4f6359]">
            Registration complete via API. A signature and PDA mapping were returned by the backend verifier.
          </p>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#dbe5df] bg-[#f8fbf9] p-3">
              <dt className="text-[11px] uppercase tracking-[0.13em] text-[#5f7369]">Agent ID</dt>
              <dd className="mt-1 font-mono text-sm text-[#1f3028]">{created.id}</dd>
            </div>
            <div className="rounded-xl border border-[#dbe5df] bg-[#f8fbf9] p-3">
              <dt className="text-[11px] uppercase tracking-[0.13em] text-[#5f7369]">Agent PDA</dt>
              <dd className="mt-1 font-mono text-sm text-[#1f3028]">{short(created.pdaAddress)}</dd>
            </div>
            <div className="rounded-xl border border-[#dbe5df] bg-[#f8fbf9] p-3 sm:col-span-2">
              <dt className="text-[11px] uppercase tracking-[0.13em] text-[#5f7369]">Explorer</dt>
              <dd className="mt-1 text-sm">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[#1f3028] underline decoration-[#b7c8be] underline-offset-2 hover:text-[#163126]"
                >
                  {explorerUrl}
                </a>
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-2xl border border-[#dbe5df] bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#607469]">Agent preview</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[#1f3128]">{created.name}</p>
                <p className="mt-1 text-sm text-[#4f6359]">{created.description}</p>
              </div>
              <dl className="grid gap-2 text-sm text-[#4f6359]">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#dbe5df] bg-[#f8fbf9] px-3 py-2">
                  <dt>Transaction limit</dt>
                  <dd className="font-mono text-[#1f3128]">{created.transactionLimitSol.toFixed(3)} SOL</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#dbe5df] bg-[#f8fbf9] px-3 py-2">
                  <dt>Trust score</dt>
                  <dd className="font-mono text-[#1f3128]">{created.trustScore} / 100</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-[#173528] px-4 py-2 text-sm text-white transition-colors duration-150 hover:bg-[#1e4433]"
              onClick={() => navigate({ view: "agent", agentId: created.id })}
            >
              Open agent profile
              <FaExternalLinkAlt className="text-[11px]" />
            </button>
            <button
              type="button"
              className="rounded-xl border border-[#cad8d1] bg-[#f7faf8] px-4 py-2 text-sm text-[#1f3128] transition-colors duration-150 hover:border-[#b6cabc]"
              onClick={() => navigate({ view: "dashboard" })}
            >
              Go to dashboard
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-7">
          <h2 className="flex items-center gap-2 text-3xl font-semibold tracking-[-0.02em] text-[#16241d]">
            <FaUserPlus className="text-lg text-emerald-600" />
            New Agent
          </h2>
          <p className="mt-2 text-sm text-[#4f6359]">
            Create an agent identity, set execution limits, and derive its on-chain PDA profile.
          </p>

          <form className="mt-5 space-y-4" onSubmit={submit}>
            <label className="block text-sm text-[#30443a]">
              Agent name
              <input
                className="mt-1.5 w-full rounded-xl border border-[#d3dfd8] bg-[#f8fbf9] px-3 py-2.5 text-sm text-[#17261f] outline-none transition-colors duration-150 focus:border-emerald-400"
                placeholder="Trading Bot Alpha"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="block text-sm text-[#30443a]">
              Description
              <textarea
                className="mt-1.5 min-h-28 w-full rounded-xl border border-[#d3dfd8] bg-[#f8fbf9] px-3 py-2.5 text-sm text-[#17261f] outline-none transition-colors duration-150 focus:border-emerald-400"
                placeholder="What does this agent do?"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <label className="block text-sm text-[#30443a]">
              Max transaction (SOL)
              <input
                className="mt-1.5 w-full rounded-xl border border-[#d3dfd8] bg-[#f8fbf9] px-3 py-2.5 text-sm text-[#17261f] outline-none transition-colors duration-150 focus:border-emerald-400"
                type="number"
                placeholder="10"
                value={maxTx}
                onChange={(event) => setMaxTx(event.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-[#173528] px-4 py-2 text-sm text-white transition-colors duration-150 hover:bg-[#1e4433] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? "Registering..." : "Register agent"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-5">
          <div className="flex items-center gap-2 text-[#1b2b23]">
            <FaShieldAlt className="text-sm text-emerald-600" />
            <p className="text-sm font-medium uppercase tracking-[0.16em]">Registration Context</p>
          </div>

          <p className="mt-3 text-sm text-[#4f6359]">
            Wallet connection is not required in demo mode. Agent identity is generated from local inputs.
          </p>

          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-[#dbe5df] bg-[#f8fbf9] px-3 py-2 text-sm text-[#4b6156]">
              Agent PDA stores deterministic authority and profile linkage.
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Ready to register without wallet adapter.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
