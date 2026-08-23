import {
  recommendationRecords,
  type RecommendationRecord,
} from "@/data/recommendations";
import type {
  RecommendationWriteDataSource,
} from "@/lib/recommendations/recommendationDataSource";

export type SeedRecommendationsResult = {
  seeded: boolean;
  seededCount: number;
  seededRecords:
    RecommendationRecord[];
};

export type RecommendationSeedServiceDependencies = {
  repository:
    RecommendationWriteDataSource;
  seedRecords?:
    RecommendationRecord[];
};

export class RecommendationSeedService {
  private readonly repository:
    RecommendationWriteDataSource;

  private readonly seedRecords:
    RecommendationRecord[];

  constructor({
    repository,
    seedRecords =
      recommendationRecords,
  }: RecommendationSeedServiceDependencies) {
    this.repository =
      repository;

    this.seedRecords =
      seedRecords.map(
        cloneRecommendation,
      );
  }

  async seedIfEmpty():
    Promise<SeedRecommendationsResult> {
    const existingRecords =
      await this.repository.getAll();

    if (
      existingRecords.length > 0
    ) {
      return {
        seeded: false,
        seededCount: 0,
        seededRecords: [],
      };
    }

    if (
      this.seedRecords.length ===
      0
    ) {
      return {
        seeded: false,
        seededCount: 0,
        seededRecords: [],
      };
    }

    const seededRecords =
      await this.repository.saveMany(
        this.seedRecords,
      );

    return {
      seeded: true,
      seededCount:
        seededRecords.length,
      seededRecords:
        seededRecords.map(
          cloneRecommendation,
        ),
    };
  }
}

function cloneRecommendation(
  recommendation:
    RecommendationRecord,
): RecommendationRecord {
  return {
    ...recommendation,
  };
}
