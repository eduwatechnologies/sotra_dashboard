"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { Sidebar } from "./sidebar";

const pageTitles: Record<string, string> = {
  "/": "Market overview",
  "/markets": "Markets",
  "/signals": "Latest setup",
  "/strategy": "Strategy",
  "/alerts": "Alerts",
  "/settings": "Settings",
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="dashboard-background relative min-h-screen overflow-hidden">
      <div className="subtle-grid pointer-events-none absolute inset-x-0 top-0 h-[480px]" />
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="relative min-w-0 lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.065] bg-[#090b0e]/85 backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-7 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] text-[#c2c4c8] hover:bg-white/[0.06] lg:hidden"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#747b86]">
                  Sotra Signals
                </p>
                <p className="mt-0.5 truncate text-xs font-medium text-[#e1dfd9]">
                  {pageTitles[pathname] ?? "Dashboard"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-white/[0.075] bg-white/[0.025] px-3 py-1.5 text-[10px] text-[#a2a7b0] sm:inline-flex">
                <span className="size-1.5 rounded-full bg-[#efbd5b]" />
                Private workspace
              </span>
              <Link
                href="/alerts"
                aria-label="Manage alerts"
                title="Manage alerts"
                className="relative grid size-9 place-items-center rounded-xl border border-white/[0.075] bg-white/[0.025] text-[#9297a1] transition hover:bg-white/[0.06] hover:text-white"
              >
                <Bell size={16} strokeWidth={1.8} />
              </Link>
              <div className="grid size-9 place-items-center rounded-xl border border-[#efbd5b]/20 bg-[#efbd5b]/[0.09] text-xs font-semibold text-[#f0ca7e]">
                S
              </div>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
