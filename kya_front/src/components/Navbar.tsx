import type { ComponentType } from "react";
import { FaChartBar, FaCompass, FaFlask, FaHome, FaCat } from "react-icons/fa";
import { useKyaRuntime } from "../kya/KyaRuntime";

type NavView = "landing" | "dashboard" | "explorer" | "demo";

const navItems: Array<{ id: NavView; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "landing", label: "Home", icon: FaHome },
  { id: "dashboard", label: "Dashboard", icon: FaChartBar },
  { id: "explorer", label: "Explorer", icon: FaCompass },
  { id: "demo", label: "Verification Lab", icon: FaFlask },
];

export default function Navbar() {
  const { view, navigate } = useKyaRuntime();
  const currentPage = view.view;

  return (
    <header className="sticky top-0 z-30 border-b border-[#d3ddd7] bg-white backdrop-blur-sm">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-4 px-5 py-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-[#d5e1da] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f3128] transition-colors duration-150 hover:border-[#b9ccc1]"
          onClick={() => navigate({ view: "landing" })}
        >
          <FaCat className="text-[12px] text-emerald-600" />
          KittYA
        </button>

        <nav className="flex flex-1 flex-wrap gap-2 text-xs uppercase tracking-[0.12em]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={
                  active
                    ? "flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-emerald-800"
                    : "flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-[#5f7469] transition-colors duration-150 hover:border-[#c9d8d0] hover:bg-white hover:text-[#22352b]"
                }
                onClick={() => navigate({ view: item.id })}
              >
                <Icon className="text-[11px]" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
