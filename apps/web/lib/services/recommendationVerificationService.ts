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
  verifyRecommendation,
} from "@/lib/recommendationVerification";

export class RecommendationVerificationService {
  constructor(
    private readonly repository:
      MarketSnapshotRepository,
  ) {}

  verify(
    recommendation:
      RecommendationRecord,
  ): RecommendationRecord {
    const snapshots =
      this.getEvaluationWindowSnapshots(
        recommendation,
      );

    const evaluationSnapshot =
      snapshots.at(-1);

    if (!evaluationSnapshot) {
      return recommendation;
    }

    const verification =
      verifyRecommendation({
        entryPrice:
          recommendation.entryPrice,
        evaluationPrice:
          evaluationSnapshot.price,
        targetReturn:
          recommendation.targetReturn,
      });

    const targetReached =
      snapshots.some(
        (snapshot) =>
          snapshot.price >=
          verification.targetPrice,
      );

    return {
      ...recommendation,
      evaluationPrice:
        evaluationSnapshot.price,
      targetPrice:
        verification.targetPrice,
      actualReturn:
        verification.actualReturn,
      status:
        targetReached
          ? "Successful"
          : "Unsuccessful",
      targetReached,
    };
  }

  private getEvaluationWindowSnapshots(
    recommendation:
      RecommendationRecord,
  ): MarketSnapshot[] {
    const windowStart =
      parseDateStart(
        recommendation.publishedAt,
      );

    const windowEnd =
      parseDateEnd(
        recommendation.evaluationDate,
      );

    return this.repository
      .getBySymbol(
        recommendation.symbol,
      )
      .filter(
        (snapshot) => {
          const capturedAt =
            Date.parse(
              snapshot.capturedAt,
            );

          return (
            Number.isFinite(
              capturedAt,
            ) &&
            capturedAt >=
              windowStart &&
            capturedAt <=
              windowEnd
          );
        },
      )
      .sort(
        (
          left,
          right,
        ) =>
          Date.parse(
            left.capturedAt,
          ) -
          Date.parse(
            right.capturedAt,
          ),
      );
  }
}

function parseDateStart(
  value: string,
): number {
  return Date.parse(
    `${value}T00:00:00.000Z`,
  );
}

function parseDateEnd(
  value: string,
): number {
  return Date.parse(
    `${value}T23:59:59.999Z`,
  );
}
