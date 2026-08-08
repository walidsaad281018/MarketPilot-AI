import type {
  RecommendationRecord,
} from "@/data/recommendations";

export type RecommendationCategory =
  RecommendationRecord["category"];

export interface RecommendationDataSource {
  getAll(): RecommendationRecord[];

  getById(
    recommendationId: string,
  ): RecommendationRecord | undefined;

  getBySymbol(
    symbol: string,
  ): RecommendationRecord[];

  getByCategory(
    category: RecommendationCategory,
  ): RecommendationRecord[];

  getPending(): RecommendationRecord[];

  getSuccessful(): RecommendationRecord[];

  getUnsuccessful(): RecommendationRecord[];

  getSuccessRate(): number;
}

export interface RecommendationWriteDataSource
  extends RecommendationDataSource {
  save(
    recommendation: RecommendationRecord,
  ): RecommendationRecord;

  saveMany(
    recommendations: RecommendationRecord[],
  ): RecommendationRecord[];

  update(
    recommendation: RecommendationRecord,
  ): RecommendationRecord;

  updateMany(
    recommendations: RecommendationRecord[],
  ): RecommendationRecord[];
}
