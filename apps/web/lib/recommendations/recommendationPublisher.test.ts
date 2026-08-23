import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  RecommendationSourceRecord,
} from "@/data/recommendations";
import {
  RecommendationPublisher,
} from "@/lib/recommendations/recommendationPublisher";
import {
  RecommendationRepository,
} from "@/lib/recommendations/recommendationRepository";
import {
  RecommendationHistoryService,
} from "@/lib/services/recommendationHistoryService";

function createCandidate(
  overrides:
    Partial<RecommendationSourceRecord> = {},
): RecommendationSourceRecord {
  return {
    id: "MP-TEST-20260801-BTC",
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
    ...overrides,
  };
}

function createTestContext() {
  const repository =
    new RecommendationRepository(
      [],
    );

  const publisher =
    new RecommendationPublisher({
      repository,
    });

  return {
    repository,
    publisher,
  };
}

describe(
  "RecommendationPublisher",
  () => {
    it(
      "returns an empty result for an empty candidate batch",
      async () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const result =
          await publisher.publish([]);

        expect(
          result.publishedCount,
        ).toBe(0);

        expect(
          result.publishedRecords,
        ).toEqual([]);

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "converts and saves a valid candidate as a pending recommendation",
      async () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const candidate =
          createCandidate();

        const result =
          await publisher.publish([
            candidate,
          ]);

        expect(
          result.publishedCount,
        ).toBe(1);

        expect(
          result.publishedRecords,
        ).toHaveLength(1);

        expect(
          result.publishedRecords[0],
        ).toMatchObject({
          ...candidate,
          targetPrice: 105,
          actualReturn: null,
          status: "Pending",
          targetReached: null,
        });

        expect(
          repository.getAll(),
        ).toEqual(
          result.publishedRecords,
        );
      },
    );

    it(
      "makes a published recommendation available through the history service",
      async () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const historyService =
          new RecommendationHistoryService(
            repository,
          );

        const candidate =
          createCandidate();

        await publisher.publish([
          candidate,
        ]);

        const recommendation =
          await historyService.getRecommendation(
            candidate.id,
          );

        expect(
          recommendation,
        ).toMatchObject({
          id: candidate.id,
          symbol: candidate.symbol,
          status: "Pending",
          targetPrice: 105,
        });

        expect(
          await historyService
            .getAllRecommendations(),
        ).toHaveLength(1);
      },
    );

    it(
      "saves every recommendation in a valid batch",
      async () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const firstCandidate =
          createCandidate();

        const secondCandidate =
          createCandidate({
            id: "MP-TEST-20260801-ETH",
            asset: "Ethereum",
            symbol: "ETH",
          });

        const result =
          await publisher.publish([
            firstCandidate,
            secondCandidate,
          ]);

        expect(
          result.publishedCount,
        ).toBe(2);

        expect(
          repository.getAll(),
        ).toHaveLength(2);

        expect(
          repository
            .getAll()
            .map(
              (record) => record.id,
            ),
        ).toEqual([
          firstCandidate.id,
          secondCandidate.id,
        ]);
      },
    );

    it(
      "rejects duplicate recommendation IDs inside one batch",
      async () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const firstCandidate =
          createCandidate();

        const secondCandidate =
          createCandidate({
            asset: "Ethereum",
            symbol: "ETH",
          });

        await expect(
          publisher.publish([
            firstCandidate,
            secondCandidate,
          ]),
        ).rejects.toThrow(
          "Duplicate recommendation ID in publication batch",
        );

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "treats recommendation IDs as case-insensitive",
      async () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const firstCandidate =
          createCandidate({
            id: "MP-TEST-CASE-ID",
          });

        const secondCandidate =
          createCandidate({
            id: "mp-test-case-id",
            asset: "Ethereum",
            symbol: "ETH",
          });

        await expect(
          publisher.publish([
            firstCandidate,
            secondCandidate,
          ]),
        ).rejects.toThrow(
          "Duplicate recommendation ID in publication batch",
        );

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "rejects duplicate symbol and publication-date combinations",
      async () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const firstCandidate =
          createCandidate({
            id: "MP-TEST-PUBLICATION-1",
          });

        const secondCandidate =
          createCandidate({
            id: "MP-TEST-PUBLICATION-2",
          });

        await expect(
          publisher.publish([
            firstCandidate,
            secondCandidate,
          ]),
        ).rejects.toThrow(
          "Duplicate recommendation publication in batch",
        );

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "rejects an ID that already exists in the repository",
      async () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const existingCandidate =
          createCandidate({
            id: "MP-EXISTING-0001",
            symbol: "BTC",
            publishedAt:
              "2026-08-01",
            evaluationDate:
              "2026-08-08",
          });

        await publisher.publish([
          existingCandidate,
        ]);

        const duplicateCandidate =
          createCandidate({
            id: "mp-existing-0001",
            asset: "Ethereum",
            symbol: "ETH",
            publishedAt:
              "2026-08-02",
            evaluationDate:
              "2026-08-09",
          });

        await expect(
          publisher.publish([
            duplicateCandidate,
          ]),
        ).rejects.toThrow(
          "Recommendation ID already exists",
        );

        expect(
          repository.getAll(),
        ).toHaveLength(1);
      },
    );

    it(
      "rejects a publication that already exists in the repository",
      async () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        await publisher.publish([
          createCandidate({
            id: "MP-EXISTING-BTC",
          }),
        ]);

        const duplicatePublication =
          createCandidate({
            id: "MP-NEW-BTC",
          });

        await expect(
          publisher.publish([
            duplicatePublication,
          ]),
        ).rejects.toThrow(
          "A recommendation already exists for BTC on 2026-08-01",
        );

        expect(
          repository.getAll(),
        ).toHaveLength(1);
      },
    );

    it(
      "rejects an evaluation date that is not later than publication",
      async () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const candidate =
          createCandidate({
            id: "MP-TEST-DATE",
            publishedAt:
              "2026-08-20",
            evaluationDate:
              "2026-08-20",
          });

        await expect(
          publisher.publish([
            candidate,
          ]),
        ).rejects.toThrow(
          "Evaluation date must be later than publication date",
        );

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "validates the complete batch before saving records",
      async () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const validCandidate =
          createCandidate({
            id: "MP-TEST-ATOMIC-1",
            symbol: "BTC",
            publishedAt:
              "2026-09-01",
            evaluationDate:
              "2026-09-08",
          });

        const invalidCandidate =
          createCandidate({
            id: "MP-TEST-ATOMIC-2",
            symbol: "ETH",
            publishedAt:
              "2026-09-01",
            evaluationDate:
              "2026-09-08",
            entryPrice: 0,
          });

        await expect(
          publisher.publish([
            validCandidate,
            invalidCandidate,
          ]),
        ).rejects.toThrow(
          "Entry price must be a positive finite number",
        );

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );
  },
);
