"use client";

import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = false,
  delay = 0,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent?: boolean;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className="group rounded-2xl border border-white/[0.075] bg-[#101318]/90 p-5 shadow-[0_12px_42px_rgba(0,0,0,0.12)] transition-colors hover:border-white/[0.13] sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-[#858b96]">
          {label}
        </p>
        <span
          className={`grid size-9 place-items-center rounded-xl border ${
            accent
              ? "border-[#efbd5b]/15 bg-[#efbd5b]/[0.08] text-[#efbd5b]"
              : "border-white/[0.07] bg-white/[0.035] text-[#aeb3bc]"
          }`}
        >
          <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-5 text-[25px] font-semibold tracking-[-0.05em] text-[#f4f3ef]">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-[#858b96]">{detail}</p>
    </motion.article>
  );
}
