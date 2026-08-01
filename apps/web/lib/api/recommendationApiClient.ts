import type {
  RecommendationCategory,
  RecommendationRecord,
  RecommendationStatus,
} from "@/data/recommendations";
import type {
  RecommendationSortField,
  RecommendationSortOrder,
} from "@/lib/recommendations/recommendationQueryEngine";

export type RecommendationApiFilters = {
  category?: RecommendationCategory;
  symbol?: string;
  status?: RecommendationStatus;
  minScore?: number;
  minConfidence?: number;
  publishedAfter?: string;
  publishedBefore?: string;
  sortBy?: RecommendationSortField;
  sortOrder?: RecommendationSortOrder;
  page?: number;
  pageSize?: number;
};

export type RecommendationApiAppliedFilters = {
  category: RecommendationCategory | null;
  symbol: string | null;
  status: RecommendationStatus | null;
  minScore: number | null;
  minConfidence: number | null;
  publishedAfter: string | null;
  publishedBefore: string | null;
  sortBy: RecommendationSortField;
  sortOrder: RecommendationSortOrder;
};

export type RecommendationApiPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type RecommendationListApiResponse = {
  success: true;
  count: number;
  filters: RecommendationApiAppliedFilters;
  pagination: RecommendationApiPagination;
  data: RecommendationRecord[];
};

export type RecommendationDetailsApiResponse = {
  success: true;
  data: RecommendationRecord;
};

type RecommendationErrorApiResponse = {
  success: false;
  error: string;
};

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class RecommendationApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);

    this.name =
      "RecommendationApiError";
  }
}

export async function fetchRecommendations(
  filters: RecommendationApiFilters = {},
  fetchImplementation: FetchImplementation =
    fetch,
): Promise<RecommendationListApiResponse> {
  const query =
    buildRecommendationQuery(
      filters,
    );

  const response =
    await fetchImplementation(
      `/api/recommendations${query}`,
      createRequestOptions(),
    );

  return parseApiResponse<
    RecommendationListApiResponse
  >(response);
}

export async function fetchRecommendation(
  recommendationId: string,
  fetchImplementation: FetchImplementation =
    fetch,
): Promise<RecommendationDetailsApiResponse> {
  const encodedId =
    encodeURIComponent(
      recommendationId,
    );

  const response =
    await fetchImplementation(
      `/api/recommendations/${encodedId}`,
      createRequestOptions(),
    );

  return parseApiResponse<
    RecommendationDetailsApiResponse
  >(response);
}

function buildRecommendationQuery(
  filters: RecommendationApiFilters,
): string {
  const searchParams =
    new URLSearchParams();

  if (filters.category) {
    searchParams.set(
      "category",
      filters.category,
    );
  }

  const normalizedSymbol =
    filters.symbol
      ?.trim()
      .toUpperCase();

  if (normalizedSymbol) {
    searchParams.set(
      "symbol",
      normalizedSymbol,
    );
  }

  if (filters.status) {
    searchParams.set(
      "status",
      filters.status,
    );
  }

  if (
    filters.minScore !== undefined
  ) {
    searchParams.set(
      "minScore",
      filters.minScore.toString(),
    );
  }

  if (
    filters.minConfidence !== undefined
  ) {
    searchParams.set(
      "minConfidence",
      filters.minConfidence.toString(),
    );
  }

  const publishedAfter =
    filters.publishedAfter
      ?.trim();

  if (publishedAfter) {
    searchParams.set(
      "publishedAfter",
      publishedAfter,
    );
  }

  const publishedBefore =
    filters.publishedBefore
      ?.trim();

  if (publishedBefore) {
    searchParams.set(
      "publishedBefore",
      publishedBefore,
    );
  }

  if (filters.sortBy) {
    searchParams.set(
      "sortBy",
      filters.sortBy,
    );
  }

  if (filters.sortOrder) {
    searchParams.set(
      "sortOrder",
      filters.sortOrder,
    );
  }

  if (filters.page !== undefined) {
    searchParams.set(
      "page",
      filters.page.toString(),
    );
  }

  if (
    filters.pageSize !== undefined
  ) {
    searchParams.set(
      "pageSize",
      filters.pageSize.toString(),
    );
  }

  const query =
    searchParams.toString();

  return query
    ? `?${query}`
    : "";
}

function createRequestOptions(): RequestInit {
  return {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
}

async function parseApiResponse<
  TSuccess,
>(
  response: Response,
): Promise<TSuccess> {
  const body =
    (await response.json()) as
      | TSuccess
      | RecommendationErrorApiResponse;

  if (!response.ok) {
    const errorMessage =
      isErrorResponse(body)
        ? body.error
        : "Recommendation request failed";

    throw new RecommendationApiError(
      errorMessage,
      response.status,
    );
  }

  return body as TSuccess;
}

function isErrorResponse(
  response:
    | unknown
    | RecommendationErrorApiResponse,
): response is RecommendationErrorApiResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    response.success === false &&
    "error" in response &&
    typeof response.error === "string"
  );
}
