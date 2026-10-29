"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CircleDot,
  Clock3,
  Menu,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { CardHeading, DashboardCard } from "./dashboard-card";
import { marketLabel } from "./dashboard-data";
import { MetricCard } from "./metric-card";
import { PriceChart } from "./price-chart";
import { Sidebar } from "./sidebar";
import {
  isDashboardScanResponse,
  isDashboardStatus,
  type DashboardScanResponse,
  type DashboardStatus,
  type SignalData,
} from "@/lib/dashboard-types";

async function readJson(response: Response): Promise<unknown> {
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      data !== null &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Dashboard request failed";
    throw new Error(message);
  }
  return data;
}

async function getDashboardStatus(): Promise<DashboardStatus> {
  const response = await fetch("/api/dashboard/status", { cache: "no-store" });
  const data = await readJson(response);
  if (!isDashboardStatus(data)) {
    throw new Error("Dashboard returned an invalid status response");
  }
  return data;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected dashboard error";
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  }).format(value);
}

function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatDuration(milliseconds: number): string {
  const minutes = Math.round(milliseconds / 60_000);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("XAU/USD");
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"pause" | "scan" | null>(null);
  const [scanResponse, setScanResponse] = useState<DashboardScanResponse | null>(null);
  const reduceMotion = useReducedMotion();
  const symbols = status?.symbols ?? [];
  const chartSymbol = symbols.includes(selectedSymbol)
    ? selectedSymbol
    : (symbols[0] ?? selectedSymbol);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const nextStatus = await getDashboardStatus();
        if (active) {
          setStatus(nextStatus);
          setLoadError(null);
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  async function changePauseState() {
    if (!status || pendingAction) {
      return;
    }
    const paused = !status.paused;
    const confirmation = paused
      ? "Pause scheduled signal alerts? Manual scans will still analyze markets but won't send alerts while paused."
      : "Resume scheduled signal alerts?";
    if (!window.confirm(confirmation)) {
      return;
    }

    setPendingAction("pause");
    setActionError(null);
    try {
      const response = await fetch("/api/dashboard/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused }),
      });
      const data: unknown = await readJson(response);
      if (
        data === null ||
        typeof data !== "object" ||
        !("paused" in data) ||
        data.paused !== paused
      ) {
        throw new Error("Dashboard returned an invalid alert-state response");
      }
      setStatus((current) => (current ? { ...current, paused } : current));
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function runManualScan() {
    if (!status || pendingAction) {
      return;
    }
    const confirmation = status.paused
      ? "Run a manual analysis scan? Alerts are paused, so this scan will not send Telegram notifications."
      : "Run a manual scan? New signals may be sent to your configured Telegram chat.";
    if (!window.confirm(confirmation)) {
      return;
    }

    setPendingAction("scan");
    setActionError(null);
    setScanResponse(null);
    try {
      const response = await fetch("/api/dashboard/scan", { method: "POST" });
      const data: unknown = await readJson(response);
      if (!isDashboardScanResponse(data)) {
        throw new Error("Dashboard returned an invalid scan response");
      }
      setScanResponse(data);
      setStatus((current) =>
        current ? { ...current, paused: data.paused } : current
      );
      try {
        setStatus(await getDashboardStatus());
        setLoadError(null);
      } catch (error) {
        setActionError(`Scan completed, but status refresh failed: ${errorMessage(error)}`);
      }
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

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
                  Market overview
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-white/[0.075] bg-white/[0.025] px-3 py-1.5 text-[10px] text-[#a2a7b0] sm:inline-flex">
                <span
                  className={`size-1.5 rounded-full ${
                    status ? "bg-emerald-400" : "bg-[#8d929c]"
                  }`}
                />
                {loading && !status
                  ? "Connecting…"
                  : status
                    ? "Sotra API connected"
                    : "Sotra API unavailable"}
              </span>
              <button
                type="button"
                disabled
                aria-label="Notifications (not available)"
                title="Notifications are not connected"
                className="relative grid size-9 cursor-not-allowed place-items-center rounded-xl border border-white/[0.075] bg-white/[0.025] text-[#737984]"
              >
                <Bell size={16} strokeWidth={1.8} />
              </button>
              <div className="grid size-9 place-items-center rounded-xl border border-[#efbd5b]/20 bg-[#efbd5b]/[0.09] text-xs font-semibold text-[#f0ca7e]">
                S
              </div>
            </div>
          </div>
        </header>

        <main
          id="overview"
          className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-7 sm:px-7 sm:pt-9 lg:px-10 lg:pt-10"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mb-7 flex flex-col justify-between gap-5 sm:mb-8 sm:flex-row sm:items-end"
          >
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#efbd5b]/15 bg-[#efbd5b]/[0.055] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#eac16e]">
                <Sparkles size={12} />
                Sotra dashboard
              </div>
              <h1 className="text-[30px] font-semibold tracking-[-0.055em] text-[#f4f3ef] sm:text-[36px]">
                Market overview<span className="text-[#efbd5b]">.</span>
              </h1>
              <p className="mt-2 max-w-xl text-[13px] leading-6 text-[#9297a1]">
                Your configured markets, alert status, and latest detected setup.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[11px] text-[#aaafb7] sm:self-auto">
              <Clock3 size={14} className="text-[#858b96]" />
              Live bot status · refreshes every 30 sec
            </div>
          </motion.div>

          <div
            role="note"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-[#efbd5b]/[0.16] bg-[#efbd5b]/[0.045] px-4 py-3.5 sm:items-center"
          >
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#efbd5b]/[0.1] text-[#efbd5b] sm:mt-0">
              <CircleDot size={15} />
            </span>
            <p className="text-[11px] leading-5 text-[#c2b9a4]">
              <span className="font-semibold text-[#eed29b]">Analysis only.</span>{" "}
              Manual scans may send Telegram alerts when alerts are active. Sotra never
              places or manages trades. The chart below is illustrative; live prices are not
              connected.
            </p>
          </div>

          {loadError ? (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.055] px-4 py-3 text-xs text-rose-200"
            >
              Could not load Sotra status: {loadError}
            </div>
          ) : null}
          {actionError ? (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.055] px-4 py-3 text-xs text-rose-200"
            >
              {actionError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Scheduled alerts"
              value={
                loading && !status
                  ? "Loading…"
                  : status
                    ? status.paused
                      ? "Paused"
                      : "Active"
                    : "Unavailable"
              }
              detail={
                status
                  ? status.paused
                    ? "No scheduled signal alerts"
                    : "Scheduled signal alerts enabled"
                  : "Waiting for bot status"
              }
              icon={Radio}
              accent
              delay={0.04}
            />
            <MetricCard
              label="Markets watched"
              value={status ? String(status.symbols.length).padStart(2, "0") : "—"}
              detail={status ? status.symbols.join(" · ") : "Configured watchlist"}
              icon={TrendingUp}
              delay={0.1}
            />
            <MetricCard
              label="Candle interval"
              value={status?.interval ?? (loading ? "Loading…" : "—")}
              detail="Configured market-data interval"
              icon={Clock3}
              delay={0.16}
            />
            <MetricCard
              label="Planned reward / risk"
              value={status ? `1 : ${status.minRewardRisk}` : "—"}
              detail="Configured minimum target"
              icon={Target}
              accent
              delay={0.22}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!status || pendingAction !== null}
              onClick={() => void changePauseState()}
              className="rounded-xl border border-[#efbd5b]/20 bg-[#efbd5b]/[0.08] px-4 py-2.5 text-xs font-medium text-[#f0ca7e] transition hover:bg-[#efbd5b]/[0.14] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {pendingAction === "pause"
                ? "Updating alerts…"
                : status?.paused
                  ? "Resume alerts"
                  : "Pause alerts"}
            </button>
            <button
              type="button"
              disabled={!status || pendingAction !== null}
              onClick={() => void runManualScan()}
              className="rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-2.5 text-xs font-medium text-[#d3d1cb] transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {pendingAction === "scan" ? "Scanning markets…" : "Run manual scan"}
            </button>
            {status ? (
              <span className="text-[10px] text-[#777e88]">
                Scheduled cadence: {formatDuration(status.scanIntervalMs)}
              </span>
            ) : null}
          </div>

          {scanResponse ? (
            <DashboardCard className="mt-4 p-4 sm:p-5">
              <CardHeading
                title="Manual scan results"
                description={
                  scanResponse.paused
                    ? "Scan completed while alerts were paused; no alerts were sent."
                    : "Scan completed. New signals may have been sent to Telegram."
                }
                action={
                  <button
                    type="button"
                    onClick={() => setScanResponse(null)}
                    aria-label="Dismiss scan results"
                    className="rounded-lg p-1 text-[#858b96] hover:bg-white/[0.06] hover:text-white"
                  >
                    <X size={16} />
                  </button>
                }
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {scanResponse.results.map((result) => (
                  <div
                    key={result.symbol}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#d8d6d0]">{result.symbol}</p>
                      <p className="mt-1 text-[10px] text-[#858b96]">
                        {result.error ?? scanResultLabel(result.status, result.sent)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-medium uppercase tracking-wide ${
                        result.status === "error"
                          ? "bg-rose-400/[0.08] text-rose-300"
                          : result.status === "signal"
                            ? "bg-emerald-400/[0.08] text-emerald-300"
                            : "bg-white/[0.05] text-[#a3a8b0]"
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
            <DashboardCard
              id="markets"
              className="min-w-0 p-4 sm:p-5 xl:col-span-8"
            >
              <CardHeading
                title="Market watch"
                description="Configured markets · chart preview is not live market data"
                action={
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-[10px] text-[#9297a1]">
                    <span
                      className={`size-1.5 rounded-full ${
                        status ? "bg-emerald-400" : "bg-[#8c929c]"
                      }`}
                    />
                    {status ? "Connected" : loading ? "Loading" : "Unavailable"}
                  </span>
                }
              />
              <PriceChart symbol={chartSymbol} />
              <div className="mt-5">
                {loading && !status ? (
                  <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-center text-xs text-[#858b96]">
                    Loading configured markets…
                  </p>
                ) : symbols.length ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {symbols.map((symbol) => {
                      const selected = symbol === chartSymbol;
                      return (
                        <button
                          key={symbol}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setSelectedSymbol(symbol)}
                          className={`rounded-xl border p-3 text-left transition-colors ${
                            selected
                              ? "border-[#efbd5b]/25 bg-[#efbd5b]/[0.055]"
                              : "border-white/[0.065] bg-white/[0.018] hover:border-white/[0.13] hover:bg-white/[0.035]"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-[#e1dfd9]">
                              {symbol}
                            </span>
                            {selected ? (
                              <span className="size-1.5 rounded-full bg-[#efbd5b]" />
                            ) : (
                              <ArrowUpRight size={14} className="text-[#777e88]" />
                            )}
                          </span>
                          <span className="mt-2 block text-[10px] text-[#7d838d]">
                            {marketLabel(symbol)}
                          </span>
                          <span className="mt-2 block text-[10px] text-[#858b96]">
                            Configured market
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    message={
                      loadError
                        ? "Configured markets are unavailable."
                        : "No markets are configured."
                    }
                  />
                )}
              </div>
            </DashboardCard>

            <DashboardCard
              id="latest-setup"
              className="flex flex-col p-4 sm:p-5 xl:col-span-4"
            >
              <CardHeading
                title="Latest setup"
                description="Most recently detected signal"
                action={
                  status?.latestSignal ? (
                    <span className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[9px] font-medium text-[#a5aab2]">
                      Bot state
                    </span>
                  ) : null
                }
              />
              {status?.latestSignal ? (
                <SignalDetails signal={status.latestSignal} />
              ) : (
                <div className="mt-5 flex min-h-[220px] flex-1 items-center justify-center">
                  <EmptyState
                    message={
                      loading
                        ? "Loading latest signal…"
                        : loadError
                          ? "Latest signal is unavailable."
                          : "No signal has been detected yet."
                    }
                  />
                </div>
              )}
            </DashboardCard>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <DashboardCard className="p-4 sm:p-5 lg:col-span-7">
              <CardHeading
                title="Watchlist"
                description="Symbols currently configured in Sotra"
                action={
                  <span className="rounded-md border border-white/[0.07] px-2 py-1 text-[10px] text-[#9297a1]">
                    {status ? `${symbols.length} symbols` : "—"}
                  </span>
                }
              />
              {symbols.length ? (
                <div className="mt-4 divide-y divide-white/[0.055]">
                  {symbols.map((symbol) => (
                    <button
                      type="button"
                      key={symbol}
                      onClick={() => {
                        setSelectedSymbol(symbol);
                        document.getElementById("markets")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      className="flex w-full items-center gap-3 py-3.5 text-left first:pt-1 last:pb-1 hover:bg-white/[0.018]"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.065] bg-white/[0.025] text-[10px] font-semibold text-[#d1d0ca]">
                        {symbol.split("/")[0].slice(0, 3)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-[#e3e1dc]">
                          {symbol}
                        </span>
                        <span className="mt-1 block truncate text-[10px] text-[#7d838d]">
                          {marketLabel(symbol)}
                        </span>
                      </span>
                      <span className="text-right text-[10px] text-[#747b86]">
                        Candle interval
                        <span className="mt-1 block text-xs text-[#c9c7c1]">
                          {status?.interval ?? "—"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState
                    message={loading ? "Loading configured markets…" : "Watchlist unavailable."}
                  />
                </div>
              )}
            </DashboardCard>

            <DashboardCard className="p-4 sm:p-5 lg:col-span-5">
              <CardHeading
                title="Workspace status"
                description="Connection and strategy settings"
              />
              <div className="mt-5 space-y-3">
                <StatusRow
                  icon={Radio}
                  label="Dashboard API"
                  value={
                    loading && !status
                      ? "Connecting"
                      : status
                        ? "Connected"
                        : "Unavailable"
                  }
                  status={status ? "online" : "offline"}
                />
                <StatusRow
                  icon={Bell}
                  label="Scheduled alerts"
                  value={
                    status
                      ? status.paused
                        ? "Paused"
                        : "Active"
                      : loading
                        ? "Loading"
                        : "Unavailable"
                  }
                  status={status ? (status.paused ? "paused" : "online") : "offline"}
                />
                <StatusRow
                  icon={Clock3}
                  label="Scheduled scan cadence"
                  value={status ? formatDuration(status.scanIntervalMs) : "Unavailable"}
                  status="neutral"
                />
                <StatusRow
                  icon={Target}
                  label="Minimum reward / risk"
                  value={status ? `1 : ${status.minRewardRisk}` : "Unavailable"}
                  status="neutral"
                />
              </div>
              <div
                id="about-preview"
                className="mt-5 rounded-xl border border-white/[0.065] bg-[#0d1014] p-3.5"
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-[#efbd5b]">
                    <ShieldCheck size={14} />
                  </span>
                  <p className="text-[10px] leading-[1.7] text-[#9297a1]">
                    Dashboard controls change alert state or request analysis only. No
                    broker connection or order execution is available.
                  </p>
                </div>
              </div>
            </DashboardCard>
          </div>

          <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[10px] text-[#686f79] sm:flex-row sm:items-center sm:justify-between">
            <p>Sotra Signals · Private market-analysis workspace</p>
            <p>Analysis only · No trade execution</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function SignalDetails({ signal }: { signal: SignalData }) {
  return (
    <>
      <div className="mt-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[19px] font-semibold tracking-[-0.04em] text-[#f1f0eb]">
            {signal.symbol}
          </p>
          <p className="mt-1 text-[10px] text-[#818792]">Detected signal</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${
            signal.direction === "BUY"
              ? "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300"
              : "border-rose-400/15 bg-rose-400/[0.07] text-rose-300"
          }`}
        >
          {signal.direction === "BUY" ? (
            <ArrowUpRight size={13} />
          ) : (
            <ArrowDownRight size={13} />
          )}
          {signal.direction}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <SignalLevel label="Entry" value={formatPrice(signal.entry)} />
        <SignalLevel label="Stop loss" value={formatPrice(signal.stopLoss)} />
        <SignalLevel label="Take profit" value={formatPrice(signal.takeProfit)} />
        <SignalLevel
          label="Reward / risk"
          value={`1 : ${signal.rewardRisk.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}`}
        />
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.065] bg-white/[0.022] p-3.5">
        <div className="flex items-center gap-2 text-[#b8a274]">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-medium">Setup rationale</span>
        </div>
        <p className="mt-2 text-[11px] leading-[1.65] text-[#999ea7]">
          {signal.rationale}
        </p>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-5 text-[10px] text-[#747b86]">
        <Clock3 size={13} />
        {formatTimestamp(signal.timestamp)}
      </div>
    </>
  );
}

function SignalLevel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.022] px-3 py-2.5">
      <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#777e88]">
        {label}
      </p>
      <p className="mt-1.5 text-[12px] font-semibold tabular-nums text-[#dedcd6]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-full rounded-xl border border-dashed border-white/[0.09] px-4 py-5 text-center">
      <p className="text-xs text-[#9297a1]">{message}</p>
    </div>
  );
}

function scanResultLabel(
  status: DashboardScanResponse["results"][number]["status"],
  sent?: boolean
): string {
  if (status === "signal") {
    return sent ? "Signal sent to Telegram" : "Signal found; no alert sent";
  }
  if (status === "duplicate") {
    return "Signal was already delivered";
  }
  if (status === "paused") {
    return "Skipped because scheduled alerts are paused";
  }
  if (status === "no signal") {
    return "No setup detected";
  }
  return "Market data unavailable";
}

function StatusRow({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: typeof Radio;
  label: string;
  value: string;
  status: "offline" | "paused" | "neutral" | "online";
}) {
  const color =
    status === "online"
      ? "bg-emerald-400"
      : status === "paused"
        ? "bg-[#efbd5b]"
        : status === "offline"
          ? "bg-rose-400"
          : "bg-[#777e88]";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.055] bg-white/[0.018] px-3 py-3">
      <span className="text-[#8f959f]">
        <Icon size={15} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] text-[#818792]">{label}</span>
        <span className="mt-1 block text-xs font-medium text-[#d2d0ca]">{value}</span>
      </span>
      <span className={`size-1.5 shrink-0 rounded-full ${color}`} />
    </div>
  );
}
