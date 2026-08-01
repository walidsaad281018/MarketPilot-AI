export interface ScoreComponents {
  trend: number;
  momentum: number;
  risk: number;
  volatility: number;
  liquidity: number;
}

const MIN_OVERALL_SCORE = 0;
const MAX_OVERALL_SCORE = 100;

function normalizeComponentScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, score);
}

export function calculateOverallScore(
  components: ScoreComponents,
): number {
  const total =
    normalizeComponentScore(components.trend) +
    normalizeComponentScore(components.momentum) +
    normalizeComponentScore(components.risk) +
    normalizeComponentScore(components.volatility) +
    normalizeComponentScore(components.liquidity);

  const roundedTotal = Math.round(total);

  return Math.min(
    MAX_OVERALL_SCORE,
    Math.max(MIN_OVERALL_SCORE, roundedTotal),
  );
}