import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createFallbackMarketDataMetadata,
  createLiveMarketDataMetadata,
  FALLBACK_MARKET_SOURCE,
  isMarketDataStale,
  LIVE_MARKET_SOURCE,
  MARKET_DATA_STALE_AFTER_MS,
} from "@/lib/market/marketDataMetadata";

describe(
  "market-data metadata",
  () => {
    it(
      "defines the supported providers",
      () => {
        expect(
          LIVE_MARKET_SOURCE,
        ).toBe("CoinGecko");

        expect(
          FALLBACK_MARKET_SOURCE,
        ).toBe(
          "MarketPilot Demo",
        );
      },
    );

    it(
      "creates fresh live metadata",
      () => {
        const metadata =
          createLiveMarketDataMetadata({
            lastUpdated:
              "2026-08-02T12:00:00.000Z",
            currentTime:
              new Date(
                "2026-08-02T12:04:00.000Z",
              ),
          });

        expect(metadata).toEqual({
          dataSource: "live",
          source: "CoinGecko",
          lastUpdated:
            "2026-08-02T12:00:00.000Z",
          isStale: false,
        });
      },
    );

    it(
      "marks old live metadata as stale",
      () => {
        const metadata =
          createLiveMarketDataMetadata({
            source:
              "Alternative Provider",
            lastUpdated:
              "2026-08-02T12:00:00.000Z",
            currentTime:
              new Date(
                "2026-08-02T12:06:00.000Z",
              ),
          });

        expect(metadata).toEqual({
          dataSource: "live",
          source:
            "Alternative Provider",
          lastUpdated:
            "2026-08-02T12:00:00.000Z",
          isStale: true,
        });
      },
    );

    it(
      "treats data at the exact freshness limit as fresh",
      () => {
        const isStale =
          isMarketDataStale({
            lastUpdated:
              "2026-08-02T12:00:00.000Z",
            currentTime:
              new Date(
                "2026-08-02T12:05:00.000Z",
              ),
          });

        expect(isStale).toBe(
          false,
        );
      },
    );

    it(
      "does not mark a future provider timestamp as stale",
      () => {
        const isStale =
          isMarketDataStale({
            lastUpdated:
              "2026-08-02T12:01:00.000Z",
            currentTime:
              new Date(
                "2026-08-02T12:00:00.000Z",
              ),
          });

        expect(isStale).toBe(
          false,
        );
      },
    );

    it(
      "creates explicit fallback metadata",
      () => {
        expect(
          createFallbackMarketDataMetadata(),
        ).toEqual({
          dataSource: "fallback",
          source:
            "MarketPilot Demo",
          lastUpdated: null,
          isStale: false,
        });
      },
    );

    it(
      "uses a five-minute default freshness window",
      () => {
        expect(
          MARKET_DATA_STALE_AFTER_MS,
        ).toBe(300_000);
      },
    );

    it(
      "rejects an invalid last-updated timestamp",
      () => {
        expect(() =>
          createLiveMarketDataMetadata({
            lastUpdated:
              "not-a-date",
          }),
        ).toThrow(
          "Market-data last-updated timestamp must be valid.",
        );
      },
    );

    it(
      "rejects an empty provider name",
      () => {
        expect(() =>
          createLiveMarketDataMetadata({
            source: "   ",
            lastUpdated:
              "2026-08-02T12:00:00.000Z",
          }),
        ).toThrow(
          "Market-data source is required.",
        );
      },
    );

    it(
      "rejects a negative freshness duration",
      () => {
        expect(() =>
          isMarketDataStale({
            lastUpdated:
              "2026-08-02T12:00:00.000Z",
            staleAfterMs: -1,
          }),
        ).toThrow(
          "Market-data stale duration must be a non-negative number.",
        );
      },
    );
  },
);
