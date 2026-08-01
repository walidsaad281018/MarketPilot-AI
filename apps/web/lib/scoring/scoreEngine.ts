import { calculateLiquidityScore } from "./liquidityScore";
import {
  calculateOverallScore,
  type ScoreComponents,
} from "./overallScore";
import { calculateMomentumScore } from "./momentumScore";
import { calculateRiskScore } from "./riskScore";
import { calculateTrendScore } from "./trendScore";
import { calculateVolatilityScore } from "./volatilityScore";

export interface ScoreEngineInput {
  priceChange24h: number | null;
  volatility24h: number | null;
  volume24hUsd: number | null;
}

export interface ScoreEngineResult {
  overall: number;
  components: ScoreComponents;
}

export function calculateOpportunityScore(
  input: ScoreEngineInput,
): ScoreEngineResult {
  const components: ScoreComponents = {
    trend: calculateTrendScore(input.priceChange24h),
    momentum: calculateMomentumScore(input.priceChange24h),
    risk: calculateRiskScore(input.volatility24h),
    volatility: calculateVolatilityScore(input.volatility24h),
    liquidity: calculateLiquidityScore(input.volume24hUsd),
  };

  return {
    overall: calculateOverallScore(components),
    components,
  };
}