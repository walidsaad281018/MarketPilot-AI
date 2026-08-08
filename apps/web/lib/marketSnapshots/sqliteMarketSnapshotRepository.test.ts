import type {
  DatabaseSync,
} from "node:sqlite";
import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  openSqliteDatabase,
} from "@/lib/database/sqliteDatabaseFactory";
import type {
  MarketSnapshot,
} from "@/lib/marketSnapshots/marketSnapshot";
import {
  SqliteMarketSnapshotRepository,
} from "@/lib/marketSnapshots/sqliteMarketSnapshotRepository";

function createSnapshot(
  overrides:
    Partial<MarketSnapshot> = {},
): MarketSnapshot {
  return {
    id: "MS-BTC-20260805-0001",
    symbol: "BTC",
    category: "Crypto",
    capturedAt:
      "2026-08-05T12:00:00.000Z",
    price: 100_000,
    priceChange24h: 3.25,
    volume24hUsd:
      5_000_000_000,
    marketCapUsd:
      1_900_000_000_000,
    volatility24h: 5.59,
    dataSource: "live",
    source: "CoinGecko",
    providerTimestamp:
      "2026-08-05T11:59:30.000Z",
    isStale: false,
    ...overrides,
  };
}

describe(
  "SqliteMarketSnapshotRepository",
  () => {
    let repository:
      SqliteMarketSnapshotRepository
      | undefined;

    let database:
      DatabaseSync | undefined;

    afterEach(() => {
      repository?.close();

      repository = undefined;
      database = undefined;
    });

    function createRepository():
      SqliteMarketSnapshotRepository {
      database =
        openSqliteDatabase({
          databasePath: ":memory:",
        });

      repository =
        new SqliteMarketSnapshotRepository(
          database,
        );

      return repository;
    }

    it(
      "starts with no snapshots",
      () => {
        const currentRepository =
          createRepository();

        expect(
          currentRepository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "saves and retrieves one snapshot",
      () => {
        const currentRepository =
          createRepository();

        const snapshot =
          createSnapshot();

        expect(
          currentRepository.save(
            snapshot,
          ),
        ).toEqual(snapshot);

        expect(
          currentRepository.getById(
            snapshot.id,
          ),
        ).toEqual(snapshot);
      },
    );

    it(
      "finds IDs and symbols case-insensitively",
      () => {
        const currentRepository =
          createRepository();

        currentRepository.save(
          createSnapshot(),
        );

        expect(
          currentRepository.getById(
            "ms-btc-20260805-0001",
          )?.symbol,
        ).toBe("BTC");

        expect(
          currentRepository.getBySymbol(
            "btc",
          ),
        ).toHaveLength(1);
      },
    );

    it(
      "returns the latest snapshot for a symbol",
      () => {
        const currentRepository =
          createRepository();

        currentRepository.saveMany([
          createSnapshot(),
          createSnapshot({
            id:
              "MS-BTC-20260805-0002",
            capturedAt:
              "2026-08-05T13:00:00.000Z",
            price: 101_000,
          }),
        ]);

        expect(
          currentRepository
            .getLatestBySymbol(
              "BTC",
            )
            ?.price,
        ).toBe(101_000);
      },
    );

    it(
      "filters snapshots by category",
      () => {
        const currentRepository =
          createRepository();

        currentRepository.saveMany([
          createSnapshot(),
          createSnapshot({
            id:
              "MS-NVDA-20260805-0001",
            symbol: "NVDA",
            category: "Stock",
            price: 180,
          }),
        ]);

        expect(
          currentRepository.getByCategory(
            "Crypto",
          ),
        ).toHaveLength(1);

        expect(
          currentRepository.getByCategory(
            "Stock",
          ),
        ).toHaveLength(1);
      },
    );

    it(
      "supports a nullable market capitalization and provider timestamp",
      () => {
        const currentRepository =
          createRepository();

        const snapshot =
          createSnapshot({
            id:
              "MS-FALLBACK-0001",
            marketCapUsd: null,
            providerTimestamp: null,
            dataSource:
              "fallback",
            source:
              "MarketPilot Demo",
          });

        currentRepository.save(
          snapshot,
        );

        expect(
          currentRepository.getById(
            snapshot.id,
          ),
        ).toEqual(snapshot);
      },
    );

    it(
      "saves a valid batch atomically",
      () => {
        const currentRepository =
          createRepository();

        const first =
          createSnapshot();

        const second =
          createSnapshot({
            id:
              "MS-ETH-20260805-0001",
            symbol: "ETH",
            price: 4_000,
          });

        expect(
          currentRepository.saveMany([
            first,
            second,
          ]),
        ).toEqual([
          first,
          second,
        ]);

        expect(
          currentRepository.getAll(),
        ).toHaveLength(2);
      },
    );

    it(
      "rolls back the complete batch when an ID is duplicated",
      () => {
        const currentRepository =
          createRepository();

        const first =
          createSnapshot();

        const duplicate =
          createSnapshot({
            symbol: "ETH",
          });

        expect(() =>
          currentRepository.saveMany([
            first,
            duplicate,
          ]),
        ).toThrow(
          "Market snapshot ID already exists.",
        );

        expect(
          currentRepository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "rejects a duplicate snapshot capture",
      () => {
        const currentRepository =
          createRepository();

        currentRepository.save(
          createSnapshot(),
        );

        expect(() =>
          currentRepository.save(
            createSnapshot({
              id:
                "MS-BTC-DUPLICATE",
            }),
          ),
        ).toThrow(
          "Market snapshot capture already exists.",
        );
      },
    );

    it(
      "returns an empty result for an empty save batch",
      () => {
        const currentRepository =
          createRepository();

        expect(
          currentRepository.saveMany(
            [],
          ),
        ).toEqual([]);
      },
    );

    it(
      "returns defensive snapshot copies",
      () => {
        const currentRepository =
          createRepository();

        const original =
          createSnapshot();

        const saved =
          currentRepository.save(
            original,
          );

        saved.symbol = "CHANGED";
        original.symbol = "ALTERED";

        expect(
          currentRepository.getById(
            "MS-BTC-20260805-0001",
          )?.symbol,
        ).toBe("BTC");
      },
    );
  },
);
