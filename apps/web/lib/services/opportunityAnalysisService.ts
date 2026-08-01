import type {
  RiskLevel,
  Trend,
} from "@/data/opportunities";
import type {
  ResolvedOpportunity,
} from "@/lib/services/opportunityService";
import {
  calculateOpportunityScore,
} from "@/lib/scoring/scoreEngine";

export type RecommendationLabel =
  | "BUY"
  | "WATCH"
  | "AVOID";

export type AnalysisTone =
  | "positive"
  | "neutral"
  | "negative";

export type AnalysisReason = {
  title: string;
  description: string;
  tone: AnalysisTone;
};

export type ScoreBreakdownItem = {
  label: string;
  score: number;
  description: string;
};

export type OpportunityAnalysis = {
  recommendation: RecommendationLabel;
  recommendationSummary: string;
  strengths: AnalysisReason[];
  risks: AnalysisReason[];
  scoreBreakdown: ScoreBreakdownItem[];
};

export function analyzeOpportunity(
  opportunity: ResolvedOpportunity,
): OpportunityAnalysis {
  const scoringResult =
    calculateOpportunityScore({
      priceChange24h:
        opportunity.priceChange24h,
      volatility24h:
        opportunity.volatility24h,
      volume24hUsd:
        opportunity.volume24hUsd,
    });

  const recommendation =
    determineRecommendation(
      opportunity.score,
      opportunity.confidence,
      opportunity.risk,
      opportunity.trend,
    );

  return {
    recommendation,
    recommendationSummary:
      createRecommendationSummary(
        opportunity,
        recommendation,
      ),
    strengths:
      buildStrengths(opportunity),
    risks:
      buildRisks(opportunity),
    scoreBreakdown: [
      {
        label: "Trend",
        score:
          scoringResult.components
            .trend,
        description:
          describeTrendScore(
            scoringResult.components
              .trend,
          ),
      },
      {
        label: "Momentum",
        score:
          scoringResult.components
            .momentum,
        description:
          describeMomentumScore(
            scoringResult.components
              .momentum,
          ),
      },
      {
        label: "Risk control",
        score:
          scoringResult.components
            .risk,
        description:
          describeRiskScore(
            scoringResult.components
              .risk,
          ),
      },
      {
        label: "Volatility",
        score:
          scoringResult.components
            .volatility,
        description:
          describeVolatilityScore(
            scoringResult.components
              .volatility,
          ),
      },
      {
        label: "Liquidity",
        score:
          scoringResult.components
            .liquidity,
        description:
          describeLiquidityScore(
            scoringResult.components
              .liquidity,
          ),
      },
    ],
  };
}

function determineRecommendation(
  score: number,
  confidence: number,
  risk: RiskLevel,
  trend: Trend,
): RecommendationLabel {
  if (
    score >= 70 &&
    confidence >= 65 &&
    risk !== "High" &&
    trend === "Bullish"
  ) {
    return "BUY";
  }

  if (
    score < 40 ||
    confidence < 35 ||
    (
      risk === "High" &&
      trend === "Bearish"
    )
  ) {
    return "AVOID";
  }

  return "WATCH";
}

function buildStrengths(
  opportunity: ResolvedOpportunity,
): AnalysisReason[] {
  const strengths: AnalysisReason[] =
    [];

  if (
    opportunity.trend ===
    "Bullish"
  ) {
    strengths.push({
      title: "Bullish short-term trend",
      description:
        "The current 24-hour price movement supports a positive short-term market direction.",
      tone: "positive",
    });
  }

  if (
    (opportunity.priceChange24h ??
      0) >= 3
  ) {
    strengths.push({
      title: "Strong recent momentum",
      description:
        "The asset has recorded meaningful positive movement during the latest 24-hour period.",
      tone: "positive",
    });
  }

  if (
    opportunity.volume24hUsd !=
      null &&
    opportunity.volume24hUsd >=
      1_000_000_000
  ) {
    strengths.push({
      title: "High market liquidity",
      description:
        "Strong trading volume may support easier entry and exit compared with less liquid assets.",
      tone: "positive",
    });
  }

  if (
    opportunity.risk === "Low"
  ) {
    strengths.push({
      title: "Controlled volatility",
      description:
        "Current volatility is relatively limited compared with higher-risk opportunities.",
      tone: "positive",
    });
  }

  if (
    opportunity.confidence >= 70
  ) {
    strengths.push({
      title: "Strong model confidence",
      description:
        "The available market signals show relatively strong agreement in the current assessment.",
      tone: "positive",
    });
  }

  if (
    opportunity.historicalAccuracy >=
    80
  ) {
    strengths.push({
      title: "High historical accuracy",
      description:
        "Comparable MarketPilot recommendations have shown a relatively strong historical success rate.",
      tone: "positive",
    });
  }

  if (strengths.length === 0) {
    strengths.push({
      title: "Balanced market profile",
      description:
        "No single positive factor dominates, but the opportunity remains eligible for continued monitoring.",
      tone: "neutral",
    });
  }

  return strengths;
}

