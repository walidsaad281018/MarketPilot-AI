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
  RecommendationRecord,
} from "@/data/recommendations";
import {
  PostgresRecommendationRepository,
} from "@/lib/database/postgres/postgresRecommendationRepository";
import type {
  PostgresRecommendationRow,
} from "@/lib/database/postgres/postgresRecommendationMapper";

function createRecommendation(
  overrides:
    Partial<RecommendationRecord> = {},
): RecommendationRecord {
  return {
    id: "MP-POSTGRES-0001",
    asset: "Bitcoin",
    symbol: "BTC",
    category: "Crypto",
    publishedAt: "2026-08-01",
    evaluationDate: "2026-08-08",
    entryPrice: 100,
    evaluationPrice: null,
    targetReturn: 5,
    score: 90,
    confidence: 88,
    targetPrice: 105,
    actualReturn: null,
    status: "Pending",
    targetReached: null,
    ...overrides,
  };
}

function createRow(
  overrides:
    Partial<PostgresRecommendationRow> = {},
): PostgresRecommendationRow {
  return {
    id: "MP-POSTGRES-0001",
    asset: "Bitcoin",
    symbol: "BTC",
    category: "Crypto",
    published_at: "2026-08-01",
    evaluation_date: "2026-08-08",
    entry_price: 100,
    evaluation_price: null,
    target_return: 5,
    score: 90,
    confidence: 88,
    target_price: 105,
    actual_return: null,
    status: "Pending",
    target_reached: null,
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
  "PostgresRecommendationRepository",
  () => {
    it(
      "reads a recommendation by ID case-insensitively",
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
          new PostgresRecommendationRepository(
            sql,
          );

        const result =
          await repository.getById(
            "mp-postgres-0001",
          );

        expect(result).toEqual(
          createRecommendation(),
        );

        expect(
          queryMock,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "reads recommendations by symbol case-insensitively",
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
          new PostgresRecommendationRepository(
            sql,
          );

        const result =
          await repository.getBySymbol(
            "btc",
          );

        expect(result).toEqual([
          createRecommendation(),
        ]);
      },
    );

    it(
      "calculates success rate from completed records",
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
                  "completed_count",
                )
              ) {
                return [
                  {
                    completed_count:
                      "3",
                    successful_count:
                      "2",
                  },
                ];
              }

              return [];
            },
          );

        const repository =
          new PostgresRecommendationRepository(
            sql,
          );

        expect(
          await repository
            .getSuccessRate(),
        ).toBe(67);
      },
    );

    it(
      "saves a recommendation inside a transaction",
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
                  "INSERT INTO recommendations",
                )
              ) {
                return [];
              }

              return [];
            },
          );

        const repository =
          new PostgresRecommendationRepository(
            sql,
          );

        const recommendation =
          createRecommendation();

        const result =
          await repository.save(
            recommendation,
          );

        expect(result).toEqual(
          recommendation,
        );

        expect(
          result,
        ).not.toBe(
          recommendation,
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
          new PostgresRecommendationRepository(
            sql,
          );

        await expect(
          repository.saveMany([
            createRecommendation(),
            createRecommendation({
              id:
                "mp-postgres-0001",
              symbol: "ETH",
              publishedAt:
                "2026-08-02",
            }),
          ]),
        ).rejects.toThrow(
          "Duplicate recommendation ID in save batch",
        );

        expect(
          beginMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an existing recommendation ID case-insensitively",
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
                      "MP-POSTGRES-0001",
                  },
                ];
              }

              return [];
            },
          );

        const repository =
          new PostgresRecommendationRepository(
            sql,
          );

        await expect(
          repository.save(
            createRecommendation({
              id:
                "mp-postgres-0001",
            }),
          ),
        ).rejects.toThrow(
          "Recommendation ID already exists",
        );
      },
    );

    it(
      "rejects updating a recommendation that does not exist",
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
                  "UPDATE recommendations",
                )
              ) {
                return [];
              }

              return [];
            },
          );

        const repository =
          new PostgresRecommendationRepository(
            sql,
          );

        await expect(
          repository.update(
            createRecommendation(),
          ),
        ).rejects.toThrow(
          "Recommendation does not exist",
        );
      },
    );

    it(
      "translates the PostgreSQL publication uniqueness constraint",
      async () => {
        const postgresError =
          Object.assign(
            new Error(
              "duplicate key value",
            ),
            {
              code: "23505",
              constraint:
                "recommendations_publication_unique_idx",
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
          new PostgresRecommendationRepository(
            sql,
          );

        await expect(
          repository.save(
            createRecommendation(),
          ),
        ).rejects.toThrow(
          "Recommendation publication already exists.",
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
          new PostgresRecommendationRepository(
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
