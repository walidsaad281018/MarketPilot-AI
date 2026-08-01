import { SCORE_LIMITS } from "./scoreTypes";

export function calculateMomentumScore(
  priceChange24h: number | null,
): number {
  if (priceChange24h === null) {
    return 0;
  }

  if (priceChange24h >= 12) {
    return SCORE_LIMITS.momentum;
  }

  if (priceChange24h >= 8) {
    return 22;
  }

  if (priceChange24h >= 5) {
    return 19;
  }

  if (priceChange24h >= 3) {
    return 16;
  }

  if (priceChange24h >= 1) {
    return 12;
  }

  if (priceChange24h >= 0) {
    return 8;
  }

  if (priceChange24h >= -2) {
    return 4;
  }

  return 0;
}