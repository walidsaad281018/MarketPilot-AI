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
      () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const result =
          publisher.publish([]);

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
      () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        const candidate =
          createCandidate();

        const result =
          publisher.publish([
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
      () => {
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

        publisher.publish([
          candidate,
        ]);

        const recommendation =
          historyService.getRecommendation(
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
          historyService
            .getAllRecommendations(),
        ).toHaveLength(1);
      },
    );

    it(
      "saves every recommendation in a valid batch",
      () => {
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
          publisher.publish([
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
      () => {
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

        expect(() =>
          publisher.publish([
            firstCandidate,
            secondCandidate,
          ]),
        ).toThrow(
          "Duplicate recommendation ID in publication batch",
        );

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "treats recommendation IDs as case-insensitive",
      () => {
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

        expect(() =>
          publisher.publish([
            firstCandidate,
            secondCandidate,
          ]),
        ).toThrow(
          "Duplicate recommendation ID in publication batch",
        );

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "rejects duplicate symbol and publication-date combinations",
      () => {
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

        expect(() =>
          publisher.publish([
            firstCandidate,
            secondCandidate,
          ]),
        ).toThrow(
          "Duplicate recommendation publication in batch",
        );

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "rejects an ID that already exists in the repository",
      () => {
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

        publisher.publish([
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

        expect(() =>
          publisher.publish([
            duplicateCandidate,
          ]),
        ).toThrow(
          "Recommendation ID already exists",
        );

        expect(
          repository.getAll(),
        ).toHaveLength(1);
      },
    );

    it(
      "rejects a publication that already exists in the repository",
      () => {
        const {
          publisher,
          repository,
        } = createTestContext();

        publisher.publish([
          createCandidate({
            id: "MP-EXISTING-BTC",
          }),
        ]);

        const duplicatePublication =
          createCandidate({
            id: "MP-NEW-BTC",
          });

        expect(() =>
          publisher.publish([
            duplicatePublication,
          ]),
        ).toThrow(
          "A recommendation already exists for BTC on 2026-08-01",
        );

        expect(
          repository.getAll(),
        ).toHaveLength(1);
      },
    );

    it(
      "rejects an evaluation date that is not later than publication",
      () => {
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

        expect(() =>
          publisher.publish([
            candidate,
          ]),
        ).toThrow(
          "Evaluation date must be later than publication date",
        );

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "validates the complete batch before saving records",
      () => {
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

        expect(() =>
          publisher.publish([
            validCandidate,
            invalidCandidate,
          ]),
        ).toThrow(
          "Entry price must be a positive finite number",
        );

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );
  },
);
