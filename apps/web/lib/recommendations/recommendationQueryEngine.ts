import type {
  RecommendationCategory,
  RecommendationRecord,
  RecommendationStatus,
} from "@/data/recommendations";

export type RecommendationSortField =
  | "publishedAt"
  | "score"
  | "confidence";

export type RecommendationSortOrder =
  | "asc"
  | "desc";

export type RecommendationQueryFilters = {
  category?: RecommendationCategory;
  symbol?: string;
  status?: RecommendationStatus;
  minScore?: number;
  minConfidence?: number;
  publishedAfter?: string;
  publishedBefore?: string;
};

export type RecommendationQueryOptions =
  RecommendationQueryFilters & {
    sortBy?: RecommendationSortField;
    sortOrder?: RecommendationSortOrder;
    page?: number;
    pageSize?: number;
  };

export type RecommendationQueryResult = {
  items: RecommendationRecord[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

const defaultPage = 1;
const defaultPageSize = 20;

const defaultSortBy:
  RecommendationSortField =
    "publishedAt";

const defaultSortOrder:
  RecommendationSortOrder =
    "desc";

export class RecommendationQueryEngine {
  filter(
    recommendations: RecommendationRecord[],
    filters: RecommendationQueryFilters = {},
  ): RecommendationRecord[] {
    const normalizedSymbol =
      normalizeSymbol(filters.symbol);

    return recommendations.filter(
      (recommendation) =>
        matchesCategory(
          recommendation,
          filters.category,
        ) &&
        matchesSymbol(
          recommendation,
          normalizedSymbol,
        ) &&
        matchesStatus(
          recommendation,
          filters.status,
        ) &&
        matchesMinimumScore(
          recommendation,
          filters.minScore,
        ) &&
        matchesMinimumConfidence(
          recommendation,
          filters.minConfidence,
        ) &&
        matchesPublishedAfter(
          recommendation,
          filters.publishedAfter,
        ) &&
        matchesPublishedBefore(
          recommendation,
          filters.publishedBefore,
        ),
    );
  }

  query(
    recommendations: RecommendationRecord[],
    options: RecommendationQueryOptions = {},
  ): RecommendationQueryResult {
    const filteredRecommendations =
      this.filter(
        recommendations,
        options,
      );

    const sortBy =
      options.sortBy ??
      defaultSortBy;

    const sortOrder =
      options.sortOrder ??
      defaultSortOrder;

    const sortedRecommendations =
      sortRecommendations(
        filteredRecommendations,
        sortBy,
        sortOrder,
      );

    const page =
      normalizePositiveInteger(
        options.page,
        defaultPage,
      );

    const pageSize =
      normalizePositiveInteger(
        options.pageSize,
        defaultPageSize,
      );

    const totalItems =
      sortedRecommendations.length;

    const totalPages =
      totalItems === 0
        ? 0
        : Math.ceil(
            totalItems / pageSize,
          );

    const startIndex =
      (page - 1) * pageSize;

    const items =
      sortedRecommendations.slice(
        startIndex,
        startIndex + pageSize,
      );

    return {
      items,
      totalItems,
      page,
      pageSize,
      totalPages,
      hasNextPage:
        page < totalPages,
      hasPreviousPage:
        page > 1 &&
        totalPages > 0,
    };
  }
}

function normalizeSymbol(
  symbol: string | undefined,
): string | undefined {
  const normalizedSymbol =
    symbol
      ?.trim()
      .toUpperCase();

  return normalizedSymbol ||
    undefined;
}

function normalizePositiveInteger(
  value: number | undefined,
  fallback: number,
): number {
  if (
    value === undefined ||
    !Number.isFinite(value) ||
    value < 1
  ) {
    return fallback;
  }

  return Math.floor(value);
}

function matchesCategory(
  recommendation: RecommendationRecord,
  category:
    | RecommendationCategory
    | undefined,
): boolean {
  return (
    !category ||
    recommendation.category === category
  );
}

function matchesSymbol(
  recommendation: RecommendationRecord,
  normalizedSymbol:
    | string
    | undefined,
): boolean {
  return (
    !normalizedSymbol ||
    recommendation.symbol.toUpperCase() ===
      normalizedSymbol
  );
}

function matchesStatus(
  recommendation: RecommendationRecord,
  status:
    | RecommendationStatus
    | undefined,
): boolean {
  return (
    !status ||
    recommendation.status === status
  );
}

function matchesMinimumScore(
  recommendation: RecommendationRecord,
  minScore: number | undefined,
): boolean {
  return (
    minScore === undefined ||
    recommendation.score >= minScore
  );
}

function matchesMinimumConfidence(
  recommendation: RecommendationRecord,
  minConfidence: number | undefined,
): boolean {
  return (
    minConfidence === undefined ||
    recommendation.confidence >=
      minConfidence
  );
}

function matchesPublishedAfter(
  recommendation: RecommendationRecord,
  publishedAfter: string | undefined,
): boolean {
  return (
    !publishedAfter ||
    recommendation.publishedAt >=
      publishedAfter
  );
}

function matchesPublishedBefore(
  recommendation: RecommendationRecord,
  publishedBefore: string | undefined,
): boolean {
  return (
    !publishedBefore ||
    recommendation.publishedAt <=
      publishedBefore
  );
}

function sortRecommendations(
  recommendations: RecommendationRecord[],
  sortBy: RecommendationSortField,
  sortOrder: RecommendationSortOrder,
): RecommendationRecord[] {
  const direction =
    sortOrder === "asc"
      ? 1
      : -1;

  return [...recommendations].sort(
    (left, right) => {
      const comparison =
        compareRecommendationValues(
          left,
          right,
          sortBy,
        );

      if (comparison !== 0) {
        return comparison * direction;
      }

      return left.id.localeCompare(
        right.id,
      );
    },
  );
}

function compareRecommendationValues(
  left: RecommendationRecord,
  right: RecommendationRecord,
  sortBy: RecommendationSortField,
): number {
  if (sortBy === "publishedAt") {
    return left.publishedAt.localeCompare(
      right.publishedAt,
    );
  }

  return left[sortBy] -
    right[sortBy];
}

export const recommendationQueryEngine =
  new RecommendationQueryEngine();
