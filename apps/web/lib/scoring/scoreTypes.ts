export type ScoreBreakdown = {
  trend: number;
  momentum: number;
  risk: number;
  volatility: number;
  liquidity: number;
};

export type OpportunityScore = {
  total: number;
  breakdown: ScoreBreakdown;
  confidence: number;
  explanation: string[];
};

export const SCORE_LIMITS = {
  trend: 30,
  momentum: 25,
  risk: 20,
  volatility: 15,
  liquidity: 10,
} as const;