import type {
  RecommendationRecord,
} from "@/data/recommendations";
import type {
  RecommendationQueryFilters,
  RecommendationQueryOptions,
  RecommendationQueryResult,
} from "@/lib/recommendations/recommendationQueryEngine";
import type {
  RecommendationHistoryService,
} from "@/lib/services/recommendationHistoryService";

export type RecommendationFilters =
  RecommendationQueryFilters;

export type RecommendationQuery =
  RecommendationQueryOptions;

export type RecommendationServiceDependencies = {
  historyService:
    RecommendationHistoryService;
};

export class RecommendationService {
  private readonly historyService:
    RecommendationHistoryService;

  constructor({
    historyService,
  }: RecommendationServiceDependencies) {
    this.historyService =
      historyService;
  }

  getRecommendations(
    filters: RecommendationFilters = {},
  ): RecommendationRecord[] {
    return this.historyService
      .getFilteredRecommendations(
        filters,
      );
  }

  queryRecommendations(
    options: RecommendationQuery = {},
  ): RecommendationQueryResult {
    return this.historyService
      .queryRecommendations(
        options,
      );
  }

  getRecommendation(
    id: string,
  ): RecommendationRecord | undefined {
    return this.historyService
      .getRecommendation(
        id,
      );
  }
}
