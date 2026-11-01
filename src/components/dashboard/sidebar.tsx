"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BellRing,
  ChartNoAxesCombined,
  CircleHelp,
  LayoutDashboard,
  Menu,
  Settings2,
  SlidersHorizontal,
  X,
} from "lucide-react";

const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: ChartNoAxesCombined },
  { label: "Latest setup", href: "/signals", icon: Activity },
  { label: "Strategy", href: "/strategy", icon: SlidersHorizontal },
  { label: "Alerts", href: "/alerts", icon: BellRing },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/[0.07] bg-[#0c0e12] px-5 pb-5 pt-6 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3"
            aria-label="Sotra Signals home"
          >
            <span className="grid size-10 place-items-center rounded-[13px] border border-[#efbd5b]/25 bg-gradient-to-br from-[#efbd5b]/20 to-[#efbd5b]/[0.04] text-[#efbd5b] shadow-[0_0_24px_rgba(239,189,91,0.08)]">
              <ChartNoAxesCombined size={20} strokeWidth={1.8} />
            </span>
            <span>
              <span className="block text-[15px] font-semibold tracking-[0.13em] text-white">
                SOTRA
              </span>
              <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.24em] text-[#9297a1]">
                Signals workspace
              </span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-[#9297a1] hover:bg-white/[0.06] lg:hidden"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-10">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666d78]">
            Workspace
          </p>
          <nav className="mt-3 space-y-1">
            {navigation.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
              <Link
                key={label}
                href={href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors ${
                  active
                    ? "border border-[#efbd5b]/[0.13] bg-[#efbd5b]/[0.075] text-[#f2ca78]"
                    : "text-[#9297a1] hover:bg-white/[0.045] hover:text-[#f1f0eb]"
                }`}
              >
                <Icon size={17} strokeWidth={1.7} />
                <span className="flex-1">{label}</span>
                {active ? (
                  <span className="size-1.5 rounded-full bg-[#efbd5b]" />
                ) : null}
              </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto">
          <div className="rounded-2xl border border-white/[0.075] bg-[#12151a] p-4">
            <div className="flex items-center gap-2 text-[#efbd5b]">
              <CircleHelp size={15} />
              <p className="text-xs font-medium text-[#d7d4cd]">Analysis only</p>
            </div>
            <p className="mt-2 text-[11px] leading-[1.65] text-[#818792]">
              Sotra shares market analysis and alerts. It does not place or manage trades.
            </p>
            <Link
              href="/#about-preview"
              onClick={onClose}
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-[#efbd5b] hover:text-[#ffda91]"
            >
              About this preview <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-2 px-1 text-[10px] text-[#69707a]">
            <Menu size={13} />
            <span>Private workspace</span>
            <span className="ml-auto">v0.1</span>
          </div>
        </div>
      </aside>
    </>
  );
}
