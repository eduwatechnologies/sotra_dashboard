"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { CardHeading, DashboardCard } from "./dashboard-card";
import {
  isStrategyParameters,
  isDashboardPerformance,
  isStrategyProfilesResponse,
  type DashboardPerformance,
  type StrategyParameters,
  type StrategyProfile,
  type StrategyProfilesResponse,
} from "@/lib/dashboard-types";

const parameterFields: Array<{
  key: keyof StrategyParameters;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
}> = [
  {
    key: "minRewardRisk",
    label: "Minimum reward / risk",
    description: "Signal target ratio",
    min: 0.1,
    max: 100,
    step: 0.1,
  },
  {
    key: "swingLookback",
    label: "Swing lookback",
    description: "Prior candles used for the liquidity extreme",
    min: 1,
    max: 100,
    step: 1,
  },
  {
    key: "structureLookback",
    label: "Structure lookback",
    description: "Candles used to establish structure before a sweep",
    min: 1,
    max: 100,
    step: 1,
  },
  {
    key: "maxBarsSinceSweep",
    label: "Maximum bars since sweep",
    description: "Maximum completed bars before confirmation",
    min: 1,
    max: 20,
    step: 1,
  },
  {
    key: "atrPeriod",
    label: "ATR period",
    description: "Candles used to calculate average true range",
    min: 1,
    max: 100,
    step: 1,
  },
  {
    key: "maxRiskAtrMultiple",
    label: "Maximum risk / ATR",
    description: "Maximum stop distance as an ATR multiple",
    min: 0.1,
    max: 20,
    step: 0.1,
  },
  {
    key: "maxCandleAgeMinutes",
    label: "Maximum candle age (minutes)",
    description: "Reject signals based on older completed candles",
    min: 1,
    max: 1440,
    step: 1,
  },
];

async function readJson(response: Response): Promise<unknown> {
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      data !== null &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Strategy request failed";
    throw new Error(message);
  }
  return data;
}

function activeParameters(data: StrategyProfilesResponse): StrategyParameters {
  return (
    data.profiles.find((profile) => profile.id === data.activeProfileId) ??
    data.defaultParameters
  );
}

function formatParameter(key: keyof StrategyParameters, value: number): string {
  if (key === "minRewardRisk") {
    return `1 : ${value}`;
  }
  if (key === "maxRiskAtrMultiple") {
    return `${value}×`;
  }
  if (key === "maxCandleAgeMinutes") {
    return `${value} min`;
  }
  return String(value);
}

