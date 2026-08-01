import { SCORE_LIMITS } from "./scoreTypes";

export function calculateTrendScore(
  priceChange24h: number | null,
): number {
  if (priceChange24h === null) {
    return 0;
  }

  if (priceChange24h >= 10) {
    return SCORE_LIMITS.trend;
  }

  if (priceChange24h >= 7) {
    return 27;
  }

  if (priceChange24h >= 5) {
    return 24;
  }

  if (priceChange24h >= 3) {
    return 20;
  }

  if (priceChange24h >= 1) {
    return 15;
  }

  if (priceChange24h >= 0) {
    return 10;
  }

  if (priceChange24h >= -3) {
    return 5;
  }

  return 0;
}