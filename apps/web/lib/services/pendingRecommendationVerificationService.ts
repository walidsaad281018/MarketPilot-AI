import type {
  RecommendationRecord,
} from "@/data/recommendations";

import type {
  RecommendationWriteDataSource,
} from "@/lib/recommendations/recommendationDataSource";

import {
  RecommendationVerificationService,
} from "@/lib/services/recommendationVerificationService";

export type VerifyPendingRecommendationsOptions = {
  currentDate?: Date;
  symbols?: string[];
};

export type VerifyPendingRecommendationsResult = {
  pendingCount: number;
  eligibleCount: number;
  verifiedCount: number;
  skippedCount: number;
  verifiedRecords:
    RecommendationRecord[];
};

export type PendingRecommendationVerificationServiceDependencies = {
  repository:
    RecommendationWriteDataSource;

  verificationService:
    RecommendationVerificationService;
};

export class PendingRecommendationVerificationService {
  private readonly repository:
    RecommendationWriteDataSource;

  private readonly verificationService:
    RecommendationVerificationService;

  constructor({
    repository,
    verificationService,
  }: PendingRecommendationVerificationServiceDependencies) {
    this.repository =
      repository;

    this.verificationService =
      verificationService;
  }

  async getPendingRecommendations():
    Promise<RecommendationRecord[]> {
    return this.repository.getPending();
  }

  async verifyPending({
    currentDate = new Date(),
    symbols,
  }: VerifyPendingRecommendationsOptions = {}):
    Promise<VerifyPendingRecommendationsResult> {
    validateCurrentDate(
      currentDate,
    );

    const pendingRecords =
      await this.getPendingRecommendations();

    const verificationSymbols =
      symbols === undefined
        ? null
        : new Set(
            normalizeUniqueSymbols(
              symbols,
            ),
          );

    const eligibleRecords =
      pendingRecords.filter(
        (recommendation) =>
          isEvaluationDue(
            recommendation,
            currentDate,
          ) &&
          (
            verificationSymbols === null ||
            verificationSymbols.has(
              recommendation.symbol
                .trim()
                .toUpperCase(),
            )
          ),
      );

    const verificationResults =
      await Promise.all(
        eligibleRecords.map(
          (recommendation) =>
            this.verificationService.verify(
              recommendation,
            ),
        ),
      );

    const verifiedRecords =
      verificationResults.filter(
        hasCompletedVerification,
      );

    const persistedRecords =
      verifiedRecords.length === 0
        ? []
        : await this.repository.updateMany(
            verifiedRecords,
          );

    return {
      pendingCount:
        pendingRecords.length,
      eligibleCount:
        eligibleRecords.length,
      verifiedCount:
        persistedRecords.length,
      skippedCount:
        pendingRecords.length -
        persistedRecords.length,
      verifiedRecords:
        persistedRecords,
    };
  }
}

function isEvaluationDue(
  recommendation:
    RecommendationRecord,
  currentDate: Date,
): boolean {
  const evaluationDate =
    Date.parse(
      `${recommendation.evaluationDate}T23:59:59.999Z`,
    );

  return (
    Number.isFinite(
      evaluationDate,
    ) &&
    currentDate.getTime() >=
      evaluationDate
  );
}

function hasCompletedVerification(
  recommendation:
    RecommendationRecord,
): boolean {
  return (
    recommendation.status !==
      "Pending" &&
    recommendation.evaluationPrice !==
      null &&
    recommendation.actualReturn !==
      null &&
    recommendation.targetReached !==
      null
  );
}

function normalizeUniqueSymbols(
  symbols: string[],
): string[] {
  return Array.from(
    new Set(
      symbols
        .map(
          (symbol) =>
            symbol
              .trim()
              .toUpperCase(),
        )
        .filter(
          (symbol) =>
            symbol.length > 0,
        ),
    ),
  );
}

function validateCurrentDate(
  currentDate: Date,
): void {
  if (
    !Number.isFinite(
      currentDate.getTime(),
    )
  ) {
    throw new Error(
      "Current verification date must be valid.",
    );
  }
}
