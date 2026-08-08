import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  RecommendationRecord,
} from "@/data/recommendations";
import {
  RecommendationRepository,
} from "@/lib/recommendations/recommendationRepository";

function createRecommendation(
  overrides:
    Partial<RecommendationRecord> = {},
): RecommendationRecord {
  return {
    id: "MP-TEST-0001",
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
  "RecommendationRepository",
  () => {
    it(
      "returns all demonstration recommendation records",
      () => {
        const repository =
          new RecommendationRepository();

        const records =
          repository.getAll();

        expect(records).toHaveLength(
          8,
        );

        expect(
          records.map(
            (record) => record.id,
          ),
        ).toEqual([
          "MP-DEMO-0001",
          "MP-DEMO-0002",
          "MP-DEMO-0003",
          "MP-DEMO-0004",
          "MP-DEMO-0005",
          "MP-DEMO-0006",
          "MP-DEMO-0007",
          "MP-DEMO-0008",
        ]);
      },
    );

    it(
      "returns independent arrays and record objects",
      () => {
        const repository =
          new RecommendationRepository();

        const firstResult =
          repository.getAll();

        const secondResult =
          repository.getAll();

        expect(firstResult).not.toBe(
          secondResult,
        );

        expect(firstResult[0]).not.toBe(
          secondResult[0],
        );

        expect(firstResult).toEqual(
          secondResult,
        );
      },
    );

    it(
      "finds a recommendation by ID case-insensitively",
      () => {
        const repository =
          new RecommendationRepository();

        const record =
          repository.getById(
            "mp-demo-0001",
          );

        expect(record).toBeDefined();

        expect(record?.symbol).toBe(
          "BTC",
        );
      },
    );

    it(
      "trims whitespace when finding a recommendation by ID",
      () => {
        const repository =
          new RecommendationRepository();

        const record =
          repository.getById(
            "  MP-DEMO-0002  ",
          );

        expect(record).toBeDefined();

        expect(record?.symbol).toBe(
          "NVDA",
        );
      },
    );

    it(
      "returns undefined when an ID does not exist",
      () => {
        const repository =
          new RecommendationRepository();

        expect(
          repository.getById(
            "MP-DEMO-9999",
          ),
        ).toBeUndefined();
      },
    );

    it(
      "finds recommendations by symbol case-insensitively",
      () => {
        const repository =
          new RecommendationRepository();

        const records =
          repository.getBySymbol(
            "eth",
          );

        expect(records).toHaveLength(
          1,
        );

        expect(records[0]?.asset).toBe(
          "Ethereum",
        );
      },
    );

    it(
      "returns recommendations by category",
      () => {
        const repository =
          new RecommendationRepository();

        expect(
          repository.getByCategory(
            "Crypto",
          ),
        ).toHaveLength(4);

        expect(
          repository.getByCategory(
            "Stock",
          ),
        ).toHaveLength(2);

        expect(
          repository.getByCategory(
            "ETF",
          ),
        ).toHaveLength(2);
      },
    );

    it(
      "returns pending recommendations",
      () => {
        const repository =
          new RecommendationRepository();

        const records =
          repository.getPending();

        expect(records).toHaveLength(
          2,
        );

        expect(
          records.map(
            (record) => record.id,
          ),
        ).toEqual([
          "MP-DEMO-0007",
          "MP-DEMO-0008",
        ]);
      },
    );

    it(
      "returns successful recommendations",
      () => {
        const repository =
          new RecommendationRepository();

        const records =
          repository.getSuccessful();

        expect(records).toHaveLength(
          4,
        );

        expect(
          records.every(
            (record) =>
              record.status ===
              "Successful",
          ),
        ).toBe(true);
      },
    );

    it(
      "returns unsuccessful recommendations",
      () => {
        const repository =
          new RecommendationRepository();

        const records =
          repository.getUnsuccessful();

        expect(records).toHaveLength(
          2,
        );

        expect(
          records.every(
            (record) =>
              record.status ===
              "Unsuccessful",
          ),
        ).toBe(true);
      },
    );

    it(
      "calculates success rate using only completed recommendations",
      () => {
        const repository =
          new RecommendationRepository();

        expect(
          repository.getSuccessRate(),
        ).toBe(67);
      },
    );

    it(
      "saves one recommendation",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        const recommendation =
          createRecommendation();

        const saved =
          repository.save(
            recommendation,
          );

        expect(saved).toEqual(
          recommendation,
        );

        expect(
          repository.getAll(),
        ).toEqual([
          recommendation,
        ]);
      },
    );

    it(
      "saves multiple recommendations atomically",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        const first =
          createRecommendation();

        const second =
          createRecommendation({
            id: "MP-TEST-0002",
            asset: "Ethereum",
            symbol: "ETH",
          });

        const saved =
          repository.saveMany([
            first,
            second,
          ]);

        expect(saved).toEqual([
          first,
          second,
        ]);

        expect(
          repository.getAll(),
        ).toEqual([
          first,
          second,
        ]);
      },
    );

    it(
      "returns an empty result when saving an empty batch",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        expect(
          repository.saveMany([]),
        ).toEqual([]);

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "rejects duplicate IDs case-insensitively",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        repository.save(
          createRecommendation(),
        );

        expect(() =>
          repository.save(
            createRecommendation({
              id: "mp-test-0001",
              symbol: "ETH",
              publishedAt:
                "2026-08-02",
            }),
          ),
        ).toThrow(
          "Recommendation ID already exists",
        );
      },
    );

    it(
      "rejects duplicate publication keys",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        repository.save(
          createRecommendation(),
        );

        expect(() =>
          repository.save(
            createRecommendation({
              id: "MP-TEST-0002",
            }),
          ),
        ).toThrow(
          "Recommendation publication already exists",
        );
      },
    );

    it(
      "does not partially save an invalid batch",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        const first =
          createRecommendation();

        const duplicate =
          createRecommendation({
            id: "mp-test-0001",
            asset: "Ethereum",
            symbol: "ETH",
          });

        expect(() =>
          repository.saveMany([
            first,
            duplicate,
          ]),
        ).toThrow(
          "Duplicate recommendation ID in save batch",
        );

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "protects stored records from external mutation",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        const recommendation =
          createRecommendation();

        const saved =
          repository.save(
            recommendation,
          );

        recommendation.asset =
          "Changed outside repository";

        saved.asset =
          "Changed returned result";

        expect(
          repository.getById(
            "MP-TEST-0001",
          )?.asset,
        ).toBe("Bitcoin");
      },
    );
  },
);

