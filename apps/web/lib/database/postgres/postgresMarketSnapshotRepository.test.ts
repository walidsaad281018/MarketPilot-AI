import type {
  Sql,
} from "postgres";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  PostgresMarketSnapshotRow,
} from "@/lib/database/postgres/postgresMarketSnapshotMapper";
import {
  PostgresMarketSnapshotRepository,
} from "@/lib/database/postgres/postgresMarketSnapshotRepository";
import type {
  MarketSnapshot,
} from "@/lib/marketSnapshots/marketSnapshot";

function createSnapshot(
  overrides:
    Partial<MarketSnapshot> = {},
): MarketSnapshot {
  return {
    id: "SNAP-POSTGRES-0001",
    symbol: "BTC",
    category: "Crypto",
    capturedAt:
      "2026-08-29T12:00:00.000Z",
    price: 100,
    priceChange24h: 2.5,
    volume24hUsd: 1_000_000,
    marketCapUsd: 2_000_000,
    volatility24h: 3.2,
    dataSource: "live",
    source: "test-provider",
    providerTimestamp:
      "2026-08-29T11:59:00.000Z",
    isStale: false,
    ...overrides,
  };
}

function createRow(
  overrides:
    Partial<PostgresMarketSnapshotRow> = {},
): PostgresMarketSnapshotRow {
  return {
    id: "SNAP-POSTGRES-0001",
    symbol: "BTC",
    category: "Crypto",
    captured_at:
      "2026-08-29T12:00:00.000Z",
    price: 100,
    price_change_24h: 2.5,
    volume_24h_usd: 1_000_000,
    market_cap_usd: 2_000_000,
    volatility_24h: 3.2,
    data_source: "live",
    source: "test-provider",
    provider_timestamp:
      "2026-08-29T11:59:00.000Z",
    is_stale: false,
    ...overrides,
  };
}

type QueryHandler = (
  query: string,
  values: unknown[],
) => Promise<unknown[]>;

function createSqlMock(
  handler: QueryHandler,
) {
  const queryMock =
    vi.fn(
      async (
        strings: TemplateStringsArray,
        ...values: unknown[]
      ) => {
        const query =
          strings.join("?");

        return handler(
          query,
          values,
        );
      },
    );

  const transactionQueryMock =
    vi.fn(
      async (
        strings: TemplateStringsArray,
        ...values: unknown[]
      ) => {
        const query =
          strings.join("?");

        return handler(
          query,
          values,
        );
      },
    );

  const transactionSql =
    transactionQueryMock as unknown as Sql;

  const beginMock =
    vi.fn(
      async (
        callback:
          (
            transaction: Sql,
          ) => Promise<unknown>,
      ) => {
        return callback(
          transactionSql,
        );
      },
    );

  const endMock =
    vi.fn(
      async () => undefined,
    );

  const sql =
    queryMock as unknown as Sql;

  Object.assign(
    sql,
    {
      begin: beginMock,
      end: endMock,
    },
  );

  return {
    sql,
    queryMock,
    transactionQueryMock,
    beginMock,
    endMock,
  };
}