function buildRisks(
  opportunity: ResolvedOpportunity,
): AnalysisReason[] {
  const risks: AnalysisReason[] = [];

  if (
    opportunity.trend ===
    "Bearish"
  ) {
    risks.push({
      title: "Bearish short-term trend",
      description:
        "The asset is currently moving downward, which may indicate continued near-term selling pressure.",
      tone: "negative",
    });
  }

  if (
    (opportunity.priceChange24h ??
      0) <= -3
  ) {
    risks.push({
      title: "Negative recent momentum",
      description:
        "The asset has experienced a meaningful decline during the latest 24-hour period.",
      tone: "negative",
    });
  }

  if (
    opportunity.risk === "High"
  ) {
    risks.push({
      title: "Elevated risk level",
      description:
        "Current volatility indicates a greater probability of rapid price movement in either direction.",
      tone: "negative",
    });
  }

  if (
    opportunity.confidence < 60
  ) {
    risks.push({
      title: "Limited model confidence",
      description:
        "The current indicators do not provide strong enough agreement for a high-conviction recommendation.",
      tone: "negative",
    });
  }

  if (
    opportunity.volume24hUsd !=
      null &&
    opportunity.volume24hUsd <
      100_000_000
  ) {
    risks.push({
      title: "Lower market liquidity",
      description:
        "Lower trading volume may increase spread, slippage and execution risk.",
      tone: "negative",
    });
  }

  if (
    opportunity.volatility24h !=
      null &&
    opportunity.volatility24h >=
      8
  ) {
    risks.push({
      title: "High short-term volatility",
      description:
        "Large price swings may make entry timing and risk management more difficult.",
      tone: "negative",
    });
  }

  if (risks.length === 0) {
    risks.push({
      title: "No dominant warning signal",
      description:
        "The current dataset does not show a major isolated risk factor, although market conditions can change quickly.",
      tone: "neutral",
    });
  }

  return risks;
}

function createRecommendationSummary(
  opportunity: ResolvedOpportunity,
  recommendation: RecommendationLabel,
): string {
  if (
    recommendation === "BUY"
  ) {
    return `${opportunity.asset} currently combines a strong MarketPilot score, supportive trend, acceptable risk and sufficient model confidence. The result qualifies as a higher-conviction opportunity, but it should still be evaluated with personal risk limits and an appropriate exit plan.`;
  }

  if (
    recommendation === "AVOID"
  ) {
    return `${opportunity.asset} currently shows an unfavorable combination of score, confidence, risk or short-term trend. MarketPilot does not identify enough supporting evidence for a positive entry decision under the current conditions.`;
  }

  return `${opportunity.asset} presents a mixed market profile. Some signals may be constructive, but the current score, confidence, trend or risk level does not support a high-conviction entry. Continued monitoring is more appropriate than immediate action.`;
}

function describeTrendScore(
  score: number,
): string {
  if (score >= 70) {
    return "The current price direction strongly supports the opportunity.";
  }

  if (score >= 45) {
    return "The current price direction is mixed or only moderately supportive.";
  }

  return "The current price direction is unfavorable.";
}

function describeMomentumScore(
  score: number,
): string {
  if (score >= 70) {
    return "Recent price movement shows strong positive momentum.";
  }

  if (score >= 45) {
    return "Recent momentum is moderate or inconclusive.";
  }

  return "Recent momentum is weak or negative.";
}

function describeRiskScore(
  score: number,
): string {
  if (score >= 70) {
    return "The current market profile indicates relatively controlled risk.";
  }

  if (score >= 45) {
    return "The current risk profile is moderate.";
  }

  return "The current risk profile is elevated.";
}

function describeVolatilityScore(
  score: number,
): string {
  if (score >= 70) {
    return "Volatility is currently favorable and comparatively controlled.";
  }

  if (score >= 45) {
    return "Volatility is meaningful but remains manageable.";
  }

  return "Volatility is high and may cause rapid price swings.";
}

function describeLiquidityScore(
  score: number,
): string {
  if (score >= 70) {
    return "Trading activity indicates strong market liquidity.";
  }

  if (score >= 45) {
    return "Liquidity is adequate but not exceptional.";
  }

  return "Liquidity is limited and may increase execution risk.";
}