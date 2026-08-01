import { SCORE_LIMITS } from "./scoreTypes";

export function calculateRiskScore(
  volatility24h: number | null,
): number {
  if (volatility24h === null) {
    return 0;
  }

  if (volatility24h <= 1) {
    return SCORE_LIMITS.risk;
  }

  if (volatility24h <= 2) {
    return 18;
  }

  if (volatility24h <= 4) {
    return 15;
  }

  if (volatility24h <= 6) {
    return 12;
  }

  if (volatility24h <= 8) {
    return 8;
  }

  if (volatility24h <= 10) {
    return 4;
  }

  return 0;
}