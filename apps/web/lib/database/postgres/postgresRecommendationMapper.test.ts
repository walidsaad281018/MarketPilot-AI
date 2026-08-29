import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  RecommendationRecord,
} from "@/data/recommendations";
import {
  fromPostgresRow,
  toPostgresParameters,
} from "@/lib/database/postgres/postgresRecommendationMapper";

function createRecommendation():
  RecommendationRecord {
  return {
    id: "MP-POSTGRES-0001",
    asset: "Bitcoin",
    symbol: "BTC",
    category: "Crypto",
    publishedAt: "2026-08-01",
    evaluationDate: "2026-08-08",
    entryPrice: 100,
    evaluationPrice: null,
    targetReturn: 5,
    score: 90,
    confidence: 88,
    targetPrice: 105,
    actualReturn: null,
    status: "Pending",
    targetReached: null,
  };
}

describe(
  "postgresRecommendationMapper",
  () => {
    it(
      "maps a recommendation to PostgreSQL parameters",
      () => {
        const recommendation =
          createRecommendation();

        expect(
          toPostgresParameters(
            recommendation,
          ),
        ).toEqual({
          id: "MP-POSTGRES-0001",
          asset: "Bitcoin",
          symbol: "BTC",
          category: "Crypto",
          publishedAt: "2026-08-01",
          evaluationDate: "2026-08-08",
          entryPrice: 100,
          evaluationPrice: null,
          targetReturn: 5,
          score: 90,
          confidence: 88,
          targetPrice: 105,
          actualReturn: null,
          status: "Pending",
          targetReached: null,
        });
      },
    );

    it(
      "maps a PostgreSQL row to a recommendation",
      () => {
        expect(
          fromPostgresRow({
            id: "MP-POSTGRES-0001",
            asset: "Bitcoin",
            symbol: "BTC",
            category: "Crypto",
            published_at:
              "2026-08-01",
            evaluation_date:
              "2026-08-08",
            entry_price: "100",
            evaluation_price: "110",
            target_return: "5",
            score: "90",
            confidence: "88",
            target_price: "105",
            actual_return: "10",
            status: "Successful",
            target_reached: true,
          }),
        ).toEqual({
          ...createRecommendation(),
          evaluationPrice: 110,
          actualReturn: 10,
          status: "Successful",
          targetReached: true,
        });
      },
    );

    it(
      "preserves nullable PostgreSQL values",
      () => {
        const recommendation =
          createRecommendation();

        expect(
          fromPostgresRow({
            id: recommendation.id,
            asset: recommendation.asset,
            symbol: recommendation.symbol,
            category:
              recommendation.category,
            published_at:
              recommendation.publishedAt,
            evaluation_date:
              recommendation.evaluationDate,
            entry_price: 100,
            evaluation_price: null,
            target_return: 5,
            score: 90,
            confidence: 88,
            target_price: 105,
            actual_return: null,
            status: "Pending",
            target_reached: null,
          }),
        ).toEqual(
          recommendation,
        );
      },
    );

    it(
      "rejects an invalid stored category",
      () => {
        expect(() =>
          fromPostgresRow({
            id: "1",
            asset: "Test",
            symbol: "TEST",
            category: "Invalid",
            published_at:
              "2026-08-01",
            evaluation_date:
              "2026-08-08",
            entry_price: 100,
            evaluation_price: null,
            target_return: 5,
            score: 90,
            confidence: 88,
            target_price: 105,
            actual_return: null,
            status: "Pending",
            target_reached: null,
          }),
        ).toThrow(
          "Invalid recommendation category stored in PostgreSQL",
        );
      },
    );
  },
);
