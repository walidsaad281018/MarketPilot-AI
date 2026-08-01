import { SCORE_LIMITS } from "./scoreTypes";

export function calculateLiquidityScore(
  volume24hUsd: number | null,
): number {
  if (volume24hUsd === null || volume24hUsd <= 0) {
    return 0;
  }

  if (volume24hUsd >= 5_000_000_000) {
    return SCORE_LIMITS.liquidity;
  }

  if (volume24hUsd >= 1_000_000_000) {
    return 9;
  }

  if (volume24hUsd >= 250_000_000) {
    return 7;
  }

  if (volume24hUsd >= 50_000_000) {
    return 5;
  }

  if (volume24hUsd >= 10_000_000) {
    return 3;
  }

  return 1;
}