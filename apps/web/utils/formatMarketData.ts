export function formatUsdPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1_000 ? 0 : 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}%`;
}