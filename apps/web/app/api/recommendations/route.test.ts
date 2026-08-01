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

const {
  queryRecommendationsMock,
} = vi.hoisted(() => ({
  queryRecommendationsMock:
    vi.fn(),
}));

vi.mock(
  "@/lib/services/api/recommendationService",
  () => ({
    recommendationService: {
      queryRecommendations:
        queryRecommendationsMock,
    },
  }),
);

import {
  GET,
} from "@/app/api/recommendations/route";

const recommendation: RecommendationRecord = {
  id: "MP-TEST-API-0001",
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

const queryResult = {
  items: [recommendation],
  totalItems: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

describe(
  "GET /api/recommendations",
  () => {
    beforeEach(() => {
      queryRecommendationsMock
        .mockReset()
        .mockReturnValue(
          queryResult,
        );
    });

    it(
      "uses default query options",
      async () => {
        const response = await GET(
          createRequest(),
        );

        const body =
          await response.json();

        expect(response.status).toBe(
          200,
        );

        expect(
          queryRecommendationsMock,
        ).toHaveBeenCalledWith({
          category: undefined,
          symbol: undefined,
          status: undefined,
          minScore: undefined,
          minConfidence: undefined,
          publishedAfter: undefined,
          publishedBefore: undefined,
          sortBy: "publishedAt",
          sortOrder: "desc",
          page: 1,
          pageSize: 20,
        });

        expect(body.pagination).toEqual({
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        });

        expect(body.data).toEqual([
          recommendation,
        ]);
      },
    );

    it(
      "normalizes and passes all query parameters",
      async () => {
        await GET(
          createRequest(
            "?category=crypto&symbol=%20btc%20&status=successful&minScore=90&minConfidence=80&publishedAfter=2026-01-01&publishedBefore=2026-12-31&sortBy=score&sortOrder=asc&page=2&pageSize=10",
          ),
        );

        expect(
          queryRecommendationsMock,
        ).toHaveBeenCalledWith({
          category: "Crypto",
          symbol: "BTC",
          status: "Successful",
          minScore: 90,
          minConfidence: 80,
          publishedAfter:
            "2026-01-01",
          publishedBefore:
            "2026-12-31",
          sortBy: "score",
          sortOrder: "asc",
          page: 2,
          pageSize: 10,
        });
      },
    );

    it(
      "returns the number of items on the current page",
      async () => {
        const response = await GET(
          createRequest(),
        );

        const body =
          await response.json();

        expect(body.count).toBe(1);
      },
    );

    it(
      "returns 400 for an invalid category",
      async () => {
        const response = await GET(
          createRequest(
            "?category=Commodity",
          ),
        );

        expect(response.status).toBe(
          400,
        );

        expect(
          queryRecommendationsMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns 400 for an invalid status",
      async () => {
        const response = await GET(
          createRequest(
            "?status=Completed",
          ),
        );

        expect(response.status).toBe(
          400,
        );
      },
    );

    it(
      "returns 400 for a score outside the allowed range",
      async () => {
        const response = await GET(
          createRequest(
            "?minScore=101",
          ),
        );

        const body =
          await response.json();

        expect(response.status).toBe(
          400,
        );

        expect(body.error).toBe(
          "minScore must be a number between 0 and 100",
        );
      },
    );

    it(
      "returns 400 for an invalid confidence value",
      async () => {
        const response = await GET(
          createRequest(
            "?minConfidence=high",
          ),
        );

        expect(response.status).toBe(
          400,
        );
      },
    );

    it(
      "returns 400 for an invalid publication date",
      async () => {
        const response = await GET(
          createRequest(
            "?publishedAfter=2026-02-30",
          ),
        );

        expect(response.status).toBe(
          400,
        );
      },
    );

    it(
      "rejects a reversed publication date range",
      async () => {
        const response = await GET(
          createRequest(
            "?publishedAfter=2026-12-31&publishedBefore=2026-01-01",
          ),
        );

        const body =
          await response.json();

        expect(response.status).toBe(
          400,
        );

        expect(body.error).toBe(
          "publishedAfter cannot be later than publishedBefore",
        );
      },
    );

    it(
      "returns 400 for an invalid sort field",
      async () => {
        const response = await GET(
          createRequest(
            "?sortBy=price",
          ),
        );

        expect(response.status).toBe(
          400,
        );
      },
    );

    it(
      "returns 400 for an invalid sort order",
      async () => {
        const response = await GET(
          createRequest(
            "?sortOrder=random",
          ),
        );

        expect(response.status).toBe(
          400,
        );
      },
    );

    it(
      "returns 400 for a non-positive page",
      async () => {
        const response = await GET(
          createRequest(
            "?page=0",
          ),
        );

        expect(response.status).toBe(
          400,
        );
      },
    );

    it(
      "returns 400 when pageSize exceeds 100",
      async () => {
        const response = await GET(
          createRequest(
            "?pageSize=101",
          ),
        );

        expect(response.status).toBe(
          400,
        );
      },
    );
  },
);

function createRequest(
  query = "",
): Request {
  return new Request(
    `http://localhost:3000/api/recommendations${query}`,
  );
}
