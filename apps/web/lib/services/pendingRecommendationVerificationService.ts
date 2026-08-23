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

  async verifyPending({
    currentDate = new Date(),
  }: VerifyPendingRecommendationsOptions = {}):
    Promise<VerifyPendingRecommendationsResult> {
    validateCurrentDate(
      currentDate,
    );

    const pendingRecords =
      await this.repository.getPending();

    const eligibleRecords =
      pendingRecords.filter(
        (recommendation) =>
          isEvaluationDue(
            recommendation,
            currentDate,
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
