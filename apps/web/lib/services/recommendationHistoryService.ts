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

  getAllRecommendations(): RecommendationRecord[] {
    return this.dataSource.getAll();
  }

  getRecommendation(
    recommendationId: string,
  ): RecommendationRecord | undefined {
    return this.dataSource.getById(
      decodeRecommendationId(
        recommendationId,
      ),
    );
  }

  getRecommendationsBySymbol(
    symbol: string,
  ): RecommendationRecord[] {
    return this.dataSource.getBySymbol(
      symbol,
    );
  }

  getRecommendationsByCategory(
    category: RecommendationCategory,
  ): RecommendationRecord[] {
    return this.dataSource.getByCategory(
      category,
    );
  }

  getPendingRecommendations(): RecommendationRecord[] {
    return this.dataSource.getPending();
  }

  getSuccessfulRecommendations(): RecommendationRecord[] {
    return this.dataSource.getSuccessful();
  }

  getUnsuccessfulRecommendations(): RecommendationRecord[] {
    return this.dataSource.getUnsuccessful();
  }

  getSuccessRate(): number {
    return this.dataSource.getSuccessRate();
  }

  getFilteredRecommendations(
    filters: RecommendationHistoryFilters,
  ): RecommendationRecord[] {
    return recommendationQueryEngine.filter(
      this.dataSource.getAll(),
      filters,
    );
  }

  queryRecommendations(
    options: RecommendationQueryOptions = {},
  ): RecommendationQueryResult {
    return recommendationQueryEngine.query(
      this.dataSource.getAll(),
      options,
    );
  }

  getPerformanceSummary(): RecommendationPerformanceSummary {
    return calculateRecommendationPerformance(
      this.dataSource.getAll(),
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
