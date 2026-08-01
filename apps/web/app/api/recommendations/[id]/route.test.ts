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
  getRecommendationMock,
} = vi.hoisted(() => ({
  getRecommendationMock:
    vi.fn(),
}));

vi.mock(
  "@/lib/services/api/recommendationService",
  () => ({
    recommendationService: {
      getRecommendation:
        getRecommendationMock,
    },
  }),
);

import {
  GET,
} from "@/app/api/recommendations/[id]/route";

const recommendation: RecommendationRecord = {
  id: "MP-TEST-DETAIL-0001",
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

describe(
  "GET /api/recommendations/[id]",
  () => {
    beforeEach(() => {
      getRecommendationMock
        .mockReset();
    });

    it(
      "returns a recommendation when the ID exists",
      async () => {
        getRecommendationMock
          .mockReturnValue(
            recommendation,
          );

        const response = await GET(
          createRequest(
            recommendation.id,
          ),
          createContext(
            recommendation.id,
          ),
        );

        const body =
          await response.json();

        expect(response.status).toBe(
          200,
        );

        expect(body).toEqual({
          success: true,
          data: recommendation,
        });

        expect(
          getRecommendationMock,
        ).toHaveBeenCalledWith(
          recommendation.id,
        );
      },
    );

    it(
      "returns 404 when the recommendation does not exist",
      async () => {
        getRecommendationMock
          .mockReturnValue(
            undefined,
          );

        const response = await GET(
          createRequest(
            "DOES-NOT-EXIST",
          ),
          createContext(
            "DOES-NOT-EXIST",
          ),
        );

        const body =
          await response.json();

        expect(response.status).toBe(
          404,
        );

        expect(body).toEqual({
          success: false,
          error:
            "Recommendation not found",
        });

        expect(
          getRecommendationMock,
        ).toHaveBeenCalledWith(
          "DOES-NOT-EXIST",
        );
      },
    );

    it(
      "uses the dynamic route parameter as the recommendation ID",
      async () => {
        getRecommendationMock
          .mockReturnValue(
            recommendation,
          );

        await GET(
          createRequest(
            "MP%20TEST%200001",
          ),
          createContext(
            "MP%20TEST%200001",
          ),
        );

        expect(
          getRecommendationMock,
        ).toHaveBeenCalledOnce();

        expect(
          getRecommendationMock,
        ).toHaveBeenCalledWith(
          "MP%20TEST%200001",
        );
      },
    );
  },
);

function createRequest(
  recommendationId: string,
): Request {
  return new Request(
    `http://localhost:3000/api/recommendations/${recommendationId}`,
  );
}

function createContext(
  recommendationId: string,
) {
  return {
    params: Promise.resolve({
      id: recommendationId,
    }),
  };
}
