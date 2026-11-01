export interface SignalData {
  symbol: string;
  direction: "BUY" | "SELL";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  rewardRisk: number;
  timestamp: number;
  rationale: string;
}

export interface DashboardStatus {
  paused: boolean;
  symbols: string[];
  interval: string;
  scanIntervalMs: number;
  minRewardRisk: number;
  latestSignal: SignalData | null;
}

export interface DashboardSettings {
  symbols: string[];
  interval: string;
  scanIntervalMs: number;
}

export interface StrategyParameters {
  minRewardRisk: number;
  swingLookback: number;
  structureLookback: number;
  maxBarsSinceSweep: number;
  atrPeriod: number;
  maxRiskAtrMultiple: number;
  maxCandleAgeMinutes: number;
}

export interface StrategyProfile extends StrategyParameters {
  id: string;
  name: string;
}

export interface StrategyProfilesResponse {
  defaultParameters: StrategyParameters;
  profiles: StrategyProfile[];
  activeProfileId: string | null;
}

export interface DashboardScanResult {
  symbol: string;
  status: "signal" | "no signal" | "duplicate" | "paused" | "error";
  signal?: SignalData;
  sent?: boolean;
  error?: string;
}

export interface DashboardScanResponse {
  paused: boolean;
  results: DashboardScanResult[];
}

export function isSignalData(value: unknown): value is SignalData {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const signal = value as Record<string, unknown>;
  return (
    typeof signal.symbol === "string" &&
    (signal.direction === "BUY" || signal.direction === "SELL") &&
    ["entry", "stopLoss", "takeProfit", "rewardRisk", "timestamp"].every(
      (key) => typeof signal[key] === "number" && Number.isFinite(signal[key])
    ) &&
    typeof signal.rationale === "string"
  );
}

export function isDashboardStatus(value: unknown): value is DashboardStatus {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const status = value as Record<string, unknown>;
  return (
    typeof status.paused === "boolean" &&
    Array.isArray(status.symbols) &&
    status.symbols.every((symbol) => typeof symbol === "string") &&
    typeof status.interval === "string" &&
    typeof status.scanIntervalMs === "number" &&
    Number.isFinite(status.scanIntervalMs) &&
    typeof status.minRewardRisk === "number" &&
    Number.isFinite(status.minRewardRisk) &&
    (status.latestSignal === null || isSignalData(status.latestSignal))
  );
}

export function isDashboardSettings(value: unknown): value is DashboardSettings {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const settings = value as Record<string, unknown>;
  return (
    Array.isArray(settings.symbols) &&
    settings.symbols.length > 0 &&
    settings.symbols.length <= 20 &&
    settings.symbols.every(
      (symbol) =>
        typeof symbol === "string" &&
        /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(symbol)
    ) &&
    new Set(settings.symbols).size === settings.symbols.length &&
    typeof settings.interval === "string" &&
    /^\d+(min|h|day|week|month)$/.test(settings.interval) &&
    typeof settings.scanIntervalMs === "number" &&
    Number.isInteger(settings.scanIntervalMs) &&
    settings.scanIntervalMs >= 60_000 &&
    settings.scanIntervalMs <= 86_400_000 &&
    (settings.minRewardRisk === undefined ||
      (typeof settings.minRewardRisk === "number" &&
        Number.isFinite(settings.minRewardRisk) &&
        settings.minRewardRisk > 0 &&
        settings.minRewardRisk <= 100))
  );
}

export function isStrategyParameters(value: unknown): value is StrategyParameters {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const parameters = value as Record<string, unknown>;
  return (
    typeof parameters.minRewardRisk === "number" &&
    Number.isFinite(parameters.minRewardRisk) &&
    parameters.minRewardRisk >= 0.1 &&
    parameters.minRewardRisk <= 100 &&
    Number.isInteger(parameters.swingLookback) &&
    Number(parameters.swingLookback) >= 1 &&
    Number(parameters.swingLookback) <= 100 &&
    Number.isInteger(parameters.structureLookback) &&
    Number(parameters.structureLookback) >= 1 &&
    Number(parameters.structureLookback) <= 100 &&
    Number.isInteger(parameters.maxBarsSinceSweep) &&
    Number(parameters.maxBarsSinceSweep) >= 1 &&
    Number(parameters.maxBarsSinceSweep) <= 20 &&
    Number.isInteger(parameters.atrPeriod) &&
    Number(parameters.atrPeriod) >= 1 &&
    Number(parameters.atrPeriod) <= 100 &&
    typeof parameters.maxRiskAtrMultiple === "number" &&
    Number.isFinite(parameters.maxRiskAtrMultiple) &&
    parameters.maxRiskAtrMultiple >= 0.1 &&
    parameters.maxRiskAtrMultiple <= 20 &&
    typeof parameters.maxCandleAgeMinutes === "number" &&
    Number.isFinite(parameters.maxCandleAgeMinutes) &&
    parameters.maxCandleAgeMinutes >= 1 &&
    parameters.maxCandleAgeMinutes <= 1440
  );
}

export function isStrategyProfilesResponse(
  value: unknown
): value is StrategyProfilesResponse {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const response = value as Record<string, unknown>;
  return (
    isStrategyParameters(response.defaultParameters) &&
    Array.isArray(response.profiles) &&
    response.profiles.length <= 20 &&
    response.profiles.every(
      (profile) =>
        profile !== null &&
        typeof profile === "object" &&
        typeof (profile as Record<string, unknown>).id === "string" &&
        /^[a-zA-Z0-9_-]{1,80}$/.test(
          String((profile as Record<string, unknown>).id)
        ) &&
        typeof (profile as Record<string, unknown>).name === "string" &&
        String((profile as Record<string, unknown>).name).trim().length > 0 &&
        String((profile as Record<string, unknown>).name).trim().length <= 40 &&
        isStrategyParameters(profile)
    ) &&
    new Set(
      response.profiles.map((profile) => (profile as StrategyProfile).id)
    ).size === response.profiles.length &&
    new Set(
      response.profiles.map((profile) =>
        (profile as StrategyProfile).name.trim().toLowerCase()
      )
    ).size === response.profiles.length &&
    (response.activeProfileId === null ||
      (typeof response.activeProfileId === "string" &&
        response.profiles.some(
          (profile) => (profile as StrategyProfile).id === response.activeProfileId
        )))
  );
}

export function isDashboardScanResponse(value: unknown): value is DashboardScanResponse {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const scan = value as Record<string, unknown>;
  return (
    typeof scan.paused === "boolean" &&
    Array.isArray(scan.results) &&
    scan.results.every((result) => {
      if (result === null || typeof result !== "object") {
        return false;
      }
      const item = result as Record<string, unknown>;
      return (
        typeof item.symbol === "string" &&
        ["signal", "no signal", "duplicate", "paused", "error"].includes(
          String(item.status)
        )
      );
    })
  );
}
