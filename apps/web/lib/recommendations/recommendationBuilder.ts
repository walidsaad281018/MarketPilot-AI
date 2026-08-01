import type { Opportunity } from "@/data/opportunities";
import type {
  RecommendationCategory,
  RecommendationSourceRecord,
} from "@/data/recommendations";

export type BuildRecommendationInput = {
  opportunity: Opportunity;
  entryPrice: number;
  publishedAt?: string;
  evaluationDays?: number;
  targetReturn?: number;
  recommendationId?: string;
};

const DEFAULT_EVALUATION_DAYS = 7;

export function buildRecommendation({
  opportunity,
  entryPrice,
  publishedAt = getCurrentDate(),
  evaluationDays = DEFAULT_EVALUATION_DAYS,
  targetReturn,
  recommendationId,
}: BuildRecommendationInput): RecommendationSourceRecord {
  validatePositiveNumber(
    entryPrice,
    "Entry price",
  );

  validatePositiveInteger(
    evaluationDays,
    "Evaluation days",
  );

  const normalizedPublishedAt =
    normalizeDate(publishedAt);

  const resolvedTargetReturn =
    targetReturn ??
    parseExpectedReturn(
      opportunity.expectedReturn,
    );

  validatePositiveNumber(
    resolvedTargetReturn,
    "Target return",
  );

  const category =
    normalizeCategory(
      opportunity.category,
    );

  return {
    id:
      recommendationId ??
      createRecommendationId(
        opportunity.symbol,
        normalizedPublishedAt,
      ),
    asset: opportunity.asset,
    symbol:
      opportunity.symbol
        .trim()
        .toUpperCase(),
    category,
    publishedAt:
      normalizedPublishedAt,
    evaluationDate: addDays(
      normalizedPublishedAt,
      evaluationDays,
    ),
    entryPrice:
      roundNumber(entryPrice),
    evaluationPrice: null,
    targetReturn:
      roundNumber(
        resolvedTargetReturn,
      ),
    score:
      clampPercentage(
        opportunity.score,
      ),
    confidence:
      clampPercentage(
        opportunity.confidence,
      ),
  };
}

export function createRecommendationId(
  symbol: string,
  publishedAt = getCurrentDate(),
): string {
  const normalizedSymbol =
    symbol
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9]/g,
        "",
      );

  if (!normalizedSymbol) {
    throw new Error(
      "Recommendation symbol is required.",
    );
  }

  const normalizedDate =
    normalizeDate(publishedAt)
      .replaceAll("-", "");

  const uniquePart =
    crypto
      .randomUUID()
      .split("-")[0]
      .toUpperCase();

  return [
    "MP",
    normalizedDate,
    normalizedSymbol,
    uniquePart,
  ].join("-");
}

function parseExpectedReturn(
  expectedReturn: string,
): number {
  const normalizedValue =
    expectedReturn
      .replace("%", "")
      .replace("+", "")
      .trim();

  const parsedValue =
    Number(normalizedValue);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new Error(
      `Unable to extract a positive target return from "${expectedReturn}".`,
    );
  }

  return parsedValue;
}

function normalizeCategory(
  category: Opportunity["category"],
): RecommendationCategory {
  if (
    category === "Crypto" ||
    category === "Stock" ||
    category === "ETF"
  ) {
    return category;
  }

  throw new Error(
    `Unsupported recommendation category: ${category}.`,
  );
}

function normalizeDate(
  value: string,
): string {
  const dateOnlyPattern =
    /^\d{4}-\d{2}-\d{2}$/;

  if (!dateOnlyPattern.test(value)) {
    throw new Error(
      "Date values must use the YYYY-MM-DD format.",
    );
  }

  const parsedDate =
    new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    ) ||
    formatDate(parsedDate) !== value
  ) {
    throw new Error(
      `Invalid date value: ${value}.`,
    );
  }

  return value;
}

function addDays(
  dateValue: string,
  days: number,
): string {
  const date =
    new Date(
      `${dateValue}T00:00:00.000Z`,
    );

  date.setUTCDate(
    date.getUTCDate() + days,
  );

  return formatDate(date);
}

function getCurrentDate(): string {
  return formatDate(
    new Date(),
  );
}

function formatDate(
  date: Date,
): string {
  return date
    .toISOString()
    .slice(0, 10);
}

function validatePositiveNumber(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${fieldName} must be a positive number.`,
    );
  }
}

function validatePositiveInteger(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `${fieldName} must be a positive integer.`,
    );
  }
}

function clampPercentage(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    throw new Error(
      "Score and confidence values must be finite numbers.",
    );
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value),
    ),
  );
}

function roundNumber(
  value: number,
  decimalPlaces = 2,
): number {
  const multiplier =
    10 ** decimalPlaces;

  return (
    Math.round(
      (value + Number.EPSILON) *
        multiplier,
    ) / multiplier
  );
}