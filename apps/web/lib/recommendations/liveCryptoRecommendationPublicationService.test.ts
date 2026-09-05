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
import type {
  MarketQuote,
} from "@/lib/providers/marketProvider";

function createCandidate(
  overrides:
    Partial<RecommendationSourceRecord> = {},
): RecommendationSourceRecord {
  return {
    id: "MP-TEST-LIVE-BTC",
    asset: "Bitcoin",
    symbol: "BTC",
    category: "Crypto",
    publishedAt:
      "2026-08-01",
    evaluationDate:
      "2026-08-08",
    entryPrice: 100,
    evaluationPrice: null,
    targetReturn: 5,
    score: 90,
    confidence: 88,
    ...overrides,
  };
}

function createPublishedRecord(
  candidate:
    RecommendationSourceRecord,
): RecommendationRecord {
  return {
    ...candidate,
    targetPrice: 105,
    actualReturn: null,
    status: "Pending",
    targetReached: null,
  };
}

function createQuote(
  overrides:
    Partial<MarketQuote> = {},
): MarketQuote {
  return {
    symbol: "BTC",
    category: "crypto",
    price: 100,
    priceChange24h: 3,
    volume24hUsd:
      5_000_000_000,
    marketCapUsd:
      1_900_000_000_000,
    volatility24h: 5,
    lastUpdated:
      "2026-08-08T07:00:00.000Z",
    source: "CoinGecko",
    ...overrides,
  };
}

