import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  RecommendationRecord,
} from "@/data/recommendations";

import type {
  MarketSnapshot,
} from "@/lib/marketSnapshots/marketSnapshot";

import type {
  MarketSnapshotRepository,
} from "@/lib/marketSnapshots/marketSnapshotRepository";

import {
  RecommendationVerificationService,
} from "@/lib/services/recommendationVerificationService";

function createRecommendation(
  overrides:
    Partial<RecommendationRecord> = {},
): RecommendationRecord {
  return {
    id: "MP-TEST-VERIFY-001",
    asset: "Bitcoin",
    symbol: "BTC",
    category: "Crypto",
    publishedAt:
      "2026-08-01",
    evaluationDate:
      "2026-08-08",
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

function createSnapshot(
  overrides:
    Partial<MarketSnapshot> = {},
): MarketSnapshot {
  return {
    id: "MS-TEST-001",
    symbol: "BTC",
    category: "Crypto",
    capturedAt:
      "2026-08-08T12:00:00.000Z",
    price: 110,
    priceChange24h: 3,
    volume24hUsd:
      5_000_000_000,
    marketCapUsd:
      1_900_000_000_000,
    volatility24h: 5,
    dataSource: "live",
    source: "CoinGecko",
    providerTimestamp:
      "2026-08-08T11:59:30.000Z",
    isStale: false,
    ...overrides,
  };
}

class StubMarketSnapshotRepository
  implements MarketSnapshotRepository
{
  constructor(
    private readonly snapshots:
      MarketSnapshot[],
  ) {}

  getAll(): MarketSnapshot[] {
    return [
      ...this.snapshots,
    ];
  }

  getById(
    snapshotId: string,
  ): MarketSnapshot | undefined {
    return this.snapshots.find(
      (snapshot) =>
        snapshot.id ===
        snapshotId,
    );
  }

  getBySymbol(
    symbol: string,
  ): MarketSnapshot[] {
    const normalizedSymbol =
      symbol
        .trim()
        .toUpperCase();

    return this.snapshots.filter(
      (snapshot) =>
        snapshot.symbol
          .trim()
          .toUpperCase() ===
        normalizedSymbol,
    );
  }

  getByCategory(
    category:
      MarketSnapshot["category"],
  ): MarketSnapshot[] {
    return this.snapshots.filter(
      (snapshot) =>
        snapshot.category ===
        category,
    );
  }

  getLatestBySymbol(
    symbol: string,
  ): MarketSnapshot | undefined {
    return this.getBySymbol(
      symbol,
    ).at(-1);
  }

  save(
    snapshot: MarketSnapshot,
  ): MarketSnapshot {
    return snapshot;
  }

  saveMany(
    snapshots:
      MarketSnapshot[],
  ): MarketSnapshot[] {
    return snapshots;
  }
}

describe(
  "RecommendationVerificationService",
  () => {
    it(
      "returns the recommendation unchanged when no eligible snapshot exists",
      () => {
        const recommendation =
          createRecommendation();

        const repository =
          new StubMarketSnapshotRepository(
            [],
          );

        const service =
          new RecommendationVerificationService(
            repository,
          );

        expect(
          service.verify(
            recommendation,
          ),
        ).toEqual(
          recommendation,
        );
      },
    );

    it(
      "marks the recommendation successful when the target is reached",
      () => {
        const recommendation =
          createRecommendation();

        const service =
          new RecommendationVerificationService(
            new StubMarketSnapshotRepository([
              createSnapshot({
                price: 110,
              }),
            ]),
          );

        expect(
          service.verify(
            recommendation,
          ),
        ).toEqual({
          ...recommendation,
          evaluationPrice: 110,
          targetPrice: 105,
          actualReturn: 10,
          status:
            "Successful",
          targetReached: true,
        });
      },
    );

    it(
      "marks the recommendation unsuccessful when the target is never reached",
      () => {
        const recommendation =
          createRecommendation();

        const service =
          new RecommendationVerificationService(
            new StubMarketSnapshotRepository([
              createSnapshot({
                price: 102,
              }),
            ]),
          );

        const result =
          service.verify(
            recommendation,
          );

        expect(
          result.evaluationPrice,
        ).toBe(102);

        expect(
          result.actualReturn,
        ).toBe(2);

        expect(
          result.status,
        ).toBe(
          "Unsuccessful",
        );

        expect(
          result.targetReached,
        ).toBe(false);
      },
    );

    it(
      "remembers a target hit earlier in the evaluation window",
      () => {
        const recommendation =
          createRecommendation();

        const service =
          new RecommendationVerificationService(
            new StubMarketSnapshotRepository([
              createSnapshot({
                id: "MS-TARGET-HIT",
                capturedAt:
                  "2026-08-05T12:00:00.000Z",
                price: 108,
              }),
              createSnapshot({
                id: "MS-EVALUATION",
                capturedAt:
                  "2026-08-08T12:00:00.000Z",
                price: 102,
              }),
            ]),
          );

        const result =
          service.verify(
            recommendation,
          );

        expect(
          result.evaluationPrice,
        ).toBe(102);

        expect(
          result.actualReturn,
        ).toBe(2);

        expect(
          result.status,
        ).toBe(
          "Successful",
        );

        expect(
          result.targetReached,
        ).toBe(true);
      },
    );

    it(
      "ignores snapshots captured after the evaluation date",
      () => {
        const recommendation =
          createRecommendation();

        const service =
          new RecommendationVerificationService(
            new StubMarketSnapshotRepository([
              createSnapshot({
                id: "MS-ELIGIBLE",
                capturedAt:
                  "2026-08-08T20:00:00.000Z",
                price: 102,
              }),
              createSnapshot({
                id: "MS-FUTURE",
                capturedAt:
                  "2026-08-09T08:00:00.000Z",
                price: 120,
              }),
            ]),
          );

        const result =
          service.verify(
            recommendation,
          );

        expect(
          result.evaluationPrice,
        ).toBe(102);

        expect(
          result.status,
        ).toBe(
          "Unsuccessful",
        );
      },
    );

    it(
      "ignores snapshots captured before publication",
      () => {
        const recommendation =
          createRecommendation();

        const service =
          new RecommendationVerificationService(
            new StubMarketSnapshotRepository([
              createSnapshot({
                id: "MS-BEFORE",
                capturedAt:
                  "2026-07-31T20:00:00.000Z",
                price: 120,
              }),
              createSnapshot({
                id: "MS-VALID",
                capturedAt:
                  "2026-08-08T12:00:00.000Z",
                price: 102,
              }),
            ]),
          );

        const result =
          service.verify(
            recommendation,
          );

        expect(
          result.evaluationPrice,
        ).toBe(102);

        expect(
          result.targetReached,
        ).toBe(false);
      },
    );

    it(
      "selects the latest eligible snapshot regardless of repository order",
      () => {
        const recommendation =
          createRecommendation();

        const service =
          new RecommendationVerificationService(
            new StubMarketSnapshotRepository([
              createSnapshot({
                id: "MS-NEW",
                capturedAt:
                  "2026-08-08T18:00:00.000Z",
                price: 104,
              }),
              createSnapshot({
                id: "MS-OLD",
                capturedAt:
                  "2026-08-04T18:00:00.000Z",
                price: 101,
              }),
            ]),
          );

        expect(
          service.verify(
            recommendation,
          ).evaluationPrice,
        ).toBe(104);
      },
    );

    it(
      "does not mutate the original recommendation",
      () => {
        const recommendation =
          createRecommendation();

        const original = {
          ...recommendation,
        };

        const service =
          new RecommendationVerificationService(
            new StubMarketSnapshotRepository([
              createSnapshot(),
            ]),
          );

        service.verify(
          recommendation,
        );

        expect(
          recommendation,
        ).toEqual(
          original,
        );
      },
    );
  },
);
