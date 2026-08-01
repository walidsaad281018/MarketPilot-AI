import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  RecommendationRecord,
} from "@/data/recommendations";
import type {
  RecommendationDataSource,
} from "@/lib/recommendations/recommendationDataSource";
import {
  RecommendationHistoryService,
} from "@/lib/services/recommendationHistoryService";
import {
  calculateRecommendationPerformance,
} from "@/lib/services/recommendationPerformanceService";

const recommendationRecords: RecommendationRecord[] = [
  {
    id: "MP-TEST-0001",
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
  },
  {
    id: "MP-TEST-0002",
    asset: "NVIDIA",
    symbol: "NVDA",
    category: "Stock",
    publishedAt: "2026-07-02",
    evaluationDate: "2026-07-09",
    entryPrice: 153.8,
    evaluationPrice: 148.4,
    targetReturn: 5,
    score: 82,
    confidence: 80,
    targetPrice: 161.49,
    actualReturn: -3.51,
    status: "Unsuccessful",
    targetReached: false,
  },
  {
    id: "MP TEST 0003",
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
  },
  {
    id: "MP-TEST-0004",
    asset: "Ethereum",
    symbol: "ETH",
    category: "Crypto",
    publishedAt: "2026-07-03",
    evaluationDate: "2026-07-10",
    entryPrice: 1_790,
    evaluationPrice: 1_949.31,
    targetReturn: 7,
    score: 91,
    confidence: 88,
    targetPrice: 1_915.3,
    actualReturn: 8.9,
    status: "Successful",
    targetReached: true,
  },
];

function createDataSource(): RecommendationDataSource {
  return {
    getAll: vi.fn(
      () => recommendationRecords,
    ),

    getById: vi.fn(
      (recommendationId: string) =>
        recommendationRecords.find(
          (record) =>
            record.id === recommendationId,
        ),
    ),

    getBySymbol: vi.fn(
      (symbol: string) =>
        recommendationRecords.filter(
          (record) =>
            record.symbol === symbol,
        ),
    ),

    getByCategory: vi.fn(
      (category) =>
        recommendationRecords.filter(
          (record) =>
            record.category === category,
        ),
    ),

    getPending: vi.fn(
      () =>
        recommendationRecords.filter(
          (record) =>
            record.status === "Pending",
        ),
    ),

    getSuccessful: vi.fn(
      () =>
        recommendationRecords.filter(
          (record) =>
            record.status === "Successful",
        ),
    ),

    getUnsuccessful: vi.fn(
      () =>
        recommendationRecords.filter(
          (record) =>
            record.status === "Unsuccessful",
        ),
    ),

    getSuccessRate: vi.fn(
      () => 67,
    ),
  };
}

