import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  publishMock,
} = vi.hoisted(() => ({
  publishMock:
    vi.fn(),
}));

vi.mock(
  "@/lib/application/productionApplication",
  () => ({
    productionApplication: {
      liveCryptoRecommendationPublicationService: {
        publish:
          publishMock,
      },
    },
  }),
);

import {
  POST,
} from "@/app/api/internal/run-market-cycle/route";

const originalCronSecret =
  process.env.CRON_SECRET;

describe(
  "POST /api/internal/run-market-cycle",
  () => {
    beforeEach(() => {
      publishMock
        .mockReset()
        .mockResolvedValue({
          publishedRecords: [],
          publishedCount: 0,
        });

      process.env.CRON_SECRET =
        "test-cron-secret";
    });

    afterEach(() => {
      if (
        originalCronSecret === undefined
      ) {
        delete process.env
          .CRON_SECRET;
      }
      else {
        process.env.CRON_SECRET =
          originalCronSecret;
      }

      vi.restoreAllMocks();
    });

    it(
      "returns 401 when CRON_SECRET is not configured",
      async () => {
        delete process.env
          .CRON_SECRET;

        const response =
          await POST(
            createRequest({
              token:
                "test-cron-secret",
            }),
          );

        const body =
          await response.json();

        expect(
          response.status,
        ).toBe(401);

        expect(body).toEqual({
          success: false,
          error:
            "Cron secret is not configured.",
        });

        expect(
          publishMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns 401 for an invalid bearer token",
      async () => {
        const response =
          await POST(
            createRequest({
              token:
                "wrong-secret",
            }),
          );

        const body =
          await response.json();

        expect(
          response.status,
        ).toBe(401);

        expect(body).toEqual({
          success: false,
          error:
            "Unauthorized.",
        });

        expect(
          publishMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns 401 when the authorization header is missing",
      async () => {
        const response =
          await POST(
            createRequest(),
          );

        expect(
          response.status,
        ).toBe(401);

        expect(
          publishMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "executes the production market cycle for an authorized request",
      async () => {
        const publishedRecord = {
          id:
            "MP-CRON-TEST-001",
          asset: "Bitcoin",
          symbol: "BTC",
          category:
            "Crypto" as const,
          publishedAt:
            "2026-08-08",
          evaluationDate:
            "2026-08-15",
          entryPrice: 100,
          evaluationPrice: null,
          targetReturn: 5,
          score: 90,
          confidence: 88,
          targetPrice: 105,
          actualReturn: null,
          status:
            "Pending" as const,
          targetReached: null,
        };

        publishMock
          .mockResolvedValue({
            publishedRecords: [
              publishedRecord,
            ],
            publishedCount: 1,
          });

        const response =
          await POST(
            createRequest({
              token:
                "test-cron-secret",
            }),
          );

        const body =
          await response.json();

        expect(
          response.status,
        ).toBe(200);

        expect(
          publishMock,
        ).toHaveBeenCalledOnce();

        expect(body).toEqual({
          success: true,
          publishedCount: 1,
          publishedRecords: [
            publishedRecord,
          ],
        });
      },
    );

    it(
      "returns a successful empty result when no recommendations are published",
      async () => {
        const response =
          await POST(
            createRequest({
              token:
                "test-cron-secret",
            }),
          );

        const body =
          await response.json();

        expect(
          response.status,
        ).toBe(200);

        expect(body).toEqual({
          success: true,
          publishedCount: 0,
          publishedRecords: [],
        });
      },
    );

    it(
      "returns 500 when the market cycle fails",
      async () => {
        const consoleErrorSpy =
          vi.spyOn(
            console,
            "error",
          )
            .mockImplementation(
              () => {},
            );

        publishMock
          .mockRejectedValue(
            new Error(
              "Market provider unavailable.",
            ),
          );

        const response =
          await POST(
            createRequest({
              token:
                "test-cron-secret",
            }),
          );

        const body =
          await response.json();

        expect(
          response.status,
        ).toBe(500);

        expect(body).toEqual({
          success: false,
          error:
            "Market cycle failed.",
        });

        expect(
          publishMock,
        ).toHaveBeenCalledOnce();

        expect(
          consoleErrorSpy,
        ).toHaveBeenCalled();
      },
    );
  },
);

function createRequest({
  token,
}: {
  token?: string;
} = {}): Request {
  const headers =
    new Headers();

  if (token) {
    headers.set(
      "authorization",
      `Bearer ${token}`,
    );
  }

  return new Request(
    "http://localhost:3000/api/internal/run-market-cycle",
    {
      method: "POST",
      headers,
    },
  );
}
