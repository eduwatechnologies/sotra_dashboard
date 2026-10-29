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
