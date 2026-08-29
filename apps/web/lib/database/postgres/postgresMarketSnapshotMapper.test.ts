import {
  describe,
  expect,
  it,
} from "vitest";

import {
  fromPostgresMarketSnapshotRow,
  toPostgresMarketSnapshotParameters,
  type PostgresMarketSnapshotRow,
} from "@/lib/database/postgres/postgresMarketSnapshotMapper";
import type {
  MarketSnapshot,
} from "@/lib/marketSnapshots/marketSnapshot";

const snapshot: MarketSnapshot = {
  id: "SNAPSHOT-001",
  symbol: "BTC",
  category: "Crypto",
  capturedAt:
    "2026-08-29T18:00:00.000Z",
  price: 110000.25,
  priceChange24h: 2.5,
  volume24hUsd: 45000000000,
  marketCapUsd: 2200000000000,
  volatility24h: 3.4,
  dataSource: "live",
  source: "CoinGecko",
  providerTimestamp:
    "2026-08-29T17:59:30.000Z",
  isStale: false,
};

function createRow(
  overrides:
    Partial<PostgresMarketSnapshotRow> = {},
): PostgresMarketSnapshotRow {
  return {
    id: "SNAPSHOT-001",
    symbol: "BTC",
    category: "Crypto",
    captured_at:
      "2026-08-29T18:00:00.000Z",
    price: "110000.25",
    price_change_24h: "2.5",
    volume_24h_usd: "45000000000",
    market_cap_usd:
      "2200000000000",
    volatility_24h: "3.4",
    data_source: "live",
    source: "CoinGecko",
    provider_timestamp:
      "2026-08-29T17:59:30.000Z",
    is_stale: false,
    ...overrides,
  };
}

describe(
  "postgresMarketSnapshotMapper",
  () => {
    it(
      "maps a market snapshot to PostgreSQL parameters",
      () => {
        expect(
          toPostgresMarketSnapshotParameters(
            snapshot,
          ),
        ).toEqual({
          id: "SNAPSHOT-001",
          symbol: "BTC",
          category: "Crypto",
          capturedAt:
            "2026-08-29T18:00:00.000Z",
          price: 110000.25,
          priceChange24h: 2.5,
          volume24hUsd:
            45000000000,
          marketCapUsd:
            2200000000000,
          volatility24h: 3.4,
          dataSource: "live",
          source: "CoinGecko",
          providerTimestamp:
            "2026-08-29T17:59:30.000Z",
          isStale: false,
        });
      },
    );

    it(
      "maps a PostgreSQL row to a market snapshot",
      () => {
        expect(
          fromPostgresMarketSnapshotRow(
            createRow(),
          ),
        ).toEqual(
          snapshot,
        );
      },
    );

    it(
      "preserves nullable market metadata",
      () => {
        const result =
          fromPostgresMarketSnapshotRow(
            createRow({
              market_cap_usd:
                null,
              provider_timestamp:
                null,
              is_stale: true,
            }),
          );

        expect(
          result.marketCapUsd,
        ).toBeNull();

        expect(
          result.providerTimestamp,
        ).toBeNull();

        expect(
          result.isStale,
        ).toBe(true);
      },
    );

    it(
      "rejects an invalid stored category",
      () => {
        expect(
          () =>
            fromPostgresMarketSnapshotRow(
              createRow({
                category:
                  "Invalid",
              }),
            ),
        ).toThrow(
          "Invalid market snapshot category",
        );
      },
    );

    it(
      "rejects an invalid stored data source",
      () => {
        expect(
          () =>
            fromPostgresMarketSnapshotRow(
              createRow({
                data_source:
                  "unknown",
              }),
            ),
        ).toThrow(
          "Invalid market snapshot data source",
        );
      },
    );
  },
);
