import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type {
  RecommendationRecord,
  RecommendationSourceRecord,
} from "@/data/recommendations";
import {
  LiveCryptoRecommendationPublicationService,
} from "@/lib/recommendations/liveCryptoRecommendationPublicationService";

function createCandidate(): RecommendationSourceRecord {
  return {
    id: "MP-TEST-LIVE-BTC",
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
  };
}

function createPublishedRecord(
  candidate: RecommendationSourceRecord,
): RecommendationRecord {
  return {
    ...candidate,
    targetPrice: 105,
    actualReturn: null,
    status: "Pending",
    targetReached: null,
  };
}

describe(
  "LiveCryptoRecommendationPublicationService",
  () => {
    it(
      "returns an empty result when no live candidates are available",
      async () => {
        const candidateGenerator =
          vi.fn().mockResolvedValue([]);

        const publisher = {
          publish: vi.fn(),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
          });

        const result =
          await service.publish();

        expect(
          candidateGenerator,
        ).toHaveBeenCalledOnce();

        expect(
          candidateGenerator,
        ).toHaveBeenCalledWith({});

        expect(
          publisher.publish,
        ).not.toHaveBeenCalled();

        expect(result).toEqual({
          publishedRecords: [],
          publishedCount: 0,
        });
      },
    );

    it(
      "passes generated candidates to the publisher",
      async () => {
        const candidate =
          createCandidate();

        const publishedRecord =
          createPublishedRecord(
            candidate,
          );

        const candidateGenerator =
          vi
            .fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publisher = {
          publish: vi
            .fn()
            .mockReturnValue({
              publishedRecords: [
                publishedRecord,
              ],
              publishedCount: 1,
            }),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
          });

        const result =
          await service.publish();

        expect(
          publisher.publish,
        ).toHaveBeenCalledOnce();

        expect(
          publisher.publish,
        ).toHaveBeenCalledWith([
          candidate,
        ]);

        expect(result).toEqual({
          publishedRecords: [
            publishedRecord,
          ],
          publishedCount: 1,
        });
      },
    );

    it(
      "forwards candidate-generation options",
      async () => {
        const candidateGenerator =
          vi.fn().mockResolvedValue([]);

        const publisher = {
          publish: vi.fn(),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
          });

        await service.publish({
          limit: 5,
          evaluationDays: 14,
        });

        expect(
          candidateGenerator,
        ).toHaveBeenCalledWith({
          limit: 5,
          evaluationDays: 14,
        });
      },
    );

    it(
      "propagates candidate-generation errors",
      async () => {
        const candidateGenerator =
          vi
            .fn()
            .mockRejectedValue(
              new Error(
                "Market provider unavailable.",
              ),
            );

        const publisher = {
          publish: vi.fn(),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
          });

        await expect(
          service.publish(),
        ).rejects.toThrow(
          "Market provider unavailable.",
        );

        expect(
          publisher.publish,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "propagates publisher validation errors",
      async () => {
        const candidate =
          createCandidate();

        const candidateGenerator =
          vi
            .fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publisher = {
          publish: vi
            .fn()
            .mockImplementation(
              () => {
                throw new Error(
                  "Recommendation ID already exists.",
                );
              },
            ),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
          });

        await expect(
          service.publish(),
        ).rejects.toThrow(
          "Recommendation ID already exists.",
        );

        expect(
          publisher.publish,
        ).toHaveBeenCalledWith([
          candidate,
        ]);
      },
    );
  },
);