describe(
  "RecommendationRepository updates",
  () => {
    it(
      "updates an existing recommendation",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

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
      },
    );

    it(
      "updates IDs case-insensitively",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        repository.save(
          createRecommendation(),
        );

        repository.update({
          ...createRecommendation(),
          id: "mp-test-0001",
          evaluationPrice: 102,
          actualReturn: 2,
          status:
            "Unsuccessful",
          targetReached: false,
        });

        expect(
          repository.getById(
            "MP-TEST-0001",
          ),
        ).toMatchObject({
          evaluationPrice: 102,
          actualReturn: 2,
          status:
            "Unsuccessful",
          targetReached: false,
        });
      },
    );

    it(
      "rejects updating a missing recommendation",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        expect(() =>
          repository.update(
            createRecommendation(),
          ),
        ).toThrow(
          "Recommendation does not exist",
        );
      },
    );

    it(
      "rejects duplicate IDs in an update batch",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        repository.saveMany([
          createRecommendation(),
          createRecommendation({
            id: "MP-TEST-0002",
            symbol: "ETH",
            publishedAt:
              "2026-08-02",
          }),
        ]);

        expect(() =>
          repository.updateMany([
            createRecommendation({
              status:
                "Successful",
              evaluationPrice: 110,
              actualReturn: 10,
              targetReached: true,
            }),
            createRecommendation({
              id: "mp-test-0001",
              symbol: "ETH",
              publishedAt:
                "2026-08-02",
              status:
                "Successful",
              evaluationPrice: 110,
              actualReturn: 10,
              targetReached: true,
            }),
          ]),
        ).toThrow(
          "Duplicate recommendation ID in update batch",
        );
      },
    );

    it(
      "does not partially update when a batch is invalid",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        const first =
          createRecommendation();

        const second =
          createRecommendation({
            id: "MP-TEST-0002",
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
              evaluationPrice: 110,
              actualReturn: 10,
              status:
                "Successful",
              targetReached: true,
            },
            {
              ...second,
              id: "MISSING-ID",
              evaluationPrice: 110,
              actualReturn: 10,
              status:
                "Successful",
              targetReached: true,
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
      },
    );
  },
);
