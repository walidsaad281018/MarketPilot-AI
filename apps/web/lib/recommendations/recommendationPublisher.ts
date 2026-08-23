import type {
  RecommendationRecord,
  RecommendationSourceRecord,
} from "@/data/recommendations";
import {
  verifyRecommendation,
} from "@/lib/recommendationVerification";
import type {
  RecommendationWriteDataSource,
} from "@/lib/recommendations/recommendationDataSource";
import {
  recommendationRepository,
} from "@/lib/recommendations/recommendationRepository";

export type PublishRecommendationsResult = {
  publishedRecords:
    RecommendationRecord[];
  publishedCount: number;
};

type RecommendationPublisherDependencies = {
  repository?:
    RecommendationWriteDataSource;
};

export class RecommendationPublisher {
  private readonly repository:
    RecommendationWriteDataSource;

  constructor({
    repository =
      recommendationRepository,
  }: RecommendationPublisherDependencies = {}) {
    this.repository =
      repository;
  }

  async publish(
    candidates:
      RecommendationSourceRecord[],
  ): Promise<PublishRecommendationsResult> {
    if (
      candidates.length === 0
    ) {
      return {
        publishedRecords: [],
        publishedCount: 0,
      };
    }

    const existingRecords =
      await this.repository.getAll();

    validateCandidateBatch(
      candidates,
      existingRecords,
    );

    const recordsToPublish =
      candidates.map(
        convertToRecommendationRecord,
      );

    const publishedRecords =
      await this.repository.saveMany(
        recordsToPublish,
      );

    return {
      publishedRecords,
      publishedCount:
        publishedRecords.length,
    };
  }
}

function validateCandidateBatch(
  candidates:
    RecommendationSourceRecord[],
  existingRecords:
    RecommendationRecord[],
): void {
  const candidateIds =
    new Set<string>();

  const candidatePublicationKeys =
    new Set<string>();

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

  for (
    const candidate
    of candidates
  ) {
    validateCandidate(
      candidate,
    );

    const normalizedId =
      normalizeIdentifier(
        candidate.id,
      );

    if (
      candidateIds.has(
        normalizedId,
      )
    ) {
      throw new Error(
        `Duplicate recommendation ID in publication batch: ${candidate.id}.`,
      );
    }

    if (
      existingIds.has(
        normalizedId,
      )
    ) {
      throw new Error(
        `Recommendation ID already exists: ${candidate.id}.`,
      );
    }

    candidateIds.add(
      normalizedId,
    );

    const publicationKey =
      createPublicationKey(
        candidate,
      );

    if (
      candidatePublicationKeys.has(
        publicationKey,
      )
    ) {
      throw new Error(
        `Duplicate recommendation publication in batch for ${candidate.symbol} on ${candidate.publishedAt}.`,
      );
    }

    if (
      existingPublicationKeys.has(
        publicationKey,
      )
    ) {
      throw new Error(
        `A recommendation already exists for ${candidate.symbol} on ${candidate.publishedAt}.`,
      );
    }

    candidatePublicationKeys.add(
      publicationKey,
    );
  }
}

function validateCandidate(
  candidate:
    RecommendationSourceRecord,
): void {
  validateRequiredText(
    candidate.id,
    "Recommendation ID",
  );

  validateRequiredText(
    candidate.asset,
    "Asset",
  );

  validateRequiredText(
    candidate.symbol,
    "Symbol",
  );

  validateIsoDate(
    candidate.publishedAt,
    "Publication date",
  );

  validateIsoDate(
    candidate.evaluationDate,
    "Evaluation date",
  );

  const publishedAt =
    parseIsoDate(
      candidate.publishedAt,
    );

  const evaluationDate =
    parseIsoDate(
      candidate.evaluationDate,
    );

  if (
    evaluationDate <=
    publishedAt
  ) {
    throw new Error(
      `Evaluation date must be later than publication date for ${candidate.id}.`,
    );
  }

  validatePositiveNumber(
    candidate.entryPrice,
    "Entry price",
  );

  if (
    candidate.evaluationPrice !==
    null
  ) {
    validatePositiveNumber(
      candidate.evaluationPrice,
      "Evaluation price",
    );
  }

  validatePercentage(
    candidate.targetReturn,
    "Target return",
  );

  validateScore(
    candidate.score,
    "Score",
  );

  validateScore(
    candidate.confidence,
    "Confidence",
  );
}

function convertToRecommendationRecord(
  sourceRecord:
    RecommendationSourceRecord,
): RecommendationRecord {
  const verification =
    verifyRecommendation({
      entryPrice:
        sourceRecord.entryPrice,
      evaluationPrice:
        sourceRecord.evaluationPrice,
      targetReturn:
        sourceRecord.targetReturn,
    });

  return {
    ...sourceRecord,
    ...verification,
  };
}

function createPublicationKey(
  record:
    RecommendationSourceRecord,
): string {
  return [
    record.category,
    normalizeIdentifier(
      record.symbol,
    ),
    record.publishedAt,
  ].join(":");
}

function normalizeIdentifier(
  value: string,
): string {
  return value
    .trim()
    .toUpperCase();
}

function validateRequiredText(
  value: string,
  fieldName: string,
): void {
  if (
    value.trim().length ===
    0
  ) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }
}

function validatePositiveNumber(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${fieldName} must be a positive finite number.`,
    );
  }
}

function validatePercentage(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 100
  ) {
    throw new Error(
      `${fieldName} must be greater than 0 and no more than 100.`,
    );
  }
}

function validateScore(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      `${fieldName} must be between 0 and 100.`,
    );
  }
}

function validateIsoDate(
  value: string,
  fieldName: string,
): void {
  const isoDatePattern =
    /^\d{4}-\d{2}-\d{2}$/;

  if (
    !isoDatePattern.test(
      value,
    )
  ) {
    throw new Error(
      `${fieldName} must use YYYY-MM-DD format.`,
    );
  }

  const parsedDate =
    parseIsoDate(
      value,
    );

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    throw new Error(
      `${fieldName} is invalid.`,
    );
  }

  const normalizedDate =
    parsedDate
      .toISOString()
      .slice(0, 10);

  if (
    normalizedDate !==
    value
  ) {
    throw new Error(
      `${fieldName} is invalid.`,
    );
  }
}

function parseIsoDate(
  value: string,
): Date {
  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

export const recommendationPublisher =
  new RecommendationPublisher();