describe(
  "LiveCryptoRecommendationPublicationService",
  () => {
    it(
      "returns an empty result when no live candidates are available",
      async () => {
        const candidateGenerator =
          vi.fn()
            .mockResolvedValue(
              [],
            );

        const publisher = {
          publish:
            vi.fn(),
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
        ).toHaveBeenCalledWith(
          {},
        );

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
          vi.fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publisher = {
          publish:
            vi.fn()
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
          vi.fn()
            .mockResolvedValue(
              [],
            );

        const publisher = {
          publish:
            vi.fn(),
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
      "captures live market snapshots before publishing",
      async () => {
        const candidate =
          createCandidate();

        const quote =
          createQuote();

        const publishedRecord =
          createPublishedRecord(
            candidate,
          );

        const candidateGenerator =
          vi.fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publisher = {
          publish:
            vi.fn()
              .mockReturnValue({
                publishedRecords: [
                  publishedRecord,
                ],
                publishedCount: 1,
              }),
        };

        const marketProvider = {
          getQuotes:
            vi.fn()
              .mockResolvedValue([
                quote,
              ]),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn()
              .mockReturnValue({
                capturedSnapshots: [],
                capturedCount: 1,
              }),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
          });

        await service.publish();

        expect(
          marketProvider.getQuotes,
        ).toHaveBeenCalledWith([
          "BTC",
        ]);

        expect(
          snapshotCaptureService.capture,
        ).toHaveBeenCalledWith({
          quotes: [
            quote,
          ],
          capturedAt:
            expect.any(Date),
        });

        expect(
          snapshotCaptureService.capture
            .mock
            .invocationCallOrder[0],
        ).toBeLessThan(
          publisher.publish
            .mock
            .invocationCallOrder[0],
        );
      },
    );

    it(
      "deduplicates symbols before requesting snapshot quotes",
      async () => {
        const candidates = [
          createCandidate(),
          createCandidate({
            id:
              "MP-TEST-LIVE-BTC-2",
            symbol: "btc",
          }),
        ];

        const candidateGenerator =
          vi.fn()
            .mockResolvedValue(
              candidates,
            );

        const publisher = {
          publish:
            vi.fn()
              .mockReturnValue({
                publishedRecords: [],
                publishedCount: 0,
              }),
        };

        const marketProvider = {
          getQuotes:
            vi.fn()
              .mockResolvedValue([
                createQuote(),
              ]),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn()
              .mockReturnValue({
                capturedSnapshots: [],
                capturedCount: 1,
              }),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
          });

        await service.publish();

        expect(
          marketProvider.getQuotes,
        ).toHaveBeenCalledWith([
          "BTC",
        ]);
      },
    );

    it(
      "does not capture snapshots when no candidates exist",
      async () => {
        const candidateGenerator =
          vi.fn()
            .mockResolvedValue(
              [],
            );

        const publisher = {
          publish:
            vi.fn(),
        };

        const marketProvider = {
          getQuotes:
            vi.fn(),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn(),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
          });

        await service.publish();

        expect(
          marketProvider.getQuotes,
        ).not.toHaveBeenCalled();

        expect(
          snapshotCaptureService.capture,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects incomplete market snapshot data before publishing",
      async () => {
        const candidates = [
          createCandidate(),
          createCandidate({
            id:
              "MP-TEST-LIVE-ETH",
            asset: "Ethereum",
            symbol: "ETH",
          }),
        ];

        const candidateGenerator =
          vi.fn()
            .mockResolvedValue(
              candidates,
            );

        const publisher = {
          publish:
            vi.fn(),
        };

        const marketProvider = {
          getQuotes:
            vi.fn()
              .mockResolvedValue([
                createQuote(),
              ]),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn(),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
          });

        await expect(
          service.publish(),
        ).rejects.toThrow(
          "Unable to capture market snapshots for: ETH.",
        );

        expect(
          snapshotCaptureService.capture,
        ).not.toHaveBeenCalled();

        expect(
          publisher.publish,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "propagates market provider errors before publishing",
      async () => {
        const candidate =
          createCandidate();

        const candidateGenerator =
          vi.fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publisher = {
          publish:
            vi.fn(),
        };

        const marketProvider = {
          getQuotes:
            vi.fn()
              .mockRejectedValue(
                new Error(
                  "Snapshot provider unavailable.",
                ),
              ),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn(),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
          });

        await expect(
          service.publish(),
        ).rejects.toThrow(
          "Snapshot provider unavailable.",
        );

        expect(
          snapshotCaptureService.capture,
        ).not.toHaveBeenCalled();

        expect(
          publisher.publish,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "propagates snapshot persistence errors before publishing",
      async () => {
        const candidate =
          createCandidate();

        const candidateGenerator =
          vi.fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publisher = {
          publish:
            vi.fn(),
        };

        const marketProvider = {
          getQuotes:
            vi.fn()
              .mockResolvedValue([
                createQuote(),
              ]),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn()
              .mockImplementation(
                () => {
                  throw new Error(
                    "Snapshot persistence failed.",
                  );
                },
              ),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
          });

        await expect(
          service.publish(),
        ).rejects.toThrow(
          "Snapshot persistence failed.",
        );

        expect(
          publisher.publish,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "requires snapshot dependencies to be configured together",
      () => {
        expect(() =>
          new LiveCryptoRecommendationPublicationService({
            snapshotCaptureService: {
              capture:
                vi.fn(),
            },
          }),
        ).toThrow(
          "Snapshot capture service and market provider must be configured together.",
        );
      },
    );

    it(
      "propagates candidate-generation errors",
      async () => {
        const candidateGenerator =
          vi.fn()
            .mockRejectedValue(
              new Error(
                "Market provider unavailable.",
              ),
            );

        const publisher = {
          publish:
            vi.fn(),
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
          vi.fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publisher = {
          publish:
            vi.fn()
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

describe(
  "automatic pending recommendation verification",
  () => {
    it(
      "verifies pending recommendations after snapshot capture and before publishing",
      async () => {
        const candidate =
          createCandidate();

        const candidateGenerator =
          vi.fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publisher = {
          publish:
            vi.fn()
              .mockReturnValue({
                publishedRecords: [
                  createPublishedRecord(
                    candidate,
                  ),
                ],
                publishedCount: 1,
              }),
        };

        const marketProvider = {
          getQuotes:
            vi.fn()
              .mockResolvedValue([
                createQuote(),
              ]),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn()
              .mockReturnValue({
                capturedSnapshots: [],
                capturedCount: 1,
              }),
        };

        const pendingVerificationService = {
          verifyPending:
            vi.fn()
              .mockReturnValue({
                pendingCount: 1,
                eligibleCount: 1,
                verifiedCount: 1,
                skippedCount: 0,
                verifiedRecords: [],
              }),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
            pendingVerificationService,
          });

        await service.publish();

        expect(
          pendingVerificationService
            .verifyPending,
        ).toHaveBeenCalledOnce();

        expect(
          snapshotCaptureService
            .capture
            .mock
            .invocationCallOrder[0],
        ).toBeLessThan(
          pendingVerificationService
            .verifyPending
            .mock
            .invocationCallOrder[0],
        );

        expect(
          pendingVerificationService
            .verifyPending
            .mock
            .invocationCallOrder[0],
        ).toBeLessThan(
          publisher
            .publish
            .mock
            .invocationCallOrder[0],
        );
      },
    );

    it(
      "verifies pending recommendations even when no candidates exist",
      async () => {
        const candidateGenerator =
          vi.fn()
            .mockResolvedValue(
              [],
            );

        const publisher = {
          publish:
            vi.fn(),
        };

        const pendingVerificationService = {
          getPendingRecommendations:
            vi.fn()
              .mockReturnValue(
                [],
              ),
          verifyPending:
            vi.fn(),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            pendingVerificationService,
          });

        const result =
          await service.publish();

        expect(
          pendingVerificationService
            .getPendingRecommendations,
        ).toHaveBeenCalledOnce();

        expect(
          pendingVerificationService
            .verifyPending,
        ).toHaveBeenCalledOnce();

        expect(
          pendingVerificationService
            .verifyPending,
        ).toHaveBeenCalledWith();

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
      "captures pending-only crypto symbols before verification",
      async () => {
        const pendingRecommendation =
          createPublishedRecord(
            createCandidate({
              id:
                "MP-PENDING-BNB",
              asset: "BNB",
              symbol: "BNB",
            }),
          );

        const candidateGenerator =
          vi.fn()
            .mockResolvedValue(
              [],
            );

        const publisher = {
          publish:
            vi.fn(),
        };

        const bnbQuote =
          createQuote({
            symbol: "BNB",
          });

        const marketProvider = {
          getQuotes:
            vi.fn()
              .mockResolvedValue([
                bnbQuote,
              ]),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn()
              .mockReturnValue({
                capturedSnapshots: [],
                capturedCount: 1,
              }),
        };

        const pendingVerificationService = {
          getPendingRecommendations:
            vi.fn()
              .mockReturnValue([
                pendingRecommendation,
              ]),
          verifyPending:
            vi.fn(),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
            pendingVerificationService,
          });

        await service.publish();

        expect(
          marketProvider.getQuotes,
        ).toHaveBeenCalledWith([
          "BNB",
        ]);

        expect(
          snapshotCaptureService.capture,
        ).toHaveBeenCalledWith({
          quotes: [
            bnbQuote,
          ],
          capturedAt:
            expect.any(Date),
        });

        expect(
          pendingVerificationService
            .verifyPending,
        ).toHaveBeenCalledWith({
          symbols: [
            "BNB",
          ],
        });

        expect(
          publisher.publish,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "deduplicates candidate and pending symbols before snapshot capture",
      async () => {
        const candidate =
          createCandidate();

        const pendingRecommendation =
          createPublishedRecord(
            createCandidate({
              id:
                "MP-PENDING-BTC",
              symbol: "btc",
            }),
          );

        const candidateGenerator =
          vi.fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publishedRecord =
          createPublishedRecord(
            candidate,
          );

        const publisher = {
          publish:
            vi.fn()
              .mockReturnValue({
                publishedRecords: [
                  publishedRecord,
                ],
                publishedCount: 1,
              }),
        };

        const quote =
          createQuote();

        const marketProvider = {
          getQuotes:
            vi.fn()
              .mockResolvedValue([
                quote,
              ]),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn()
              .mockReturnValue({
                capturedSnapshots: [],
                capturedCount: 1,
              }),
        };

        const pendingVerificationService = {
          getPendingRecommendations:
            vi.fn()
              .mockReturnValue([
                pendingRecommendation,
              ]),
          verifyPending:
            vi.fn(),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
            pendingVerificationService,
          });

        await service.publish();

        expect(
          marketProvider.getQuotes,
        ).toHaveBeenCalledWith([
          "BTC",
        ]);

        expect(
          pendingVerificationService
            .verifyPending,
        ).toHaveBeenCalledWith({
          symbols: [
            "BTC",
          ],
        });
      },
    );

    it(
      "does not block publication when a pending-only symbol has no quote",
      async () => {
        const candidate =
          createCandidate();

        const pendingRecommendation =
          createPublishedRecord(
            createCandidate({
              id:
                "MP-PENDING-UNSUPPORTED",
              asset:
                "Unsupported Asset",
              symbol:
                "UNSUPPORTED",
            }),
          );

        const candidateGenerator =
          vi.fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publishedRecord =
          createPublishedRecord(
            candidate,
          );

        const publisher = {
          publish:
            vi.fn()
              .mockReturnValue({
                publishedRecords: [
                  publishedRecord,
                ],
                publishedCount: 1,
              }),
        };

        const btcQuote =
          createQuote();

        const marketProvider = {
          getQuotes:
            vi.fn()
              .mockResolvedValue([
                btcQuote,
              ]),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn()
              .mockReturnValue({
                capturedSnapshots: [],
                capturedCount: 1,
              }),
        };

        const pendingVerificationService = {
          getPendingRecommendations:
            vi.fn()
              .mockReturnValue([
                pendingRecommendation,
              ]),
          verifyPending:
            vi.fn(),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
            pendingVerificationService,
          });

        const result =
          await service.publish();

        expect(
          marketProvider.getQuotes,
        ).toHaveBeenCalledWith([
          "BTC",
          "UNSUPPORTED",
        ]);

        expect(
          snapshotCaptureService.capture,
        ).toHaveBeenCalledWith({
          quotes: [
            btcQuote,
          ],
          capturedAt:
            expect.any(Date),
        });

        expect(
          pendingVerificationService
            .verifyPending,
        ).toHaveBeenCalledWith({
          symbols: [
            "BTC",
          ],
        });

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
      "does not run verification when snapshot capture fails",
      async () => {
        const candidate =
          createCandidate();

        const candidateGenerator =
          vi.fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publisher = {
          publish:
            vi.fn(),
        };

        const marketProvider = {
          getQuotes:
            vi.fn()
              .mockResolvedValue([
                createQuote(),
              ]),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn()
              .mockImplementation(
                () => {
                  throw new Error(
                    "Snapshot persistence failed.",
                  );
                },
              ),
        };

        const pendingVerificationService = {
          verifyPending:
            vi.fn(),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
            pendingVerificationService,
          });

        await expect(
          service.publish(),
        ).rejects.toThrow(
          "Snapshot persistence failed.",
        );

        expect(
          pendingVerificationService
            .verifyPending,
        ).not.toHaveBeenCalled();

        expect(
          publisher.publish,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "propagates verification errors and prevents publishing new recommendations",
      async () => {
        const candidate =
          createCandidate();

        const candidateGenerator =
          vi.fn()
            .mockResolvedValue([
              candidate,
            ]);

        const publisher = {
          publish:
            vi.fn(),
        };

        const marketProvider = {
          getQuotes:
            vi.fn()
              .mockResolvedValue([
                createQuote(),
              ]),
        };

        const snapshotCaptureService = {
          capture:
            vi.fn()
              .mockReturnValue({
                capturedSnapshots: [],
                capturedCount: 1,
              }),
        };

        const pendingVerificationService = {
          verifyPending:
            vi.fn()
              .mockImplementation(
                () => {
                  throw new Error(
                    "Pending verification failed.",
                  );
                },
              ),
        };

        const service =
          new LiveCryptoRecommendationPublicationService({
            candidateGenerator,
            publisher,
            snapshotCaptureService,
            marketProvider,
            pendingVerificationService,
          });

        await expect(
          service.publish(),
        ).rejects.toThrow(
          "Pending verification failed.",
        );

        expect(
          snapshotCaptureService
            .capture,
        ).toHaveBeenCalledOnce();

        expect(
          pendingVerificationService
            .verifyPending,
        ).toHaveBeenCalledOnce();

        expect(
          publisher.publish,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
