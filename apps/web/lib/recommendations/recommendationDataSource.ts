import type {
  RecommendationRecord,
} from "@/data/recommendations";
import type {
  Awaitable,
} from "@/lib/types/awaitable";

export type RecommendationCategory =
  RecommendationRecord["category"];

export interface RecommendationDataSource {
  getAll():
    Awaitable<RecommendationRecord[]>;

  getById(
    recommendationId: string,
  ):
    Awaitable<
      RecommendationRecord | undefined
    >;

  getBySymbol(
    symbol: string,
  ):
    Awaitable<RecommendationRecord[]>;

  getByCategory(
    category: RecommendationCategory,
  ):
    Awaitable<RecommendationRecord[]>;

  getPending():
    Awaitable<RecommendationRecord[]>;

  getSuccessful():
    Awaitable<RecommendationRecord[]>;

  getUnsuccessful():
    Awaitable<RecommendationRecord[]>;

  getSuccessRate():
    Awaitable<number>;
}

export interface RecommendationWriteDataSource
  extends RecommendationDataSource {
  save(
    recommendation:
      RecommendationRecord,
  ):
    Awaitable<RecommendationRecord>;

  saveMany(
    recommendations:
      RecommendationRecord[],
  ):
    Awaitable<RecommendationRecord[]>;

  update(
    recommendation:
      RecommendationRecord,
  ):
    Awaitable<RecommendationRecord>;

  updateMany(
    recommendations:
      RecommendationRecord[],
  ):
    Awaitable<RecommendationRecord[]>;
}
