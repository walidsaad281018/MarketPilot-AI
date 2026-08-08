import {
  DatabaseSync,
} from "node:sqlite";
import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import type {
  RecommendationRecord,
} from "@/data/recommendations";
import {
  SqliteRecommendationRepository,
} from "@/lib/recommendations/sqliteRecommendationRepository";

function createRecommendation(
  overrides:
    Partial<RecommendationRecord> = {},
): RecommendationRecord {
  return {
    id: "MP-SQLITE-0001",
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

describe(
  "SqliteRecommendationRepository",
  () => {
    let repository:
      SqliteRecommendationRepository
      | undefined;

    afterEach(() => {
      repository?.close();
      repository = undefined;
    });

    function createRepository() {
      repository =
        new SqliteRecommendationRepository(
          new DatabaseSync(
            ":memory:",
          ),
        );

      return repository;
    }

    it(
      "starts with no recommendation records",
      () => {
        const currentRepository =
          createRepository();

        expect(
          currentRepository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "saves and retrieves one recommendation",
      () => {
        const currentRepository =
          createRepository();

        const recommendation =
          createRecommendation();

        const saved =
          currentRepository.save(
            recommendation,
          );

        expect(saved).toEqual(
          recommendation,
        );

        expect(
          currentRepository.getById(
            recommendation.id,
          ),
        ).toEqual(
          recommendation,
        );
      },
    );

    it(
      "finds IDs and symbols case-insensitively",
      () => {
        const currentRepository =
          createRepository();

        currentRepository.save(
          createRecommendation(),
        );

        expect(
          currentRepository.getById(
            "mp-sqlite-0001",
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
      "saves a valid batch atomically",
      () => {
        const currentRepository =
          createRepository();

        const first =
          createRecommendation();

        const second =
          createRecommendation({
            id: "MP-SQLITE-0002",
            asset: "Ethereum",
            symbol: "ETH",
          });

        const saved =
          currentRepository.saveMany([
            first,
            second,
          ]);

        expect(saved).toEqual([
          first,
          second,
        ]);

        expect(
          currentRepository.getAll(),
        ).toEqual([
          first,
          second,
        ]);
      },
    );

    it(
      "rolls back the entire batch when one ID is duplicated",
      () => {
        const currentRepository =
          createRepository();

        const first =
          createRecommendation();

        const duplicate =
          createRecommendation({
            id: "mp-sqlite-0001",
            asset: "Ethereum",
            symbol: "ETH",
          });

        expect(() =>
          currentRepository.saveMany([
            first,
            duplicate,
          ]),
        ).toThrow(
          "Recommendation ID already exists",
        );

        expect(
          currentRepository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "rejects duplicate publication keys",
      () => {
        const currentRepository =
          createRepository();

        currentRepository.save(
          createRecommendation(),
        );

        expect(() =>
          currentRepository.save(
            createRecommendation({
              id: "MP-SQLITE-0002",
            }),
          ),
        ).toThrow(
          "Recommendation publication already exists",
        );

        expect(
          currentRepository.getAll(),
        ).toHaveLength(1);
      },
    );

    it(
      "filters records by category and status",
      () => {
        const currentRepository =
          createRepository();

        currentRepository.saveMany([
          createRecommendation({
            id: "MP-SQLITE-CRYPTO",
          }),
          createRecommendation({
            id: "MP-SQLITE-STOCK",
            asset: "NVIDIA",
            symbol: "NVDA",
            category: "Stock",
            publishedAt:
              "2026-08-02",
            evaluationDate:
              "2026-08-09",
            evaluationPrice: 110,
            actualReturn: 10,
            status: "Successful",
            targetReached: true,
          }),
          createRecommendation({
            id: "MP-SQLITE-ETF",
            asset: "Vanguard ETF",
            symbol: "VOO",
            category: "ETF",
            publishedAt:
              "2026-08-03",
            evaluationDate:
              "2026-08-10",
            evaluationPrice: 98,
            actualReturn: -2,
            status: "Unsuccessful",
            targetReached: false,
          }),
        ]);

        expect(
          currentRepository.getByCategory(
            "Crypto",
          ),
        ).toHaveLength(1);

        expect(
          currentRepository.getPending(),
        ).toHaveLength(1);

        expect(
          currentRepository.getSuccessful(),
        ).toHaveLength(1);

        expect(
          currentRepository.getUnsuccessful(),
        ).toHaveLength(1);
      },
    );

    it(
      "calculates the success rate using completed records only",
      () => {
        const currentRepository =
          createRepository();

        currentRepository.saveMany([
          createRecommendation({
            id: "MP-SQLITE-PENDING",
          }),
          createRecommendation({
            id: "MP-SQLITE-SUCCESS-1",
            symbol: "ETH",
            publishedAt:
              "2026-08-02",
            evaluationDate:
              "2026-08-09",
            evaluationPrice: 110,
            actualReturn: 10,
            status: "Successful",
            targetReached: true,
          }),
          createRecommendation({
            id: "MP-SQLITE-SUCCESS-2",
            symbol: "SOL",
            publishedAt:
              "2026-08-03",
            evaluationDate:
              "2026-08-10",
            evaluationPrice: 108,
            actualReturn: 8,
            status: "Successful",
            targetReached: true,
          }),
          createRecommendation({
            id: "MP-SQLITE-FAILED",
            symbol: "LINK",
            publishedAt:
              "2026-08-04",
            evaluationDate:
              "2026-08-11",
            evaluationPrice: 98,
            actualReturn: -2,
            status: "Unsuccessful",
            targetReached: false,
          }),
        ]);

        expect(
          currentRepository.getSuccessRate(),
        ).toBe(67);
      },
    );

    it(
      "returns zero when no recommendations are completed",
      () => {
        const currentRepository =
          createRepository();

        currentRepository.save(
          createRecommendation(),
        );

        expect(
          currentRepository.getSuccessRate(),
        ).toBe(0);
      },
    );

    it(
      "returns defensive record copies",
      () => {
        const currentRepository =
          createRepository();

        const recommendation =
          createRecommendation();

        const saved =
          currentRepository.save(
            recommendation,
          );

        saved.asset =
          "Changed outside repository";

        recommendation.asset =
          "Also changed outside";

        expect(
          currentRepository.getById(
            "MP-SQLITE-0001",
          )?.asset,
        ).toBe("Bitcoin");
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
  },
);

describe(
  "SqliteRecommendationRepository updates",
  () => {
    it(
      "persists an updated recommendation",
      () => {
        const repository =
          new SqliteRecommendationRepository(
            new DatabaseSync(
              ":memory:",
            ),
          );

        try {
          const original =
            createRecommendation();

          repository.save(
            original,
          );

          const updated = {
            ...original,
            evaluationPrice: 110,
            actualReturn: 10,
            status:
              "Successful" as const,
            targetReached: true,
          };

          expect(
            repository.update(
              updated,
            ),
          ).toEqual(
            updated,
          );

          expect(
            repository.getById(
              original.id,
            ),
          ).toEqual(
            updated,
          );
        } finally {
          repository.close();
        }
      },
    );

    it(
      "updates IDs case-insensitively",
      () => {
        const repository =
          new SqliteRecommendationRepository(
            new DatabaseSync(
              ":memory:",
            ),
          );

        try {
          repository.save(
            createRecommendation(),
          );

          repository.update({
            ...createRecommendation(),
            id:
              "mp-sqlite-0001",
            evaluationPrice:
              102,
            actualReturn: 2,
            status:
              "Unsuccessful",
            targetReached:
              false,
          });

          expect(
            repository.getById(
              "MP-SQLITE-0001",
            ),
          ).toMatchObject({
            evaluationPrice:
              102,
            actualReturn: 2,
            status:
              "Unsuccessful",
            targetReached:
              false,
          });
        } finally {
          repository.close();
        }
      },
    );

    it(
      "rejects updating a missing recommendation",
      () => {
        const repository =
          new SqliteRecommendationRepository(
            new DatabaseSync(
              ":memory:",
            ),
          );

        try {
          expect(() =>
            repository.update(
              createRecommendation(),
            ),
          ).toThrow(
            "Recommendation does not exist",
          );
        } finally {
          repository.close();
        }
      },
    );

    it(
      "rolls back the complete update batch when one recommendation does not exist",
      () => {
        const repository =
          new SqliteRecommendationRepository(
            new DatabaseSync(
              ":memory:",
            ),
          );

        try {
          const first =
            createRecommendation();

          const second =
            createRecommendation({
              id:
                "MP-SQLITE-0002",
              symbol: "ETH",
              publishedAt:
                "2026-08-02",
            });

          repository.saveMany([
            first,
            second,
          ]);

          expect(() =>
            repository.updateMany([
              {
                ...first,
                evaluationPrice:
                  110,
                actualReturn: 10,
                status:
                  "Successful",
                targetReached:
                  true,
              },
              {
                ...second,
                id:
                  "MISSING-ID",
                evaluationPrice:
                  110,
                actualReturn: 10,
                status:
                  "Successful",
                targetReached:
                  true,
              },
            ]),
          ).toThrow(
            "Recommendation does not exist",
          );

          expect(
            repository.getById(
              first.id,
            ),
          ).toEqual(
            first,
          );

          expect(
            repository.getById(
              second.id,
            ),
          ).toEqual(
            second,
          );
        } finally {
          repository.close();
        }
      },
    );

    it(
      "rejects duplicate IDs in an update batch",
      () => {
        const repository =
          new SqliteRecommendationRepository(
            new DatabaseSync(
              ":memory:",
            ),
          );

        try {
          repository.saveMany([
            createRecommendation(),
            createRecommendation({
              id:
                "MP-SQLITE-0002",
              symbol: "ETH",
              publishedAt:
                "2026-08-02",
            }),
          ]);

          expect(() =>
            repository.updateMany([
              {
                ...createRecommendation(),
                evaluationPrice:
                  110,
                actualReturn: 10,
                status:
                  "Successful",
                targetReached:
                  true,
              },
              {
                ...createRecommendation({
                  id:
                    "mp-sqlite-0001",
                  symbol: "ETH",
                  publishedAt:
                    "2026-08-02",
                }),
                evaluationPrice:
                  110,
                actualReturn: 10,
                status:
                  "Successful",
                targetReached:
                  true,
              },
            ]),
          ).toThrow(
            "Duplicate recommendation ID in update batch",
          );
        } finally {
          repository.close();
        }
      },
    );
  },
);