describe(
  "PostgresMarketSnapshotRepository",
  () => {
    it(
      "reads a market snapshot by ID case-insensitively",
      async () => {
        const {
          sql,
          queryMock,
        } =
          createSqlMock(
            async (
              query,
            ) => {
              if (
                query.includes(
                  "upper(id)",
                )
              ) {
                return [
                  createRow(),
                ];
              }

              return [];
            },
          );

        const repository =
          new PostgresMarketSnapshotRepository(
            sql,
          );

        const result =
          await repository.getById(
            "snap-postgres-0001",
          );

        expect(result).toEqual(
          createSnapshot(),
        );

        expect(
          queryMock,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "reads market snapshots by symbol case-insensitively",
      async () => {
        const {
          sql,
        } =
          createSqlMock(
            async (
              query,
            ) => {
              if (
                query.includes(
                  "upper(symbol)",
                )
              ) {
                return [
                  createRow(),
                ];
              }

              return [];
            },
          );

        const repository =
          new PostgresMarketSnapshotRepository(
            sql,
          );

        const result =
          await repository.getBySymbol(
            "btc",
          );

        expect(result).toEqual([
          createSnapshot(),
        ]);
      },
    );

    it(
      "reads the latest market snapshot by symbol",
      async () => {
        const {
          sql,
          queryMock,
        } =
          createSqlMock(
            async (
              query,
            ) => {
              if (
                query.includes(
                  "upper(symbol)",
                )
              ) {
                return [
                  createRow(),
                ];
              }

              return [];
            },
          );

        const repository =
          new PostgresMarketSnapshotRepository(
            sql,
          );

        const result =
          await repository
            .getLatestBySymbol(
              "btc",
            );

        expect(result).toEqual(
          createSnapshot(),
        );

        const query =
          String(
            queryMock.mock
              .calls[0]?.[0]
              ?.join("?") ?? "",
          );

        expect(query).toContain(
          "captured_at DESC",
        );

        expect(query).toContain(
          "id DESC",
        );

        expect(query).toContain(
          "LIMIT 1",
        );
      },
    );

    it(
      "saves a market snapshot inside a transaction",
      async () => {
        const {
          sql,
          beginMock,
          transactionQueryMock,
        } =
          createSqlMock(
            async (
              query,
            ) => {
              if (
                query.includes(
                  "SELECT id",
                )
              ) {
                return [];
              }

              if (
                query.includes(
                  "INSERT INTO market_snapshots",
                )
              ) {
                return [];
              }

              return [];
            },
          );

        const repository =
          new PostgresMarketSnapshotRepository(
            sql,
          );

        const snapshot =
          createSnapshot();

        const result =
          await repository.save(
            snapshot,
          );

        expect(result).toEqual(
          snapshot,
        );

        expect(
          result,
        ).not.toBe(
          snapshot,
        );

        expect(
          beginMock,
        ).toHaveBeenCalledTimes(1);

        expect(
          transactionQueryMock,
        ).toHaveBeenCalledTimes(2);
      },
    );

    it(
      "rejects duplicate IDs inside a save batch before opening a transaction",
      async () => {
        const {
          sql,
          beginMock,
        } =
          createSqlMock(
            async () => [],
          );

        const repository =
          new PostgresMarketSnapshotRepository(
            sql,
          );

        await expect(
          repository.saveMany([
            createSnapshot(),
            createSnapshot({
              id:
                "snap-postgres-0001",
              symbol: "ETH",
              capturedAt:
                "2026-08-29T12:01:00.000Z",
            }),
          ]),
        ).rejects.toThrow(
          "Duplicate market snapshot ID in save batch",
        );

        expect(
          beginMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects duplicate capture keys inside a save batch before opening a transaction",
      async () => {
        const {
          sql,
          beginMock,
        } =
          createSqlMock(
            async () => [],
          );

        const repository =
          new PostgresMarketSnapshotRepository(
            sql,
          );

        await expect(
          repository.saveMany([
            createSnapshot(),
            createSnapshot({
              id:
                "SNAP-POSTGRES-0002",
              symbol: "btc",
            }),
          ]),
        ).rejects.toThrow(
          "Duplicate market snapshot capture in save batch",
        );

        expect(
          beginMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an existing market snapshot ID case-insensitively",
      async () => {
        const {
          sql,
        } =
          createSqlMock(
            async (
              query,
            ) => {
              if (
                query.includes(
                  "SELECT id",
                )
              ) {
                return [
                  {
                    id:
                      "SNAP-POSTGRES-0001",
                  },
                ];
              }

              return [];
            },
          );

        const repository =
          new PostgresMarketSnapshotRepository(
            sql,
          );

        await expect(
          repository.save(
            createSnapshot({
              id:
                "snap-postgres-0001",
            }),
          ),
        ).rejects.toThrow(
          "Market snapshot ID already exists",
        );
      },
    );

    it(
      "translates the PostgreSQL capture uniqueness constraint",
      async () => {
        const postgresError =
          Object.assign(
            new Error(
              "duplicate key value",
            ),
            {
              code: "23505",
              constraint:
                "market_snapshots_capture_unique_idx",
            },
          );

        const {
          sql,
          beginMock,
        } =
          createSqlMock(
            async () => [],
          );

        beginMock.mockRejectedValueOnce(
          postgresError,
        );

        const repository =
          new PostgresMarketSnapshotRepository(
            sql,
          );

        await expect(
          repository.save(
            createSnapshot(),
          ),
        ).rejects.toThrow(
          "Market snapshot capture already exists.",
        );
      },
    );

    it(
      "translates the PostgreSQL case-insensitive ID uniqueness constraint",
      async () => {
        const postgresError =
          Object.assign(
            new Error(
              "duplicate key value",
            ),
            {
              code: "23505",
              constraint:
                "market_snapshots_id_upper_unique_idx",
            },
          );

        const {
          sql,
          beginMock,
        } =
          createSqlMock(
            async () => [],
          );

        beginMock.mockRejectedValueOnce(
          postgresError,
        );

        const repository =
          new PostgresMarketSnapshotRepository(
            sql,
          );

        await expect(
          repository.save(
            createSnapshot(),
          ),
        ).rejects.toThrow(
          "Market snapshot ID already exists.",
        );
      },
    );

    it(
      "closes the PostgreSQL client",
      async () => {
        const {
          sql,
          endMock,
        } =
          createSqlMock(
            async () => [],
          );

        const repository =
          new PostgresMarketSnapshotRepository(
            sql,
          );

        await repository.close();

        expect(
          endMock,
        ).toHaveBeenCalledTimes(1);
      },
    );
  },
);
