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
import {
  fetchRecommendation,
  fetchRecommendations,
  RecommendationApiError,
} from "@/lib/api/recommendationApiClient";

const recommendation: RecommendationRecord = {
  id: "MP-CLIENT-0001",
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

const listApiResponse = {
  success: true as const,
  count: 1,
  filters: {
    category: null,
    symbol: null,
    status: null,
    minScore: null,
    minConfidence: null,
    publishedAfter: null,
    publishedBefore: null,
    sortBy: "publishedAt" as const,
    sortOrder: "desc" as const,
  },
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  data: [recommendation],
};

describe(
  "recommendationApiClient",
  () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
      fetchMock.mockReset();
    });

    it(
      "requests recommendations without query parameters",
      async () => {
        fetchMock.mockResolvedValue(
          createJsonResponse(
            listApiResponse,
          ),
        );

        await fetchRecommendations(
          {},
          fetchMock,
        );

        expect(fetchMock)
          .toHaveBeenCalledWith(
            "/api/recommendations",
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
            },
          );
      },
    );

    it(
      "builds the original recommendation filters",
      async () => {
        fetchMock.mockResolvedValue(
          createJsonResponse(
            listApiResponse,
          ),
        );

        await fetchRecommendations(
          {
            category: "Crypto",
            symbol: " btc ",
            status: "Successful",
          },
          fetchMock,
        );

        expect(fetchMock)
          .toHaveBeenCalledWith(
            "/api/recommendations?category=Crypto&symbol=BTC&status=Successful",
            expect.any(Object),
          );
      },
    );

    it(
      "builds all advanced query parameters",
      async () => {
        fetchMock.mockResolvedValue(
          createJsonResponse(
            listApiResponse,
          ),
        );

        await fetchRecommendations(
          {
            category: "Crypto",
            symbol: " link ",
            status: "Pending",
            minScore: 80,
            minConfidence: 75,
            publishedAfter:
              "2026-01-01",
            publishedBefore:
              "2026-12-31",
            sortBy: "score",
            sortOrder: "desc",
            page: 2,
            pageSize: 10,
          },
          fetchMock,
        );

        expect(fetchMock)
          .toHaveBeenCalledWith(
            "/api/recommendations?category=Crypto&symbol=LINK&status=Pending&minScore=80&minConfidence=75&publishedAfter=2026-01-01&publishedBefore=2026-12-31&sortBy=score&sortOrder=desc&page=2&pageSize=10",
            expect.any(Object),
          );
      },
    );

    it(
      "includes zero score and confidence values",
      async () => {
        fetchMock.mockResolvedValue(
          createJsonResponse(
            listApiResponse,
          ),
        );

        await fetchRecommendations(
          {
            minScore: 0,
            minConfidence: 0,
          },
          fetchMock,
        );

        expect(fetchMock)
          .toHaveBeenCalledWith(
            "/api/recommendations?minScore=0&minConfidence=0",
            expect.any(Object),
          );
      },
    );

    it(
      "omits empty symbol and date values",
      async () => {
        fetchMock.mockResolvedValue(
          createJsonResponse(
            listApiResponse,
          ),
        );

        await fetchRecommendations(
          {
            symbol: "   ",
            publishedAfter: "   ",
            publishedBefore: "",
          },
          fetchMock,
        );

        expect(fetchMock)
          .toHaveBeenCalledWith(
            "/api/recommendations",
            expect.any(Object),
          );
      },
    );

    it(
      "returns typed filters and pagination metadata",
      async () => {
        const advancedResponse = {
          success: true as const,
          count: 1,
          filters: {
            category:
              "Crypto" as const,
            symbol: "BTC",
            status:
              "Successful" as const,
            minScore: 90,
            minConfidence: 85,
            publishedAfter:
              "2026-01-01",
            publishedBefore:
              "2026-12-31",
            sortBy: "score" as const,
            sortOrder: "desc" as const,
          },
          pagination: {
            page: 1,
            pageSize: 20,
            totalItems: 24,
            totalPages: 2,
            hasNextPage: true,
            hasPreviousPage: false,
          },
          data: [recommendation],
        };

        fetchMock.mockResolvedValue(
          createJsonResponse(
            advancedResponse,
          ),
        );

        const result =
          await fetchRecommendations(
            {},
            fetchMock,
          );

        expect(result).toEqual(
          advancedResponse,
        );

        expect(
          result.pagination.totalItems,
        ).toBe(24);

        expect(
          result.filters.sortBy,
        ).toBe("score");
      },
    );

    it(
      "throws a typed error for an invalid list query",
      async () => {
        fetchMock.mockResolvedValue(
          createJsonResponse(
            {
              success: false,
              error:
                "pageSize must be a positive integer and no greater than 100",
            },
            400,
          ),
        );

        const request =
          fetchRecommendations(
            {
              pageSize: 101,
            },
            fetchMock,
          );

        await expect(request)
          .rejects.toMatchObject({
            name:
              "RecommendationApiError",
            message:
              "pageSize must be a positive integer and no greater than 100",
            status: 400,
          });
      },
    );

    it(
      "encodes the recommendation ID",
      async () => {
        fetchMock.mockResolvedValue(
          createJsonResponse({
            success: true,
            data: recommendation,
          }),
        );

        await fetchRecommendation(
          "MP TEST 0001",
          fetchMock,
        );

        expect(fetchMock)
          .toHaveBeenCalledWith(
            "/api/recommendations/MP%20TEST%200001",
            expect.any(Object),
          );
      },
    );

    it(
      "returns the recommendation details response",
      async () => {
        const apiResponse = {
          success: true as const,
          data: recommendation,
        };

        fetchMock.mockResolvedValue(
          createJsonResponse(
            apiResponse,
          ),
        );

        const result =
          await fetchRecommendation(
            recommendation.id,
            fetchMock,
          );

        expect(result).toEqual(
          apiResponse,
        );
      },
    );

    it(
      "throws RecommendationApiError for a missing recommendation",
      async () => {
        fetchMock.mockResolvedValue(
          createJsonResponse(
            {
              success: false,
              error:
                "Recommendation not found",
            },
            404,
          ),
        );

        const request =
          fetchRecommendation(
            "DOES-NOT-EXIST",
            fetchMock,
          );

        await expect(request)
          .rejects.toBeInstanceOf(
            RecommendationApiError,
          );

        await expect(request)
          .rejects.toMatchObject({
            message:
              "Recommendation not found",
            status: 404,
          });
      },
    );
  },
);

function createJsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
      },
    },
  );
}
