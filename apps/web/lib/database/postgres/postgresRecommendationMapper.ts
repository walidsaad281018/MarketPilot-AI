import type {
  RecommendationCategory,
  RecommendationRecord,
  RecommendationStatus,
} from "@/data/recommendations";

export type PostgresRecommendationRow = {
  id: string;
  asset: string;
  symbol: string;
  category: string;
  published_at: string;
  evaluation_date: string;
  entry_price: number | string;
  evaluation_price: number | string | null;
  target_return: number | string;
  score: number | string;
  confidence: number | string;
  target_price: number | string;
  actual_return: number | string | null;
  status: string;
  target_reached: boolean | null;
};

export type PostgresRecommendationParameters = {
  id: string;
  asset: string;
  symbol: string;
  category: RecommendationCategory;
  publishedAt: string;
  evaluationDate: string;
  entryPrice: number;
  evaluationPrice: number | null;
  targetReturn: number;
  score: number;
  confidence: number;
  targetPrice: number;
  actualReturn: number | null;
  status: RecommendationStatus;
  targetReached: boolean | null;
};

export function toPostgresParameters(
  recommendation: RecommendationRecord,
): PostgresRecommendationParameters {
  return {
    id: recommendation.id,
    asset: recommendation.asset,
    symbol: recommendation.symbol,
    category: recommendation.category,
    publishedAt: recommendation.publishedAt,
    evaluationDate:
      recommendation.evaluationDate,
    entryPrice: recommendation.entryPrice,
    evaluationPrice:
      recommendation.evaluationPrice,
    targetReturn:
      recommendation.targetReturn,
    score: recommendation.score,
    confidence: recommendation.confidence,
    targetPrice:
      recommendation.targetPrice,
    actualReturn:
      recommendation.actualReturn,
    status: recommendation.status,
    targetReached:
      recommendation.targetReached,
  };
}

export function fromPostgresRow(
  row: PostgresRecommendationRow,
): RecommendationRecord {
  return {
    id: row.id,
    asset: row.asset,
    symbol: row.symbol,
    category:
      parseCategory(row.category),
    publishedAt:
      row.published_at,
    evaluationDate:
      row.evaluation_date,
    entryPrice:
      Number(row.entry_price),
    evaluationPrice:
      nullableNumber(
        row.evaluation_price,
      ),
    targetReturn:
      Number(row.target_return),
    score:
      Number(row.score),
    confidence:
      Number(row.confidence),
    targetPrice:
      Number(row.target_price),
    actualReturn:
      nullableNumber(
        row.actual_return,
      ),
    status:
      parseStatus(row.status),
    targetReached:
      row.target_reached,
  };
}

function nullableNumber(
  value: number | string | null,
): number | null {
  return value === null
    ? null
    : Number(value);
}

function parseCategory(
  value: string,
): RecommendationCategory {
  if (
    value === "Crypto" ||
    value === "Stock" ||
    value === "ETF"
  ) {
    return value;
  }

  throw new Error(
    `Invalid recommendation category stored in PostgreSQL: ${value}.`,
  );
}

function parseStatus(
  value: string,
): RecommendationStatus {
  if (
    value === "Pending" ||
    value === "Successful" ||
    value === "Unsuccessful"
  ) {
    return value;
  }

  throw new Error(
    `Invalid recommendation status stored in PostgreSQL: ${value}.`,
  );
}
