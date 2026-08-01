import { NextResponse } from "next/server";

import type {
  RecommendationCategory,
  RecommendationStatus,
} from "@/data/recommendations";
import type {
  RecommendationSortField,
  RecommendationSortOrder,
} from "@/lib/recommendations/recommendationQueryEngine";
import {
  recommendationService,
} from "@/lib/services/api/recommendationService";

const allowedCategories = [
  "Crypto",
  "Stock",
  "ETF",
] as const;

const allowedStatuses = [
  "Pending",
  "Successful",
  "Unsuccessful",
] as const;

const allowedSortFields = [
  "publishedAt",
  "score",
  "confidence",
] as const;

const allowedSortOrders = [
  "asc",
  "desc",
] as const;

const defaultPage = 1;
const defaultPageSize = 20;
const maximumPageSize = 100;

export async function GET(
  request: Request,
) {
  const { searchParams } =
    new URL(request.url);

  const categoryResult =
    parseCategory(
      searchParams.get("category"),
    );

  if (categoryResult.error) {
    return badRequest(
      categoryResult.error,
    );
  }

  const statusResult =
    parseStatus(
      searchParams.get("status"),
    );

  if (statusResult.error) {
    return badRequest(
      statusResult.error,
    );
  }

  const minScoreResult =
    parseOptionalNumber(
      searchParams.get("minScore"),
      "minScore",
      0,
      100,
    );

  if (minScoreResult.error) {
    return badRequest(
      minScoreResult.error,
    );
  }

  const minConfidenceResult =
    parseOptionalNumber(
      searchParams.get(
        "minConfidence",
      ),
      "minConfidence",
      0,
      100,
    );

  if (minConfidenceResult.error) {
    return badRequest(
      minConfidenceResult.error,
    );
  }

  const publishedAfterResult =
    parseOptionalDate(
      searchParams.get(
        "publishedAfter",
      ),
      "publishedAfter",
    );

  if (publishedAfterResult.error) {
    return badRequest(
      publishedAfterResult.error,
    );
  }

  const publishedBeforeResult =
    parseOptionalDate(
      searchParams.get(
        "publishedBefore",
      ),
      "publishedBefore",
    );

  if (publishedBeforeResult.error) {
    return badRequest(
      publishedBeforeResult.error,
    );
  }

  if (
    publishedAfterResult.value &&
    publishedBeforeResult.value &&
    publishedAfterResult.value >
      publishedBeforeResult.value
  ) {
    return badRequest(
      "publishedAfter cannot be later than publishedBefore",
    );
  }

  const sortByResult =
    parseSortBy(
      searchParams.get("sortBy"),
    );

  if (sortByResult.error) {
    return badRequest(
      sortByResult.error,
    );
  }

  const sortOrderResult =
    parseSortOrder(
      searchParams.get("sortOrder"),
    );

  if (sortOrderResult.error) {
    return badRequest(
      sortOrderResult.error,
    );
  }

  const pageResult =
    parsePositiveInteger(
      searchParams.get("page"),
      "page",
      defaultPage,
    );

  if (pageResult.error) {
    return badRequest(
      pageResult.error,
    );
  }

  const pageSizeResult =
    parsePositiveInteger(
      searchParams.get("pageSize"),
      "pageSize",
      defaultPageSize,
      maximumPageSize,
    );

  if (pageSizeResult.error) {
    return badRequest(
      pageSizeResult.error,
    );
  }

  const symbol =
    searchParams
      .get("symbol")
      ?.trim()
      .toUpperCase() ||
    undefined;

  const query = {
    category:
      categoryResult.value ??
      undefined,
    symbol,
    status:
      statusResult.value ??
      undefined,
    minScore:
      minScoreResult.value ??
      undefined,
    minConfidence:
      minConfidenceResult.value ??
      undefined,
    publishedAfter:
      publishedAfterResult.value ??
      undefined,
    publishedBefore:
      publishedBeforeResult.value ??
      undefined,
    sortBy:
      sortByResult.value,
    sortOrder:
      sortOrderResult.value,
    page:
      pageResult.value,
    pageSize:
      pageSizeResult.value,
  };

  const result =
    recommendationService.queryRecommendations(
      query,
    );

  return NextResponse.json({
    success: true,
    count: result.items.length,
    filters: {
      category:
        categoryResult.value,
      symbol:
        symbol ?? null,
      status:
        statusResult.value,
      minScore:
        minScoreResult.value,
      minConfidence:
        minConfidenceResult.value,
      publishedAfter:
        publishedAfterResult.value,
      publishedBefore:
        publishedBeforeResult.value,
      sortBy:
        sortByResult.value,
      sortOrder:
        sortOrderResult.value,
    },
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      totalItems:
        result.totalItems,
      totalPages:
        result.totalPages,
      hasNextPage:
        result.hasNextPage,
      hasPreviousPage:
        result.hasPreviousPage,
    },
    data: result.items,
  });
}

