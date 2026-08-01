import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  RecommendationRecord,
} from "@/data/recommendations";
import {
  RecommendationQueryEngine,
} from "@/lib/recommendations/recommendationQueryEngine";

const bitcoinRecommendation: RecommendationRecord = {
  id: "MP-QUERY-0001",
  asset: "Bitcoin",
  symbol: "BTC",
  category: "Crypto",
  publishedAt: "2026-07-01",
  evaluationDate: "2026-07-08",
  entryPrice: 61_200,
  evaluationPrice: 66_340.8,
  targetReturn: 6,
  score: 94,
  confidence: 91,
  targetPrice: 64_872,
  actualReturn: 8.4,
  status: "Successful",
  targetReached: true,
};

const chainlinkRecommendation: RecommendationRecord = {
  id: "MP-QUERY-0002",
  asset: "Chainlink",
  symbol: "LINK",
  category: "Crypto",
  publishedAt: "2026-07-15",
  evaluationDate: "2026-07-22",
  entryPrice: 13.4,
  evaluationPrice: null,
  targetReturn: 9,
  score: 87,
  confidence: 85,
  targetPrice: 14.606,
  actualReturn: null,
  status: "Pending",
  targetReached: null,
};

const stockRecommendation: RecommendationRecord = {
  id: "MP-QUERY-0003",
  asset: "Microsoft",
  symbol: "MSFT",
  category: "Stock",
  publishedAt: "2026-06-20",
  evaluationDate: "2026-06-27",
  entryPrice: 480,
  evaluationPrice: 470.4,
  targetReturn: 5,
  score: 82,
  confidence: 79,
  targetPrice: 504,
  actualReturn: -2,
  status: "Unsuccessful",
  targetReached: false,
};

const recommendations = [
  bitcoinRecommendation,
  chainlinkRecommendation,
  stockRecommendation,
];

describe(
  "RecommendationQueryEngine",
  () => {
    const queryEngine =
      new RecommendationQueryEngine();

    it(
      "returns every recommendation when filters are absent",
      () => {
        const result =
          queryEngine.filter(
            recommendations,
          );

        expect(result).toEqual(
          recommendations,
        );
      },
    );

    it(
      "filters by category",
      () => {
        const result =
          queryEngine.filter(
            recommendations,
            {
              category: "Stock",
            },
          );

        expect(result).toEqual([
          stockRecommendation,
        ]);
      },
    );

    it(
      "normalizes symbol whitespace and letter case",
      () => {
        const result =
          queryEngine.filter(
            recommendations,
            {
              symbol: " btc ",
            },
          );

        expect(result).toEqual([
          bitcoinRecommendation,
        ]);
      },
    );

    it(
      "filters by status",
      () => {
        const result =
          queryEngine.filter(
            recommendations,
            {
              status: "Pending",
            },
          );

        expect(result).toEqual([
          chainlinkRecommendation,
        ]);
      },
    );

    it(
      "filters by minimum score",
      () => {
        const result =
          queryEngine.filter(
            recommendations,
            {
              minScore: 90,
            },
          );

        expect(result).toEqual([
          bitcoinRecommendation,
        ]);
      },
    );

    it(
      "filters by minimum confidence",
      () => {
        const result =
          queryEngine.filter(
            recommendations,
            {
              minConfidence: 85,
            },
          );

        expect(result).toEqual([
          bitcoinRecommendation,
          chainlinkRecommendation,
        ]);
      },
    );

    it(
      "filters by inclusive publication dates",
      () => {
        const result =
          queryEngine.filter(
            recommendations,
            {
              publishedAfter:
                "2026-07-01",
              publishedBefore:
                "2026-07-15",
            },
          );

        expect(result).toEqual([
          bitcoinRecommendation,
          chainlinkRecommendation,
        ]);
      },
    );

    it(
      "combines all supported filters",
      () => {
        const result =
          queryEngine.filter(
            recommendations,
            {
              category: "Crypto",
              symbol: "LINK",
              status: "Pending",
              minScore: 80,
              minConfidence: 80,
              publishedAfter:
                "2026-07-01",
              publishedBefore:
                "2026-07-31",
            },
          );

        expect(result).toEqual([
          chainlinkRecommendation,
        ]);
      },
    );

    it(
      "sorts by score descending",
      () => {
        const result =
          queryEngine.query(
            recommendations,
            {
              sortBy: "score",
              sortOrder: "desc",
            },
          );

        expect(result.items).toEqual([
          bitcoinRecommendation,
          chainlinkRecommendation,
          stockRecommendation,
        ]);
      },
    );

    it(
      "sorts by confidence ascending",
      () => {
        const result =
          queryEngine.query(
            recommendations,
            {
              sortBy: "confidence",
              sortOrder: "asc",
            },
          );

        expect(result.items).toEqual([
          stockRecommendation,
          chainlinkRecommendation,
          bitcoinRecommendation,
        ]);
      },
    );

    it(
      "uses publication date descending by default",
      () => {
        const result =
          queryEngine.query(
            recommendations,
          );

        expect(result.items).toEqual([
          chainlinkRecommendation,
          bitcoinRecommendation,
          stockRecommendation,
        ]);
      },
    );

    it(
      "paginates the sorted results",
      () => {
        const result =
          queryEngine.query(
            recommendations,
            {
              sortBy: "score",
              sortOrder: "desc",
              page: 2,
              pageSize: 1,
            },
          );

        expect(result).toEqual({
          items: [
            chainlinkRecommendation,
          ],
          totalItems: 3,
          page: 2,
          pageSize: 1,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        });
      },
    );

    it(
      "returns empty pagination metadata when no records match",
      () => {
        const result =
          queryEngine.query(
            recommendations,
            {
              symbol: "UNKNOWN",
            },
          );

        expect(result).toEqual({
          items: [],
          totalItems: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      },
    );

    it(
      "does not modify the original collection",
      () => {
        const originalOrder = [
          ...recommendations,
        ];

        queryEngine.query(
          recommendations,
          {
            sortBy: "score",
          },
        );

        expect(recommendations).toEqual(
          originalOrder,
        );
      },
    );
  },
);