describe(
  "RecommendationHistoryService",
  () => {
    let dataSource: RecommendationDataSource;
    let service: RecommendationHistoryService;

    beforeEach(() => {
      dataSource = createDataSource();

      service =
        new RecommendationHistoryService(
          dataSource,
        );
    });

    it(
      "returns all recommendations from the data source",
      () => {
        const result =
          service.getAllRecommendations();

        expect(result).toEqual(
          recommendationRecords,
        );

        expect(
          dataSource.getAll,
        ).toHaveBeenCalledOnce();
      },
    );

    it(
      "returns a recommendation by ID",
      () => {
        const result =
          service.getRecommendation(
            "MP-TEST-0001",
          );

        expect(result).toEqual(
          recommendationRecords[0],
        );

        expect(
          dataSource.getById,
        ).toHaveBeenCalledWith(
          "MP-TEST-0001",
        );
      },
    );

    it(
      "decodes a URL-encoded recommendation ID",
      () => {
        const result =
          service.getRecommendation(
            "MP%20TEST%200003",
          );

        expect(result).toEqual(
          recommendationRecords[2],
        );

        expect(
          dataSource.getById,
        ).toHaveBeenCalledWith(
          "MP TEST 0003",
        );
      },
    );

    it(
      "preserves an invalid URL-encoded recommendation ID",
      () => {
        service.getRecommendation(
          "%E0%A4%A",
        );

        expect(
          dataSource.getById,
        ).toHaveBeenCalledWith(
          "%E0%A4%A",
        );
      },
    );

    it(
      "returns recommendations by symbol",
      () => {
        const result =
          service.getRecommendationsBySymbol(
            "BTC",
          );

        expect(result).toEqual([
          recommendationRecords[0],
        ]);

        expect(
          dataSource.getBySymbol,
        ).toHaveBeenCalledWith(
          "BTC",
        );
      },
    );

    it(
      "returns recommendations by category",
      () => {
        const result =
          service.getRecommendationsByCategory(
            "Crypto",
          );

        expect(result).toEqual([
          recommendationRecords[0],
          recommendationRecords[2],
          recommendationRecords[3],
        ]);

        expect(
          dataSource.getByCategory,
        ).toHaveBeenCalledWith(
          "Crypto",
        );
      },
    );

    it(
      "returns pending recommendations",
      () => {
        const result =
          service.getPendingRecommendations();

        expect(result).toEqual([
          recommendationRecords[2],
        ]);

        expect(
          dataSource.getPending,
        ).toHaveBeenCalledOnce();
      },
    );

    it(
      "returns successful recommendations",
      () => {
        const result =
          service.getSuccessfulRecommendations();

        expect(result).toEqual([
          recommendationRecords[0],
          recommendationRecords[3],
        ]);

        expect(
          dataSource.getSuccessful,
        ).toHaveBeenCalledOnce();
      },
    );

    it(
      "returns unsuccessful recommendations",
      () => {
        const result =
          service.getUnsuccessfulRecommendations();

        expect(result).toEqual([
          recommendationRecords[1],
        ]);

        expect(
          dataSource.getUnsuccessful,
        ).toHaveBeenCalledOnce();
      },
    );

    it(
      "returns the success rate from the data source",
      () => {
        const result =
          service.getSuccessRate();

        expect(result).toBe(67);

        expect(
          dataSource.getSuccessRate,
        ).toHaveBeenCalledOnce();
      },
    );

    it(
      "returns all records when no filters are provided",
      () => {
        const result =
          service.getFilteredRecommendations(
            {},
          );

        expect(result).toEqual(
          recommendationRecords,
        );
      },
    );

    it(
      "filters recommendations by category",
      () => {
        const result =
          service.getFilteredRecommendations({
            category: "Crypto",
          });

        expect(result).toEqual([
          recommendationRecords[0],
          recommendationRecords[2],
          recommendationRecords[3],
        ]);
      },
    );

    it(
      "filters recommendations by symbol case-insensitively",
      () => {
        const result =
          service.getFilteredRecommendations({
            symbol: " btc ",
          });

        expect(result).toEqual([
          recommendationRecords[0],
        ]);
      },
    );

    it(
      "filters recommendations by status",
      () => {
        const result =
          service.getFilteredRecommendations({
            status: "Successful",
          });

        expect(result).toEqual([
          recommendationRecords[0],
          recommendationRecords[3],
        ]);
      },
    );

    it(
      "combines category and status filters",
      () => {
        const result =
          service.getFilteredRecommendations({
            category: "Crypto",
            status: "Successful",
          });

        expect(result).toEqual([
          recommendationRecords[0],
          recommendationRecords[3],
        ]);
      },
    );

    it(
      "combines category, symbol, and status filters",
      () => {
        const result =
          service.getFilteredRecommendations({
            category: "Crypto",
            symbol: "ETH",
            status: "Successful",
          });

        expect(result).toEqual([
          recommendationRecords[3],
        ]);
      },
    );

    it(
      "returns an empty array when filters do not match",
      () => {
        const result =
          service.getFilteredRecommendations({
            category: "ETF",
            symbol: "BTC",
          });

        expect(result).toEqual([]);
      },
    );

    it(
      "calculates the performance summary from all records",
      () => {
        const result =
          service.getPerformanceSummary();

        expect(result).toEqual(
          calculateRecommendationPerformance(
            recommendationRecords,
          ),
        );

        expect(
          dataSource.getAll,
        ).toHaveBeenCalledOnce();
      },
    );
  },
);
