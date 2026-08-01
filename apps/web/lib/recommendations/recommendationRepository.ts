import {
  recommendationRecords,
  type RecommendationRecord,
} from "@/data/recommendations";
import type {
  RecommendationCategory,
  RecommendationWriteDataSource,
} from "@/lib/recommendations/recommendationDataSource";

export class RecommendationRepository
  implements RecommendationWriteDataSource
{
  private readonly records:
    RecommendationRecord[];

  constructor(
    initialRecords:
      RecommendationRecord[] =
        recommendationRecords,
  ) {
    this.records =
      initialRecords.map(
        cloneRecommendation,
      );

    validateStoredRecords(
      this.records,
    );
  }

  getAll(): RecommendationRecord[] {
    return this.records.map(
      cloneRecommendation,
    );
  }

  getById(
    recommendationId: string,
  ): RecommendationRecord | undefined {
    const normalizedId =
      normalizeIdentifier(
        recommendationId,
      );

    const recommendation =
      this.records.find(
        (record) =>
          normalizeIdentifier(
            record.id,
          ) === normalizedId,
      );

    return recommendation
      ? cloneRecommendation(
          recommendation,
        )
      : undefined;
  }

  getBySymbol(
    symbol: string,
  ): RecommendationRecord[] {
    const normalizedSymbol =
      normalizeIdentifier(symbol);

    return this.records
      .filter(
        (record) =>
          normalizeIdentifier(
            record.symbol,
          ) === normalizedSymbol,
      )
      .map(cloneRecommendation);
  }

  getByCategory(
    category: RecommendationCategory,
  ): RecommendationRecord[] {
    return this.records
      .filter(
        (record) =>
          record.category === category,
      )
      .map(cloneRecommendation);
  }

  getPending(): RecommendationRecord[] {
    return this.records
      .filter(
        (record) =>
          record.status === "Pending",
      )
      .map(cloneRecommendation);
  }

  getSuccessful(): RecommendationRecord[] {
    return this.records
      .filter(
        (record) =>
          record.status ===
          "Successful",
      )
      .map(cloneRecommendation);
  }

  getUnsuccessful(): RecommendationRecord[] {
    return this.records
      .filter(
        (record) =>
          record.status ===
          "Unsuccessful",
      )
      .map(cloneRecommendation);
  }

  getSuccessRate(): number {
    const completed =
      this.records.filter(
        (record) =>
          record.status !== "Pending",
      );

    if (completed.length === 0) {
      return 0;
    }

    const successful =
      completed.filter(
        (record) =>
          record.status ===
          "Successful",
      ).length;

    return Math.round(
      (
        successful /
        completed.length
      ) * 100,
    );
  }

  save(
    recommendation:
      RecommendationRecord,
  ): RecommendationRecord {
    const [savedRecommendation] =
      this.saveMany([
        recommendation,
      ]);

    if (!savedRecommendation) {
      throw new Error(
        "Recommendation was not saved.",
      );
    }

    return savedRecommendation;
  }

  saveMany(
    recommendations:
      RecommendationRecord[],
  ): RecommendationRecord[] {
    if (
      recommendations.length === 0
    ) {
      return [];
    }

    const recordsToSave =
      recommendations.map(
        cloneRecommendation,
      );

    validateNewRecords(
      recordsToSave,
      this.records,
    );

    this.records.push(
      ...recordsToSave,
    );

    return recordsToSave.map(
      cloneRecommendation,
    );
  }
}

function validateStoredRecords(
  records: RecommendationRecord[],
): void {
  validateNewRecords(
    records,
    [],
  );
}

function validateNewRecords(
  newRecords: RecommendationRecord[],
  existingRecords:
    RecommendationRecord[],
): void {
  const existingIds =
    new Set(
      existingRecords.map(
        (record) =>
          normalizeIdentifier(
            record.id,
          ),
      ),
    );

  const existingPublicationKeys =
    new Set(
      existingRecords.map(
        createPublicationKey,
      ),
    );

  const batchIds =
    new Set<string>();

  const batchPublicationKeys =
    new Set<string>();

  for (
    const recommendation
    of newRecords
  ) {
    const normalizedId =
      normalizeIdentifier(
        recommendation.id,
      );

    if (!normalizedId) {
      throw new Error(
        "Recommendation ID is required.",
      );
    }

    if (
      existingIds.has(
        normalizedId,
      )
    ) {
      throw new Error(
        `Recommendation ID already exists: ${recommendation.id}.`,
      );
    }

    if (
      batchIds.has(
        normalizedId,
      )
    ) {
      throw new Error(
        `Duplicate recommendation ID in save batch: ${recommendation.id}.`,
      );
    }

    const publicationKey =
      createPublicationKey(
        recommendation,
      );

    if (
      existingPublicationKeys.has(
        publicationKey,
      )
    ) {
      throw new Error(
        `Recommendation publication already exists for ${recommendation.symbol} on ${recommendation.publishedAt}.`,
      );
    }

    if (
      batchPublicationKeys.has(
        publicationKey,
      )
    ) {
      throw new Error(
        `Duplicate recommendation publication in save batch for ${recommendation.symbol} on ${recommendation.publishedAt}.`,
      );
    }

    batchIds.add(
      normalizedId,
    );

    batchPublicationKeys.add(
      publicationKey,
    );
  }
}

function createPublicationKey(
  recommendation:
    RecommendationRecord,
): string {
  return [
    recommendation.category,
    normalizeIdentifier(
      recommendation.symbol,
    ),
    recommendation.publishedAt,
  ].join(":");
}

function normalizeIdentifier(
  value: string,
): string {
  return value
    .trim()
    .toUpperCase();
}

function cloneRecommendation(
  recommendation:
    RecommendationRecord,
): RecommendationRecord {
  return {
    ...recommendation,
  };
}

export const recommendationRepository =
  new RecommendationRepository();
