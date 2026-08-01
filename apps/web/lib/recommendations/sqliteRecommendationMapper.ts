import type {
  RecommendationCategory,
  RecommendationRecord,
  RecommendationStatus,
} from "@/data/recommendations";

export type SqliteRecommendationRow = {
  id: string;
  asset: string;
  symbol: string;
  category: string;
  published_at: string;
  evaluation_date: string;
  entry_price: number;
  evaluation_price: number | null;
  target_return: number;
  score: number;
  confidence: number;
  target_price: number;
  actual_return: number | null;
  status: string;
  target_reached: number | null;
};

export function toSqliteParameters(
  recommendation: RecommendationRecord,
): Record<string, string | number | null> {
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
    confidence:
      recommendation.confidence,
    targetPrice:
      recommendation.targetPrice,
    actualReturn:
      recommendation.actualReturn,
    status: recommendation.status,
    targetReached:
      booleanToSqlite(
        recommendation.targetReached,
      ),
  };
}

export function fromSqliteRow(
  row: SqliteRecommendationRow,
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
      row.entry_price,
    evaluationPrice:
      row.evaluation_price,
    targetReturn:
      row.target_return,
    score:
      row.score,
    confidence:
      row.confidence,
    targetPrice:
      row.target_price,
    actualReturn:
      row.actual_return,
    status:
      parseStatus(row.status),
    targetReached:
      sqliteToBoolean(
        row.target_reached,
      ),
  };
}

function booleanToSqlite(
  value: boolean | null,
): number | null {
  if (value === null) {
    return null;
  }

  return value ? 1 : 0;
}

function sqliteToBoolean(
  value: number | null,
): boolean | null {
  if (value === null) {
    return null;
  }

  return value === 1;
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
    `Invalid recommendation category stored in SQLite: ${value}.`,
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
    `Invalid recommendation status stored in SQLite: ${value}.`,
  );
}
