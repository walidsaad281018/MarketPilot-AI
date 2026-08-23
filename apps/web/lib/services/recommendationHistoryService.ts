import type {
  RecommendationCategory,
  RecommendationRecord,
} from "@/data/recommendations";
import type {
  RecommendationDataSource,
} from "@/lib/recommendations/recommendationDataSource";
import {
  recommendationQueryEngine,
} from "@/lib/recommendations/recommendationQueryEngine";
import type {
  RecommendationQueryFilters,
  RecommendationQueryOptions,
  RecommendationQueryResult,
} from "@/lib/recommendations/recommendationQueryEngine";
import {
  recommendationRepository,
} from "@/lib/recommendations/recommendationRepository";
import {
  calculateRecommendationPerformance,
} from "@/lib/services/recommendationPerformanceService";

export type RecommendationPerformanceSummary =
  ReturnType<
    typeof calculateRecommendationPerformance
  >;

export type RecommendationHistoryFilters =
  RecommendationQueryFilters;

export class RecommendationHistoryService {
  constructor(
    private readonly dataSource: RecommendationDataSource =
      recommendationRepository,
  ) {}

  async getAllRecommendations():
    Promise<RecommendationRecord[]> {
    return await this.dataSource.getAll();
  }

  async getRecommendation(
    recommendationId: string,
  ): Promise<RecommendationRecord | undefined> {
    return await this.dataSource.getById(
      decodeRecommendationId(
        recommendationId,
      ),
    );
  }

  async getRecommendationsBySymbol(
    symbol: string,
  ): Promise<RecommendationRecord[]> {
    return await this.dataSource.getBySymbol(
      symbol,
    );
  }

  async getRecommendationsByCategory(
    category: RecommendationCategory,
  ): Promise<RecommendationRecord[]> {
    return await this.dataSource.getByCategory(
      category,
    );
  }

  async getPendingRecommendations():
    Promise<RecommendationRecord[]> {
    return await this.dataSource.getPending();
  }

  async getSuccessfulRecommendations():
    Promise<RecommendationRecord[]> {
    return await this.dataSource.getSuccessful();
  }

  async getUnsuccessfulRecommendations():
    Promise<RecommendationRecord[]> {
    return await this.dataSource.getUnsuccessful();
  }

  async getSuccessRate():
    Promise<number> {
    return await this.dataSource.getSuccessRate();
  }

  async getFilteredRecommendations(
    filters: RecommendationHistoryFilters,
  ): Promise<RecommendationRecord[]> {
    const records =
      await this.dataSource.getAll();

    return recommendationQueryEngine.filter(
      records,
      filters,
    );
  }

  async queryRecommendations(
    options: RecommendationQueryOptions = {},
  ): Promise<RecommendationQueryResult> {
    const records =
      await this.dataSource.getAll();

    return recommendationQueryEngine.query(
      records,
      options,
    );
  }

  async getPerformanceSummary():
    Promise<RecommendationPerformanceSummary> {
    const records =
      await this.dataSource.getAll();

    return calculateRecommendationPerformance(
      records,
    );
  }
}

function decodeRecommendationId(
  recommendationId: string,
): string {
  try {
    return decodeURIComponent(
      recommendationId,
    );
  } catch {
    return recommendationId;
  }
}

export const recommendationHistoryService =
  new RecommendationHistoryService();
