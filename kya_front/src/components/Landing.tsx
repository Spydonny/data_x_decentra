import { FaArrowRight, FaBan, FaCheckCircle, FaRobot, FaShieldAlt } from "react-icons/fa";
import { useKyaRuntime } from "../kya/KyaRuntime";

const steps = [
  { title: "Register agent", description: "Create a profile, set limits, and derive an on-chain PDA." },
  { title: "Verify intent", description: "Every transaction is checked before execution." },
  { title: "Record result", description: "Approval and rejection decisions are saved on-chain." },
];

export default function Landing() {
  const { navigate, agents } = useKyaRuntime();

  const totals = agents.reduce(
    (acc, a) => {
      acc.verifications += a.totalChecks;
      acc.rejections += a.rejectedActions;
      return acc;
    },
    { verifications: 0, rejections: 0 },
  );

  const stats = [
    { value: String(agents.length), label: "Agents registered", icon: FaRobot, accent: "text-emerald-700" },
    { value: totals.verifications.toLocaleString("en-US"), label: "Verifications", icon: FaShieldAlt, accent: "text-teal-700" },
    { value: totals.rejections.toLocaleString("en-US"), label: "Rejected transactions", icon: FaBan, accent: "text-amber-700" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#5f7469]">Know Your Agent</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-[#14211b]">Trust Before Transaction</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#4d6258]">
            AI verification for each agent decision, with on-chain reputation and transparent reasoning logs.
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-[#173528] px-4 py-2 text-white transition-colors duration-150 hover:bg-[#1e4433]"
              onClick={() => navigate({ view: "register" })}
            >
              <FaCheckCircle className="text-xs" />
              Register agent
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#cad8d1] bg-[#f7faf8] px-4 py-2 text-[#1f3128] transition-colors duration-150 hover:border-[#b6cabc]"
              onClick={() => navigate({ view: "explorer" })}
            >
              Check agent
              <FaArrowRight className="text-xs" />
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#5f7469]">System State</p>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Verification network healthy
            </div>
            <div className="rounded-xl border border-[#dbe5df] bg-[#f8fbf9] px-3 py-2 text-sm text-[#456055]">
              99.2% deterministic policy match
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-7">
          <h2 className="text-lg font-semibold text-[#1a2b23]">Platform Snapshot</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label} className="rounded-2xl border border-[#dbe5df] bg-[#f8fbf9] p-3">
                  <p className={`flex items-center gap-2 text-2xl font-semibold ${item.accent}`}>
                    <Icon className="text-sm" />
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm text-[#53685d]">{item.label}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-3xl border border-[#d3ddd7] bg-white/90 p-6 shadow-[0_10px_30px_rgba(47,74,60,0.08)] lg:col-span-5">
          <h2 className="text-lg font-semibold text-[#1a2b23]">How It Works</h2>
          <ol className="mt-3 space-y-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-[#dbe5df] bg-[#f9fcfa] p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#5d7368]">Step {index + 1}</p>
                <p className="mt-1 text-sm font-medium text-[#1f3028]">{step.title}</p>
                <p className="mt-1 text-sm text-[#51665b]">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
