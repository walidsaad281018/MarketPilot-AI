import { SCORE_LIMITS } from "./scoreTypes";

export function calculateVolatilityScore(
  volatility24h: number | null,
): number {
  if (volatility24h === null) {
    return 0;
  }

  if (volatility24h >= 4 && volatility24h <= 7) {
    return SCORE_LIMITS.volatility;
  }

  if (
    (volatility24h >= 2 && volatility24h < 4) ||
    (volatility24h > 7 && volatility24h <= 9)
  ) {
    return 12;
  }

  if (
    (volatility24h >= 1 && volatility24h < 2) ||
    (volatility24h > 9 && volatility24h <= 12)
  ) {
    return 8;
  }

  if (
    volatility24h < 1 ||
    (volatility24h > 12 && volatility24h <= 15)
  ) {
    return 4;
  }

  return 0;
}