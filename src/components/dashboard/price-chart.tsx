"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { chartPreviewPoints } from "./dashboard-data";

const chartWidth = 820;
const chartHeight = 250;

function createPath(values: number[]) {
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * chartWidth;
      const y = 24 + (value / 60) * (chartHeight - 48);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function PriceChart({ symbol }: { symbol: string }) {
  const reduceMotion = useReducedMotion();
  const line = useMemo(() => createPath(chartPreviewPoints), []);
  const lastValue = chartPreviewPoints[chartPreviewPoints.length - 1];
  const lastY = 24 + (lastValue / 60) * (chartHeight - 48);
  const bars = [20, 30, 17, 38, 27, 21, 43, 25, 33, 18, 40, 28, 22, 36, 16, 31, 24, 39, 19, 29, 44, 25, 33, 21];

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[18px] font-semibold tracking-[-0.04em] text-[#f4f3ef]">
            {symbol}
          </p>
          <p className="mt-1 text-xs text-[#858b96]">
            Illustrative chart only · live prices unavailable
          </p>
        </div>
        <span className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-[10px] text-[#9297a1]">
          Design preview
        </span>
      </div>

      <div className="relative -mx-2 overflow-hidden sm:mx-0">
        <svg
          viewBox={`0 0 ${chartWidth} 310`}
          className="h-[210px] w-full overflow-visible sm:h-[250px]"
          role="img"
          aria-label={`Illustrative, non-live chart preview for ${symbol}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#efbd5b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#efbd5b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="chartStroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#c88e37" />
              <stop offset="100%" stopColor="#f4cf7c" />
            </linearGradient>
          </defs>
          {[40, 95, 150, 205, 260].map((y) => (
            <line
              key={y}
              x1="0"
              x2={chartWidth}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.065)"
              strokeDasharray="3 7"
            />
          ))}
          <path
            d={`${line} L ${chartWidth} 286 L 0 286 Z`}
            fill="url(#chartFill)"
            transform="translate(0 10)"
          />
          <motion.path
            d={line}
            fill="none"
            stroke="url(#chartStroke)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0.55 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.25, ease: "easeOut" }}
          />
          <line
            x1="0"
            x2={chartWidth}
            y1={lastY}
            y2={lastY}
            stroke="rgba(239,189,91,0.28)"
            strokeDasharray="4 6"
          />
          <circle cx={chartWidth} cy={lastY} r="5" fill="#efbd5b" />
          <circle
            cx={chartWidth}
            cy={lastY}
            r="10"
            fill="rgba(239,189,91,0.14)"
          />
          {bars.map((height, index) => (
            <rect
              key={`${index}-${height}`}
              x={8 + index * 34}
              y={302 - height}
              width="11"
              height={height}
              rx="3"
              fill={index % 4 === 1 ? "rgba(227,139,112,0.22)" : "rgba(239,189,91,0.18)"}
            />
          ))}
        </svg>
        <div className="mt-1 flex justify-between px-1 text-[10px] text-[#6f7580]">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}
