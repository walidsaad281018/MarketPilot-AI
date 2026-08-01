import {
  describe,
  expect,
  it,
} from "vitest";
import {
  recommendationRecords,
  type RecommendationRecord,
} from "@/data/recommendations";
import {
  calculateAllCategoryPerformance,
  calculateCategoryPerformance,
  calculateRecommendationPerformance,
  filterRecommendationRecords,
  getFilteredRecommendationPerformance,
  sortRecommendationsByPublishedDate,
} from "@/lib/services/recommendationPerformanceService";

describe(
  "recommendationPerformanceService",
  () => {
    it(
      "calculates overall recommendation metrics",
      () => {
        const metrics =
          calculateRecommendationPerformance(
            recommendationRecords,
          );

        expect(metrics.total).toBe(8);
        expect(metrics.verified).toBe(6);
        expect(metrics.pending).toBe(2);
        expect(metrics.successful).toBe(4);
        expect(metrics.unsuccessful).toBe(2);

        expect(
          metrics.successRate,
        ).toBeCloseTo(
          66.6666666667,
          8,
        );

        expect(
          metrics.averageReturn,
        ).toBeCloseTo(
          3.7516666667,
          8,
        );
      },
    );

    it(
      "returns zero metrics for an empty collection",
      () => {
        const metrics =
          calculateRecommendationPerformance(
            [],
          );

        expect(metrics).toEqual({
          total: 0,
          verified: 0,
          pending: 0,
          successful: 0,
          unsuccessful: 0,
          successRate: 0,
          averageReturn: 0,
        });
      },
    );

    it(
      "does not include pending records in verified metrics",
      () => {
        const pendingRecords =
          recommendationRecords.filter(
            (record) =>
              record.status === "Pending",
          );

        const metrics =
          calculateRecommendationPerformance(
            pendingRecords,
          );

        expect(metrics.total).toBe(2);
        expect(metrics.pending).toBe(2);
        expect(metrics.verified).toBe(0);
        expect(metrics.successRate).toBe(0);
        expect(metrics.averageReturn).toBe(0);
      },
    );

    it(
      "calculates performance for one category",
      () => {
        const cryptoPerformance =
          calculateCategoryPerformance(
            recommendationRecords,
            "Crypto",
          );

        expect(
          cryptoPerformance.category,
        ).toBe("Crypto");

        expect(
          cryptoPerformance.total,
        ).toBe(4);

        expect(
          cryptoPerformance.verified,
        ).toBe(3);

        expect(
          cryptoPerformance.pending,
        ).toBe(1);

        expect(
          cryptoPerformance.successful,
        ).toBe(2);

        expect(
          cryptoPerformance.unsuccessful,
        ).toBe(1);

        expect(
          cryptoPerformance.successRate,
        ).toBeCloseTo(
          66.6666666667,
          8,
        );
      },
    );

    it(
      "calculates all category summaries in display order",
      () => {
        const summaries =
          calculateAllCategoryPerformance(
            recommendationRecords,
          );

        expect(
          summaries.map(
            (summary) =>
              summary.category,
          ),
        ).toEqual([
          "Crypto",
          "Stock",
          "ETF",
        ]);

        expect(
          summaries[0]?.successRate,
        ).toBeCloseTo(
          66.6666666667,
          8,
        );

        expect(
          summaries[1]?.successRate,
        ).toBe(50);

        expect(
          summaries[2]?.successRate,
        ).toBe(100);
      },
    );

    it(
      "filters records by category",
      () => {
        const records =
          filterRecommendationRecords(
            recommendationRecords,
            {
              category: "Stock",
            },
          );

        expect(records).toHaveLength(2);

        expect(
          records.every(
            (record) =>
              record.category ===
              "Stock",
          ),
        ).toBe(true);
      },
    );

    it(
      "filters records by status",
      () => {
        const records =
          filterRecommendationRecords(
            recommendationRecords,
            {
              status: "Successful",
            },
          );

        expect(records).toHaveLength(4);

        expect(
          records.every(
            (record) =>
              record.status ===
              "Successful",
          ),
        ).toBe(true);
      },
    );

    it(
      "combines category and status filters",
      () => {
        const records =
          filterRecommendationRecords(
            recommendationRecords,
            {
              category: "Crypto",
              status:
                "Successful",
            },
          );

        expect(
          records.map(
            (record) =>
              record.symbol,
          ),
        ).toEqual([
          "BTC",
          "ETH",
        ]);
      },
    );

    it(
      "returns all records when filters are All",
      () => {
        const records =
          filterRecommendationRecords(
            recommendationRecords,
            {
              category: "All",
              status: "All",
            },
          );

        expect(records).toEqual(
          recommendationRecords,
        );
      },
    );

    it(
      "sorts records by publication date newest first without mutating input",
      () => {
        const input =
          recommendationRecords.slice(
            0,
            3,
          );

        const originalOrder =
          input.map(
            (record) => record.id,
          );

        const sorted =
          sortRecommendationsByPublishedDate(
            input,
          );

        expect(
          sorted.map(
            (record) => record.id,
          ),
        ).toEqual([
          "MP-DEMO-0003",
          "MP-DEMO-0002",
          "MP-DEMO-0001",
        ]);

        expect(
          input.map(
            (record) => record.id,
          ),
        ).toEqual(originalOrder);

        expect(sorted).not.toBe(input);
      },
    );

    it(
      "combines filtering, sorting and metrics",
      () => {
        const result =
          getFilteredRecommendationPerformance(
            recommendationRecords,
            {
              category: "ETF",
              status: "All",
            },
          );

        expect(
          result.records.map(
            (record) => record.id,
          ),
        ).toEqual([
          "MP-DEMO-0008",
          "MP-DEMO-0004",
        ]);

        expect(
          result.metrics.total,
        ).toBe(2);

        expect(
          result.metrics.verified,
        ).toBe(1);

        expect(
          result.metrics.pending,
        ).toBe(1);

        expect(
          result.metrics.successful,
        ).toBe(1);

        expect(
          result.metrics.unsuccessful,
        ).toBe(0);

        expect(
          result.metrics.successRate,
        ).toBe(100);

        expect(
          result.metrics.averageReturn,
        ).toBeCloseTo(
          3.8,
          8,
        );
      },
    );

    it(
      "handles invalid publication dates consistently",
      () => {
        const invalidDateRecord:
          RecommendationRecord = {
          ...recommendationRecords[0],
          id: "MP-TEST-INVALID",
          publishedAt:
            "invalid-date",
        };

        const records =
          sortRecommendationsByPublishedDate(
            [
              invalidDateRecord,
              recommendationRecords[1],
            ],
          );

        expect(records[0]?.id).toBe(
          "MP-DEMO-0002",
        );

        expect(records[1]?.id).toBe(
          "MP-TEST-INVALID",
        );
      },
    );
  },
);