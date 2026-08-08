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
  RecommendationRepository,
} from "@/lib/recommendations/recommendationRepository";

import {
  PendingRecommendationVerificationService,
} from "@/lib/services/pendingRecommendationVerificationService";

function createRecommendation(
  overrides:
    Partial<RecommendationRecord> = {},
): RecommendationRecord {
  return {
    id:
      "MP-PENDING-VERIFY-001",
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

function createVerifiedRecommendation(
  recommendation:
    RecommendationRecord,
): RecommendationRecord {
  return {
    ...recommendation,
    evaluationPrice: 110,
    actualReturn: 10,
    status: "Successful",
    targetReached: true,
  };
}

describe(
  "PendingRecommendationVerificationService",
  () => {
    it(
      "returns an empty result when no pending recommendations exist",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        const verificationService = {
          verify:
            vi.fn(),
        };

        const service =
          new PendingRecommendationVerificationService({
            repository,
            verificationService:
              verificationService as never,
          });

        expect(
          service.verifyPending({
            currentDate:
              new Date(
                "2026-08-09T12:00:00.000Z",
              ),
          }),
        ).toEqual({
          pendingCount: 0,
          eligibleCount: 0,
          verifiedCount: 0,
          skippedCount: 0,
          verifiedRecords: [],
        });

        expect(
          verificationService.verify,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "does not verify a recommendation before its evaluation date is complete",
      () => {
        const recommendation =
          createRecommendation();

        const repository =
          new RecommendationRepository([
            recommendation,
          ]);

        const verificationService = {
          verify:
            vi.fn(),
        };

        const service =
          new PendingRecommendationVerificationService({
            repository,
            verificationService:
              verificationService as never,
          });

        const result =
          service.verifyPending({
            currentDate:
              new Date(
                "2026-08-08T12:00:00.000Z",
              ),
          });

        expect(result).toEqual({
          pendingCount: 1,
          eligibleCount: 0,
          verifiedCount: 0,
          skippedCount: 1,
          verifiedRecords: [],
        });

        expect(
          verificationService.verify,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "verifies and persists an eligible pending recommendation",
      () => {
        const recommendation =
          createRecommendation();

        const repository =
          new RecommendationRepository([
            recommendation,
          ]);

        const verified =
          createVerifiedRecommendation(
            recommendation,
          );

        const verificationService = {
          verify:
            vi.fn()
              .mockReturnValue(
                verified,
              ),
        };

        const service =
          new PendingRecommendationVerificationService({
            repository,
            verificationService:
              verificationService as never,
          });

        const result =
          service.verifyPending({
            currentDate:
              new Date(
                "2026-08-09T00:00:00.000Z",
              ),
          });

        expect(
          result.verifiedCount,
        ).toBe(1);

        expect(
          result.verifiedRecords,
        ).toEqual([
          verified,
        ]);

        expect(
          repository.getById(
            recommendation.id,
          ),
        ).toEqual(
          verified,
        );
      },
    );

    it(
      "keeps an eligible recommendation pending when verification has no snapshot outcome",
      () => {
        const recommendation =
          createRecommendation();

        const repository =
          new RecommendationRepository([
            recommendation,
          ]);

        const verificationService = {
          verify:
            vi.fn()
              .mockReturnValue(
                recommendation,
              ),
        };

        const service =
          new PendingRecommendationVerificationService({
            repository,
            verificationService:
              verificationService as never,
          });

        const result =
          service.verifyPending({
            currentDate:
              new Date(
                "2026-08-09T00:00:00.000Z",
              ),
          });

        expect(result).toEqual({
          pendingCount: 1,
          eligibleCount: 1,
          verifiedCount: 0,
          skippedCount: 1,
          verifiedRecords: [],
        });

        expect(
          repository.getPending(),
        ).toEqual([
          recommendation,
        ]);
      },
    );

    it(
      "verifies multiple eligible recommendations in one repository update batch",
      () => {
        const first =
          createRecommendation();

        const second =
          createRecommendation({
            id:
              "MP-PENDING-VERIFY-002",
            asset: "Ethereum",
            symbol: "ETH",
            publishedAt:
              "2026-08-02",
            evaluationDate:
              "2026-08-07",
          });

        const repository =
          new RecommendationRepository([
            first,
            second,
          ]);

        const updateManySpy =
          vi.spyOn(
            repository,
            "updateMany",
          );

        const verificationService = {
          verify:
            vi.fn(
              (
                recommendation:
                  RecommendationRecord,
              ) =>
                createVerifiedRecommendation(
                  recommendation,
                ),
            ),
        };

        const service =
          new PendingRecommendationVerificationService({
            repository,
            verificationService:
              verificationService as never,
          });

        const result =
          service.verifyPending({
            currentDate:
              new Date(
                "2026-08-09T00:00:00.000Z",
              ),
          });

        expect(
          result.verifiedCount,
        ).toBe(2);

        expect(
          updateManySpy,
        ).toHaveBeenCalledOnce();

        expect(
          updateManySpy.mock
            .calls[0]?.[0],
        ).toHaveLength(2);
      },
    );

    it(
      "ignores recommendations that are already completed",
      () => {
        const completed =
          createRecommendation({
            evaluationPrice: 110,
            actualReturn: 10,
            status:
              "Successful",
            targetReached: true,
          });

        const repository =
          new RecommendationRepository([
            completed,
          ]);

        const verificationService = {
          verify:
            vi.fn(),
        };

        const service =
          new PendingRecommendationVerificationService({
            repository,
            verificationService:
              verificationService as never,
          });

        const result =
          service.verifyPending({
            currentDate:
              new Date(
                "2026-08-09T00:00:00.000Z",
              ),
          });

        expect(
          result.pendingCount,
        ).toBe(0);

        expect(
          verificationService.verify,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an invalid current date",
      () => {
        const repository =
          new RecommendationRepository(
            [],
          );

        const verificationService = {
          verify:
            vi.fn(),
        };

        const service =
          new PendingRecommendationVerificationService({
            repository,
            verificationService:
              verificationService as never,
          });

        expect(() =>
          service.verifyPending({
            currentDate:
              new Date(
                "invalid",
              ),
          }),
        ).toThrow(
          "Current verification date must be valid.",
        );
      },
    );
  },
);