export function StrategyPage() {
  const [data, setData] = useState<StrategyProfilesResponse | null>(null);
  const [performance, setPerformance] = useState<DashboardPerformance | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftParameters, setDraftParameters] = useState<StrategyParameters | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [performanceError, setPerformanceError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!createOpen || !dialog) {
      return;
    }
    dialog.showModal();
    return () => dialog.close();
  }, [createOpen]);

  useEffect(() => {
    let active = true;
    void fetch("/api/dashboard/strategies", { cache: "no-store" })
      .then(readJson)
      .then((response) => {
        if (!isStrategyProfilesResponse(response)) {
          throw new Error("Dashboard returned invalid strategy profiles");
        }
        if (active) {
          setData(response);
          setDraftParameters(activeParameters(response));
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Strategy profiles unavailable");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/dashboard/performance", { cache: "no-store" })
      .then(readJson)
      .then((response) => {
        if (!isDashboardPerformance(response)) {
          throw new Error("Dashboard returned invalid signal performance data");
        }
        if (active) {
          setPerformance(response);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setPerformanceError(
            cause instanceof Error ? cause.message : "Signal performance unavailable"
          );
        }
      })
      .finally(() => {
        if (active) {
          setPerformanceLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(
    action: Record<string, unknown>,
    successMessage: string
  ): Promise<boolean> {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/dashboard/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const result: unknown = await readJson(response);
      if (!isStrategyProfilesResponse(result)) {
        throw new Error("Dashboard returned invalid strategy profiles");
      }
      setData(result);
      setDraftParameters(activeParameters(result));
      setMessage(successMessage);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Strategy profile action failed");
      return false;
    } finally {
      setPending(false);
    }
  }

  function createProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftParameters || !isStrategyParameters(draftParameters)) {
      setError("Enter valid values for every strategy parameter.");
      return;
    }
    void submit(
      { action: "create", name: draftName.trim(), parameters: draftParameters },
      "Strategy profile created. Activate it when you are ready to use it."
    ).then((created) => {
      if (created) {
        setDraftName("");
        setCreateOpen(false);
      }
    });
  }

  function openCreateDialog() {
    if (!data || pending || data.profiles.length >= 20) {
      return;
    }
    setError(null);
    setMessage(null);
    setDraftName("");
    setDraftParameters({ ...activeParameters(data) });
    setCreateOpen(true);
  }

  function deleteProfile(profile: StrategyProfile) {
    if (
      profile.id === data?.activeProfileId ||
      !window.confirm(`Delete the inactive profile "${profile.name}"?`)
    ) {
      return;
    }
    void submit(
      { action: "delete", profileId: profile.id },
      `${profile.name} deleted.`
    );
  }

  const baseline = data?.defaultParameters;
  const currentParameters = data ? activeParameters(data) : null;

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-7 sm:px-7 sm:pt-9 lg:px-10 lg:pt-10">
      <div className="mb-7">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#efbd5b]/15 bg-[#efbd5b]/[0.055] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#eac16e]">
          Strategy configuration
        </p>
        <h1 className="text-[30px] font-semibold tracking-[-0.055em] text-[#f4f3ef] sm:text-[36px]">
          Strategy<span className="text-[#efbd5b]">.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#9297a1]">
          Create named profiles for the existing liquidity-sweep strategy, activate one for
          future scans, and compare its configuration with other profiles.
        </p>
      </div>

      <div
        role="note"
        className="mb-5 rounded-2xl border border-[#efbd5b]/[0.16] bg-[#efbd5b]/[0.045] px-4 py-3.5 text-[11px] leading-5 text-[#c2b9a4]"
      >
        These profiles change parameters for the current strategy; they do not add new
        strategy logic or demonstrate historical performance. Only one profile is active at
        a time. Activations affect future scans, not signals already produced.
      </div>

      {error && !createOpen ? (
        <div role="alert" className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.055] px-4 py-3 text-xs text-rose-200">
          {error}
        </div>
      ) : null}
      {message ? (
        <div role="status" className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.045] px-4 py-3 text-xs text-emerald-200">
          {message}
        </div>
      ) : null}

      <DashboardCard className="p-4 sm:p-5">
        <CardHeading
          title="Strategy profiles"
          description="Create and save named configurations for the current strategy."
          action={
            <span className="rounded-md border border-white/[0.07] px-2 py-1 text-[10px] text-[#9297a1]">
              {data ? `${data.profiles.length}/20 profiles` : "—"}
            </span>
          }
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-[#858b96]">
            New profiles start with the currently active configuration. Adjust parameters
            after opening the editor.
          </p>
          <button
            type="button"
            disabled={loading || !data || pending || data.profiles.length >= 20}
            onClick={openCreateDialog}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#efbd5b]/20 bg-[#efbd5b]/[0.08] px-4 py-2.5 text-xs font-medium text-[#f0ca7e] transition hover:bg-[#efbd5b]/[0.14] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Plus size={14} />
            Create strategy
          </button>
        </div>
      </DashboardCard>

      <dialog
        ref={dialogRef}
        aria-labelledby="create-strategy-title"
        onClose={() => setCreateOpen(false)}
        className="m-auto max-h-[90dvh] w-[min(94vw,900px)] max-w-none overflow-hidden rounded-2xl border border-white/[0.1] bg-[#101318] p-0 text-[#f4f3ef] shadow-[0_24px_100px_rgba(0,0,0,0.65)] backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      >
        <div className="flex max-h-[90dvh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-4 py-4 sm:px-6">
            <div>
              <h2 id="create-strategy-title" className="text-base font-semibold text-[#f3f1ec]">
                Create strategy profile
              </h2>
              <p className="mt-1 text-xs text-[#858b96]">
                Give this parameter configuration a name.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close create strategy dialog"
              onClick={() => setCreateOpen(false)}
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.07] text-[#9297a1] hover:bg-white/[0.06] hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
          {draftParameters ? (
            <form onSubmit={createProfile} className="soft-scrollbar overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {error ? (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.055] px-4 py-3 text-xs text-rose-200"
                >
                  {error}
                </div>
              ) : null}
              <label className="block max-w-lg text-[10px] text-[#9297a1]">
                Profile name
                <input
                  required
                  autoFocus
                  maxLength={40}
                  value={draftName}
                  disabled={pending}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="e.g. Conservative confirmation"
                  className="mt-1.5 w-full rounded-lg border border-white/[0.09] bg-[#0d1014] px-3 py-2.5 text-xs text-[#e1dfd9] outline-none focus:border-[#efbd5b]/40 disabled:opacity-50"
                />
              </label>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {parameterFields.map(({ key, label, description, min, max, step }) => (
                  <label key={key} className="text-[10px] text-[#9297a1]">
                    {label}
                    <input
                      required
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      disabled={pending}
                      value={draftParameters[key]}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setDraftParameters((current) =>
                          current ? { ...current, [key]: value } : current
                        );
                      }}
                      className="mt-1.5 w-full rounded-lg border border-white/[0.09] bg-[#0d1014] px-3 py-2.5 text-xs text-[#e1dfd9] outline-none focus:border-[#efbd5b]/40 disabled:opacity-50"
                    />
                    <span className="mt-1 block text-[9px] text-[#686f79]">{description}</span>
                  </label>
                ))}
              </div>
              <div className="sticky bottom-0 -mx-4 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] bg-[#101318] px-4 pt-4 sm:-mx-6 sm:px-6">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => baseline && setDraftParameters({ ...baseline })}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-2.5 text-xs text-[#d3d1cb] hover:bg-white/[0.07] disabled:opacity-45"
                >
                  <RotateCcw size={13} />
                  Use defaults
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setCreateOpen(false)}
                    className="rounded-xl border border-white/[0.09] px-4 py-2.5 text-xs text-[#d3d1cb] hover:bg-white/[0.05] disabled:opacity-45"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending || !data || data.profiles.length >= 20}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#efbd5b]/20 bg-[#efbd5b]/[0.08] px-4 py-2.5 text-xs font-medium text-[#f0ca7e] transition hover:bg-[#efbd5b]/[0.14] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Plus size={14} />
                    {pending ? "Saving…" : "Save strategy"}
                  </button>
                </div>
              </div>
            </form>
          ) : null}
        </div>
      </dialog>

      <DashboardCard className="mt-5 p-4 sm:p-5">
        <CardHeading
          title="Configuration comparison"
          description="Settings comparison only—not a backtest or performance ranking."
        />
        {data && currentParameters ? (
          <div className="soft-scrollbar mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th scope="col" className="sticky left-0 bg-[#101318] px-3 py-3 text-[10px] font-medium text-[#858b96]">
                    Parameter
                  </th>
                  <th scope="col" className="min-w-[155px] px-3 py-3">
                    <span className="block text-xs font-medium text-[#d7d4cd]">Default</span>
                    <span className="mt-1 block text-[9px] text-[#777e88]">
                      {data.activeProfileId === null ? "Active" : "Environment"}
                    </span>
                  </th>
                  {data.profiles.map((profile) => (
                    <th key={profile.id} scope="col" className="min-w-[155px] px-3 py-3">
                      <span className="block truncate text-xs font-medium text-[#d7d4cd]">
                        {profile.name}
                      </span>
                      <span className="mt-1 block text-[9px] text-[#777e88]">
                        {profile.id === data.activeProfileId ? "Active" : "Saved profile"}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parameterFields.map(({ key, label }) => (
                  <tr key={key} className="border-b border-white/[0.045] last:border-0">
                    <th scope="row" className="sticky left-0 bg-[#101318] px-3 py-3 text-[10px] font-medium text-[#9297a1]">
                      {label}
                    </th>
                    <td className="px-3 py-3 tabular-nums text-[#c9c7c1]">
                      {formatParameter(key, data.defaultParameters[key])}
                    </td>
                    {data.profiles.map((profile) => (
                      <td key={profile.id} className="px-3 py-3 tabular-nums text-[#c9c7c1]">
                        {formatParameter(key, profile[key])}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="sticky left-0 bg-[#101318] px-3 py-3 text-[10px] font-medium text-[#9297a1]">
                    Actions
                  </th>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      disabled={pending || data.activeProfileId === null}
                      onClick={() =>
                        void submit({ action: "activate", profileId: null }, "Default strategy activated.")
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.09] px-2.5 py-1.5 text-[10px] text-[#d3d1cb] hover:bg-white/[0.06] disabled:opacity-45"
                    >
                      {data.activeProfileId === null ? <Check size={12} /> : null}
                      {data.activeProfileId === null ? "Active" : "Use default"}
                    </button>
                  </td>
                  {data.profiles.map((profile) => {
                    const active = profile.id === data.activeProfileId;
                    return (
                      <td key={profile.id} className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={pending || active}
                            onClick={() =>
                              void submit(
                                { action: "activate", profileId: profile.id },
                                `${profile.name} activated for future scans.`
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#efbd5b]/20 px-2.5 py-1.5 text-[10px] text-[#f0ca7e] hover:bg-[#efbd5b]/[0.08] disabled:opacity-45"
                          >
                            {active ? <Check size={12} /> : null}
                            {active ? "Active" : "Activate"}
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${profile.name}`}
                            title={active ? "Activate another profile before deleting" : "Delete profile"}
                            disabled={pending || active}
                            onClick={() => deleteProfile(profile)}
                            className="grid size-8 place-items-center rounded-lg border border-white/[0.07] text-[#858b96] hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        ) : loading ? (
          <p className="mt-4 text-xs text-[#858b96]">Loading profile comparison…</p>
        ) : (
          <p className="mt-4 text-xs text-[#858b96]">No strategy comparison is available.</p>
        )}
        {currentParameters ? (
          <p className="mt-3 text-[10px] text-[#777e88]">
            Active configuration:{" "}
            {data?.profiles.find((profile) => profile.id === data.activeProfileId)?.name ??
              "Default"}
            . Changes apply to subsequent scans.
          </p>
        ) : null}
      </DashboardCard>

      <DashboardCard className="mt-5 p-4 sm:p-5">
        <CardHeading
          title="Observed strategy outcomes"
          description="Forward-tracked signals, attributed to the exact configuration used when detected."
        />
        <p className="mt-2 text-[10px] leading-5 text-[#858b96]">
          Win rate uses resolved wins and losses only. Unresolved and ambiguous outcomes are
          excluded; these observed results are not a backtest or a guarantee of future performance.
        </p>
        {performanceError ? (
          <div role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.055] px-4 py-3 text-xs text-rose-200">
            {performanceError}
          </div>
        ) : performanceLoading ? (
          <p className="mt-4 text-xs text-[#858b96]">Loading observed outcomes…</p>
        ) : performance?.strategies.length ? (
          <div className="soft-scrollbar mt-4 overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.07] text-[10px] text-[#858b96]">
                  <th scope="col" className="px-3 py-3 font-medium">Strategy snapshot</th>
                  <th scope="col" className="px-3 py-3 font-medium">Signals</th>
                  <th scope="col" className="px-3 py-3 font-medium">Wins</th>
                  <th scope="col" className="px-3 py-3 font-medium">Losses</th>
                  <th scope="col" className="px-3 py-3 font-medium">Unresolved / ambiguous</th>
                  <th scope="col" className="px-3 py-3 font-medium">Win rate</th>
                </tr>
              </thead>
              <tbody>
                {performance.strategies.map((strategy) => (
                  <tr key={strategy.strategyId} className="border-b border-white/[0.045] last:border-0">
                    <th scope="row" className="px-3 py-3 font-medium text-[#d7d4cd]">
                      {strategy.strategyName}
                    </th>
                    <td className="px-3 py-3 tabular-nums text-[#c9c7c1]">{strategy.total}</td>
                    <td className="px-3 py-3 tabular-nums text-emerald-300">{strategy.wins}</td>
                    <td className="px-3 py-3 tabular-nums text-rose-300">{strategy.losses}</td>
                    <td className="px-3 py-3 tabular-nums text-[#c9c7c1]">{strategy.unresolved}</td>
                    <td className="px-3 py-3 tabular-nums text-[#c9c7c1]">
                      {strategy.winRate === null ? "—" : `${strategy.winRate.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-xs text-[#858b96]">
            No signals have been recorded yet. New detections will appear here as outcomes are tracked.
          </p>
        )}
        {performance && performance.signals.length > 0 ? (
          <div className="mt-6">
            <h3 className="mb-3 text-xs font-medium text-[#d7d4cd]">Recent signal history</h3>
            <div className="soft-scrollbar overflow-x-auto">
              <table className="w-full min-w-[580px] border-collapse text-left text-[11px]">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[10px] text-[#858b96]">
                    <th scope="col" className="px-3 py-2.5 font-medium">Detected</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Market</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Strategy</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Outcome</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Alert delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.signals.map((entry) => (
                    <tr key={entry.id} className="border-b border-white/[0.045] last:border-0">
                      <td className="px-3 py-3 text-[#aeb1b8]">
                        {new Date(entry.detectedAt)
                          .toISOString()
                          .replace("T", " ")
                          .slice(0, 16)} UTC
                      </td>
                      <td className="px-3 py-3 text-[#d7d4cd]">
                        {entry.signal.symbol} · {entry.signal.direction}
                      </td>
                      <td className="px-3 py-3 text-[#c9c7c1]">{entry.strategy.name}</td>
                      <td className="px-3 py-3 capitalize text-[#c9c7c1]">{entry.outcome}</td>
                      <td className="px-3 py-3 text-[#c9c7c1]">
                        {entry.deliveryStatus.replace("_", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </DashboardCard>
    </main>
  );
}