function parseCategory(
  value: string | null,
): {
  value: RecommendationCategory | null;
  error?: string;
} {
  if (!value) {
    return {
      value: null,
    };
  }

  const match =
    allowedCategories.find(
      (category) =>
        category.toLowerCase() ===
        value.toLowerCase(),
    );

  if (!match) {
    return {
      value: null,
      error:
        "Invalid category. Allowed values: Crypto, Stock, ETF",
    };
  }

  return {
    value: match,
  };
}

function parseStatus(
  value: string | null,
): {
  value: RecommendationStatus | null;
  error?: string;
} {
  if (!value) {
    return {
      value: null,
    };
  }

  const match =
    allowedStatuses.find(
      (status) =>
        status.toLowerCase() ===
        value.toLowerCase(),
    );

  if (!match) {
    return {
      value: null,
      error:
        "Invalid status. Allowed values: Pending, Successful, Unsuccessful",
    };
  }

  return {
    value: match,
  };
}

function parseSortBy(
  value: string | null,
): {
  value: RecommendationSortField;
  error?: string;
} {
  if (!value) {
    return {
      value: "publishedAt",
    };
  }

  const match =
    allowedSortFields.find(
      (field) =>
        field.toLowerCase() ===
        value.toLowerCase(),
    );

  if (!match) {
    return {
      value: "publishedAt",
      error:
        "Invalid sortBy. Allowed values: publishedAt, score, confidence",
    };
  }

  return {
    value: match,
  };
}

function parseSortOrder(
  value: string | null,
): {
  value: RecommendationSortOrder;
  error?: string;
} {
  if (!value) {
    return {
      value: "desc",
    };
  }

  const match =
    allowedSortOrders.find(
      (order) =>
        order.toLowerCase() ===
        value.toLowerCase(),
    );

  if (!match) {
    return {
      value: "desc",
      error:
        "Invalid sortOrder. Allowed values: asc, desc",
    };
  }

  return {
    value: match,
  };
}

function parseOptionalNumber(
  value: string | null,
  parameterName: string,
  minimum: number,
  maximum: number,
): {
  value: number | null;
  error?: string;
} {
  if (!value) {
    return {
      value: null,
    };
  }

  const parsedValue =
    Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < minimum ||
    parsedValue > maximum
  ) {
    return {
      value: null,
      error:
        `${parameterName} must be a number between ${minimum} and ${maximum}`,
    };
  }

  return {
    value: parsedValue,
  };
}

function parseOptionalDate(
  value: string | null,
  parameterName: string,
): {
  value: string | null;
  error?: string;
} {
  if (!value) {
    return {
      value: null,
    };
  }

  if (!isIsoDate(value)) {
    return {
      value: null,
      error:
        `${parameterName} must use the YYYY-MM-DD format`,
    };
  }

  return {
    value,
  };
}

function parsePositiveInteger(
  value: string | null,
  parameterName: string,
  fallback: number,
  maximum?: number,
): {
  value: number;
  error?: string;
} {
  if (!value) {
    return {
      value: fallback,
    };
  }

  const parsedValue =
    Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1 ||
    (
      maximum !== undefined &&
      parsedValue > maximum
    )
  ) {
    const maximumMessage =
      maximum === undefined
        ? ""
        : ` and no greater than ${maximum}`;

    return {
      value: fallback,
      error:
        `${parameterName} must be a positive integer${maximumMessage}`,
    };
  }

  return {
    value: parsedValue,
  };
}

function isIsoDate(
  value: string,
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return false;
  }

  const date =
    new Date(
      `${value}T00:00:00.000Z`,
    );

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) ===
      value
  );
}

function badRequest(
  error: string,
) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status: 400,
    },
  );
}
