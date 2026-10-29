export const chartPreviewPoints = [
  44, 49, 42, 48, 37, 41, 32, 38, 29, 34, 24, 31, 26, 34, 21, 28, 17, 24, 14,
  20, 12, 17, 9, 14, 7,
];

export function marketLabel(symbol: string): string {
  if (symbol === "XAU/USD") {
    return "Gold · US Dollar";
  }
  if (symbol === "EUR/USD") {
    return "Euro · US Dollar";
  }
  if (symbol === "GBP/USD") {
    return "British Pound · US Dollar";
  }
  return "Configured market";
}
