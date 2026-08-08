import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildMarketSnapshot,
  createMarketSnapshotId,
} from "@/lib/marketSnapshots/marketSnapshotBuilder";
import type {
  MarketQuote,
} from "@/lib/providers/marketProvider";

function createQuote(
  overrides:
    Partial<MarketQuote> = {},
): MarketQuote {
  return {
    symbol: " btc ",
    category: "crypto",
    price: 100_000.123,
    priceChange24h:
      3.45678,
    volume24hUsd:
      5_000_000_000.123,
    marketCapUsd:
      1_900_000_000_000.456,
    volatility24h:
      5.67891,
    lastUpdated:
      "2026-08-05T11:59:30.000Z",
    source: "CoinGecko",
    ...overrides,
  };
}

describe(
  "buildMarketSnapshot",
  () => {
    it(
      "builds a normalized live snapshot",
      () => {
        const snapshot =
          buildMarketSnapshot({
            quote:
              createQuote(),
            capturedAt:
              new Date(
                "2026-08-05T12:00:00.000Z",
              ),
            snapshotId:
              "MS-TEST-0001",
          });

        expect(
          snapshot,
        ).toEqual({
          id: "MS-TEST-0001",
          symbol: "BTC",
          category: "Crypto",
          capturedAt:
            "2026-08-05T12:00:00.000Z",
          price: 100_000.12,
          priceChange24h:
            3.4568,
          volume24hUsd:
            5_000_000_000.12,
          marketCapUsd:
            1_900_000_000_000.46,
          volatility24h:
            5.6789,
          dataSource: "live",
          source: "CoinGecko",
          providerTimestamp:
            "2026-08-05T11:59:30.000Z",
          isStale: false,
        });
      },
    );

    it(
      "uses eight decimals for prices below one dollar",
      () => {
        const snapshot =
          buildMarketSnapshot({
            quote:
              createQuote({
                price:
                  0.123456789,
              }),
            capturedAt:
              new Date(
                "2026-08-05T12:00:00.000Z",
              ),
            snapshotId:
              "MS-SMALL-PRICE",
          });

        expect(
          snapshot.price,
        ).toBe(
          0.12345679,
        );
      },
    );

    it(
      "supports a missing market capitalization",
      () => {
        const snapshot =
          buildMarketSnapshot({
            quote:
              createQuote({
                marketCapUsd:
                  undefined,
              }),
            capturedAt:
              new Date(
                "2026-08-05T12:00:00.000Z",
              ),
            snapshotId:
              "MS-NO-CAP",
          });

        expect(
          snapshot.marketCapUsd,
        ).toBeNull();
      },
    );

    it(
      "marks old provider data as stale",
      () => {
        const snapshot =
          buildMarketSnapshot({
            quote:
              createQuote({
                lastUpdated:
                  "2026-08-05T11:00:00.000Z",
              }),
            capturedAt:
              new Date(
                "2026-08-05T12:00:00.000Z",
              ),
            snapshotId:
              "MS-STALE",
          });

        expect(
          snapshot.isStale,
        ).toBe(true);
      },
    );

    it(
      "rejects an invalid market price",
      () => {
        expect(() =>
          buildMarketSnapshot({
            quote:
              createQuote({
                price: 0,
              }),
          }),
        ).toThrow(
          "Market price must be a positive finite number.",
        );
      },
    );

    it(
      "creates normalized snapshot IDs",
      () => {
        const snapshotId =
          createMarketSnapshotId(
            " btc/usd ",
            "2026-08-05T12:34:56.000Z",
          );

        expect(
          snapshotId,
        ).toMatch(
          /^MS-20260805123456-BTCUSD-[A-F0-9]{8}$/,
        );
      },
    );
  },
);
