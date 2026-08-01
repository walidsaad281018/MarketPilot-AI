import type {
  RecommendationCategory,
  RecommendationRecord,
  RecommendationStatus,
} from "@/data/recommendations";

export type RecommendationPerformanceMetrics = {
  total: number;
  verified: number;
  pending: number;
  successful: number;
  unsuccessful: number;
  successRate: number;
  averageReturn: number;
};

export type CategoryPerformance = {
  category: RecommendationCategory;
  total: number;
  verified: number;
  pending: number;
  successful: number;
  unsuccessful: number;
  successRate: number;
  averageReturn: number;
};

export type RecommendationPerformanceFilters = {
  category?:
    | RecommendationCategory
    | "All";
  status?:
    | RecommendationStatus
    | "All";
};

export function calculateRecommendationPerformance(
  records: RecommendationRecord[],
): RecommendationPerformanceMetrics {
  const successful = records.filter(
    (record) =>
      record.status === "Successful",
  );

  const unsuccessful = records.filter(
    (record) =>
      record.status === "Unsuccessful",
  );

  const pending = records.filter(
    (record) =>
      record.status === "Pending",
  );

  const verified = records.filter(
    (record) =>
      record.status !== "Pending",
  );

  const verifiedReturns = verified
    .map((record) => record.actualReturn)
    .filter(
      (value): value is number =>
        typeof value === "number",
    );

  return {
    total: records.length,
    verified: verified.length,
    pending: pending.length,
    successful: successful.length,
    unsuccessful: unsuccessful.length,
    successRate: calculateSuccessRate(
      successful.length,
      verified.length,
    ),
    averageReturn: calculateAverage(
      verifiedReturns,
    ),
  };
}

export function calculateCategoryPerformance(
  records: RecommendationRecord[],
  category: RecommendationCategory,
): CategoryPerformance {
  const categoryRecords = records.filter(
    (record) =>
      record.category === category,
  );

  return {
    category,
    ...calculateRecommendationPerformance(
      categoryRecords,
    ),
  };
}

export function calculateAllCategoryPerformance(
  records: RecommendationRecord[],
): CategoryPerformance[] {
  const categories: RecommendationCategory[] = [
    "Crypto",
    "Stock",
    "ETF",
  ];

  return categories.map((category) =>
    calculateCategoryPerformance(
      records,
      category,
    ),
  );
}

export function filterRecommendationRecords(
  records: RecommendationRecord[],
  filters: RecommendationPerformanceFilters,
): RecommendationRecord[] {
  const {
    category = "All",
    status = "All",
  } = filters;

  return records.filter((record) => {
    const matchesCategory =
      category === "All" ||
      record.category === category;

    const matchesStatus =
      status === "All" ||
      record.status === status;

    return matchesCategory && matchesStatus;
  });
}

export function sortRecommendationsByPublishedDate(
  records: RecommendationRecord[],
): RecommendationRecord[] {
  return [...records].sort(
    (firstRecord, secondRecord) =>
      parsePublishedDate(
        secondRecord.publishedAt,
      ) -
      parsePublishedDate(
        firstRecord.publishedAt,
      ),
  );
}

export function getFilteredRecommendationPerformance(
  records: RecommendationRecord[],
  filters: RecommendationPerformanceFilters,
): {
  records: RecommendationRecord[];
  metrics: RecommendationPerformanceMetrics;
} {
  const filteredRecords =
    filterRecommendationRecords(
      records,
      filters,
    );

  const sortedRecords =
    sortRecommendationsByPublishedDate(
      filteredRecords,
    );

  return {
    records: sortedRecords,
    metrics:
      calculateRecommendationPerformance(
        sortedRecords,
      ),
  };
}

function calculateSuccessRate(
  successful: number,
  verified: number,
): number {
  if (verified === 0) {
    return 0;
  }

  return (successful / verified) * 100;
}

function calculateAverage(
  values: number[],
): number {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce(
      (total, value) =>
        total + value,
      0,
    ) / values.length
  );
}

function parsePublishedDate(
  value: string,
): number {
  const parsedDate = new Date(
    `${value}T00:00:00Z`,
  ).getTime();

  return Number.isNaN(parsedDate)
    ? 0
    : parsedDate;
}