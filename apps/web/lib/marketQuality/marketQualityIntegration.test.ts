import {
  describe,
  expect,
  it,
} from "vitest";

import {
  assessMarketQuality,
} from "@/lib/marketQuality/marketQualityEngine";
import {
  buildCryptoOpportunity,
} from "@/lib/opportunities/cryptoOpportunityBuilder";

describe(
  "market quality integration",
  () => {
    it(
      "keeps market quality and opportunity scoring consistent",
      () => {
        const opportunity =
          buildCryptoOpportunity({
            asset: "Bitcoin",
            symbol: "BTC",
            market: {
              price: 100_000,
              priceChange24h: 3,
              volume24hUsd:
                6_000_000_000,
              volatility24h: 2,
            },
          });

        const volume24hUsd =
          requireMarketMetric(
            opportunity.volume24hUsd,
            "volume24hUsd",
          );

        const volatility24h =
          requireMarketMetric(
            opportunity.volatility24h,
            "volatility24h",
          );

        const quality =
          assessMarketQuality({
            volume24hUsd,
            marketCapUsd:
              150_000_000_000,
            volatility24h,
            isStale:
              opportunity.isStale,
          });

        expect(
          quality.level,
        ).toBe("Excellent");

        expect(
          quality.score,
        ).toBe(100);

        expect(
          opportunity.score,
        ).toBeGreaterThan(70);
      },
    );
  },
);

function requireMarketMetric(
  value: number | null,
  metricName: string,
): number {
  if (value === null) {
    throw new Error(
      `Expected ${metricName} to be available.`,
    );
  }

  return value;
}
