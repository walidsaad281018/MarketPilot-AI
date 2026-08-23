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

  async getRecommendations(
    filters: RecommendationFilters = {},
  ): Promise<RecommendationRecord[]> {
    return await this.historyService
      .getFilteredRecommendations(
        filters,
      );
  }

  async queryRecommendations(
    options: RecommendationQuery = {},
  ): Promise<RecommendationQueryResult> {
    return await this.historyService
      .queryRecommendations(
        options,
      );
  }

  async getRecommendation(
    id: string,
  ): Promise<
    RecommendationRecord | undefined
  > {
    return await this.historyService
      .getRecommendation(
        id,
      );
  }
}
