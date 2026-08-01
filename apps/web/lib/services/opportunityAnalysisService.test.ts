import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  Opportunity,
} from "@/data/opportunities";
import {
  analyzeOpportunity,
} from "@/lib/services/opportunityAnalysisService";
import type {
  ResolvedOpportunity,
} from "@/lib/services/opportunityService";

describe(
  "analyzeOpportunity",
  () => {
    it(
      "returns BUY for a strong bullish opportunity",
      () => {
        const opportunity =
          createOpportunity({
            score: 82,
            confidence: 76,
            risk: "Medium",
            trend: "Bullish",
            priceChange24h: 6,
            volatility24h: 5,
            volume24hUsd:
              2_000_000_000,
            historicalAccuracy: 84,
          });

        const analysis =
          analyzeOpportunity(
            opportunity,
          );

        expect(
          analysis.recommendation,
        ).toBe("BUY");

        expect(
          analysis.strengths.some(
            (strength) =>
              strength.title ===
              "Bullish short-term trend",
          ),
        ).toBe(true);

        expect(
          analysis.strengths.some(
            (strength) =>
              strength.title ===
              "High market liquidity",
          ),
        ).toBe(true);
      },
    );

    it(
      "returns WATCH for a mixed opportunity",
      () => {
        const opportunity =
          createOpportunity({
            score: 58,
            confidence: 52,
            risk: "Medium",
            trend: "Neutral",
            priceChange24h: 0.5,
            volatility24h: 5,
            volume24hUsd:
              500_000_000,
          });

        const analysis =
          analyzeOpportunity(
            opportunity,
          );

        expect(
          analysis.recommendation,
        ).toBe("WATCH");

        expect(
          analysis.recommendationSummary,
        ).toContain(
          "mixed market profile",
        );
      },
    );

    it(
      "returns AVOID when score is too low",
      () => {
        const opportunity =
          createOpportunity({
            score: 35,
            confidence: 55,
            risk: "Medium",
            trend: "Neutral",
          });

        const analysis =
          analyzeOpportunity(
            opportunity,
          );

        expect(
          analysis.recommendation,
        ).toBe("AVOID");
      },
    );

    it(
      "returns AVOID when confidence is too low",
      () => {
        const opportunity =
          createOpportunity({
            score: 65,
            confidence: 30,
            risk: "Low",
            trend: "Bullish",
          });

        const analysis =
          analyzeOpportunity(
            opportunity,
          );

        expect(
          analysis.recommendation,
        ).toBe("AVOID");

        expect(
          analysis.risks.some(
            (risk) =>
              risk.title ===
              "Limited model confidence",
          ),
        ).toBe(true);
      },
    );

    it(
      "returns AVOID for a high-risk bearish opportunity",
      () => {
        const opportunity =
          createOpportunity({
            score: 60,
            confidence: 55,
            risk: "High",
            trend: "Bearish",
            priceChange24h: -7,
            volatility24h: 10,
          });

        const analysis =
          analyzeOpportunity(
            opportunity,
          );

        expect(
          analysis.recommendation,
        ).toBe("AVOID");

        expect(
          analysis.risks.some(
            (risk) =>
              risk.title ===
              "Bearish short-term trend",
          ),
        ).toBe(true);

        expect(
          analysis.risks.some(
            (risk) =>
              risk.title ===
              "High short-term volatility",
          ),
        ).toBe(true);
      },
    );

    it(
      "includes all five transparent score components",
      () => {
        const analysis =
          analyzeOpportunity(
            createOpportunity(),
          );

        expect(
          analysis.scoreBreakdown,
        ).toHaveLength(5);

        expect(
          analysis.scoreBreakdown.map(
            (component) =>
              component.label,
          ),
        ).toEqual([
          "Trend",
          "Momentum",
          "Risk control",
          "Volatility",
          "Liquidity",
        ]);

        for (
          const component of
          analysis.scoreBreakdown
        ) {
          expect(
            component.score,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            component.score,
          ).toBeLessThanOrEqual(
            100,
          );

          expect(
            component.description.length,
          ).toBeGreaterThan(0);
        }
      },
    );

    it(
      "identifies lower liquidity as a risk",
      () => {
        const analysis =
          analyzeOpportunity(
            createOpportunity({
              volume24hUsd:
                25_000_000,
            }),
          );

        expect(
          analysis.risks.some(
            (risk) =>
              risk.title ===
              "Lower market liquidity",
          ),
        ).toBe(true);
      },
    );

    it(
      "provides a neutral fallback when no major strength exists",
      () => {
        const analysis =
          analyzeOpportunity(
            createOpportunity({
              confidence: 60,
              historicalAccuracy: 70,
              priceChange24h: 0,
              trend: "Neutral",
              risk: "Medium",
              volume24hUsd:
                500_000_000,
            }),
          );

        expect(
          analysis.strengths,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              title:
                "Balanced market profile",
              tone: "neutral",
            }),
          ]),
        );
      },
    );
  },
);

function createOpportunity(
  overrides: Partial<
    ResolvedOpportunity
  > = {},
): ResolvedOpportunity {
  const baseOpportunity: Opportunity =
    {
      rank: 1,
      asset: "Bitcoin",
      symbol: "BTC",
      category: "Crypto",
      score: 65,
      expectedReturn: "+7.80%",
      risk: "Medium",
      confidence: 60,
      trend: "Neutral",
      historicalAccuracy: 75,
      priceChange24h: 0,
      volatility24h: 5,
      volume24hUsd:
        1_000_000_000,
    };

  return {
    ...baseOpportunity,
    currentPriceUsd: 65_000,
    ...overrides,
  };
}