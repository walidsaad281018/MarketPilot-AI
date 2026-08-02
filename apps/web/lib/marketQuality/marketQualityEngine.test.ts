import {
  describe,
  expect,
  it,
} from "vitest";

import {
  assessMarketQuality,
} from "@/lib/marketQuality/marketQualityEngine";

describe(
  "assessMarketQuality",
  () => {
    it(
      "returns an excellent assessment for a large, liquid, fresh and stable market",
      () => {
        const result =
          assessMarketQuality({
            volume24hUsd:
              6_000_000_000,
            marketCapUsd:
              150_000_000_000,
            volatility24h: 2,
            isStale: false,
          });

        expect(result).toEqual({
          score: 100,
          level: "Excellent",
          liquidityScore: 30,
          marketCapScore: 30,
          volatilityScore: 25,
          freshnessScore: 15,
        });
      },
    );

    it(
      "returns a good assessment for a medium-sized market",
      () => {
        const result =
          assessMarketQuality({
            volume24hUsd:
              1_500_000_000,
            marketCapUsd:
              15_000_000_000,
            volatility24h: 5,
            isStale: false,
          });

        expect(result).toEqual({
          score: 77,
          level: "Good",
          liquidityScore: 25,
          marketCapScore: 25,
          volatilityScore: 12,
          freshnessScore: 15,
        });
      },
    );

    it(
      "penalizes stale market data",
      () => {
        const result =
          assessMarketQuality({
            volume24hUsd:
              1_500_000_000,
            marketCapUsd:
              15_000_000_000,
            volatility24h: 5,
            isStale: true,
          });

        expect(result).toEqual({
          score: 62,
          level: "Fair",
          liquidityScore: 25,
          marketCapScore: 25,
          volatilityScore: 12,
          freshnessScore: 0,
        });
      },
    );

    it(
      "handles a missing market capitalization",
      () => {
        const result =
          assessMarketQuality({
            volume24hUsd:
              100_000_000,
            marketCapUsd: null,
            volatility24h: 9,
            isStale: false,
          });

        expect(result).toEqual({
          score: 33,
          level: "Poor",
          liquidityScore: 12,
          marketCapScore: 0,
          volatilityScore: 6,
          freshnessScore: 15,
        });
      },
    );

    it(
      "classifies a score of 85 as excellent",
      () => {
        const result =
          assessMarketQuality({
            volume24hUsd:
              5_000_000_000,
            marketCapUsd:
              10_000_000_000,
            volatility24h: 4,
            isStale: false,
          });

        expect(result.score).toBe(
          90,
        );

        expect(result.level).toBe(
          "Excellent",
        );
      },
    );

    it(
      "rejects a negative market volume",
      () => {
        expect(() =>
          assessMarketQuality({
            volume24hUsd: -1,
            marketCapUsd:
              1_000_000_000,
            volatility24h: 3,
            isStale: false,
          }),
        ).toThrow(
          "Market volume must be a non-negative number.",
        );
      },
    );

    it(
      "rejects a negative market capitalization",
      () => {
        expect(() =>
          assessMarketQuality({
            volume24hUsd:
              1_000_000_000,
            marketCapUsd: -1,
            volatility24h: 3,
            isStale: false,
          }),
        ).toThrow(
          "Market capitalization must be a non-negative number.",
        );
      },
    );

    it(
      "rejects an invalid volatility value",
      () => {
        expect(() =>
          assessMarketQuality({
            volume24hUsd:
              1_000_000_000,
            marketCapUsd:
              1_000_000_000,
            volatility24h:
              Number.NaN,
            isStale: false,
          }),
        ).toThrow(
          "Market volatility must be a non-negative number.",
        );
      },
    );
  },
);
