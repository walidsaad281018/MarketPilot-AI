import {
  mkdtempSync,
  rmSync,
} from "node:fs";
import {
  tmpdir,
} from "node:os";
import {
  join,
} from "node:path";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  createApplicationComposition,
  type ApplicationComposition,
} from "@/lib/application/applicationComposition";

const openCompositions:
  ApplicationComposition[] = [];

const temporaryDirectories:
  string[] = [];

afterEach(async () => {
  for (
    const composition
    of openCompositions.splice(0)
  ) {
    await composition.close();
  }

  for (
    const directory
    of temporaryDirectories.splice(0)
  ) {
    rmSync(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

describe(
  "createApplicationComposition",
  () => {
    it(
      "creates SQLite-backed application services",
      async () => {
        const composition =
          createTestComposition();

        const seedResult =
          await composition.seedResult;

        const records =
          await composition
            .recommendationHistoryService
            .getAllRecommendations();

        expect(
          records.length,
        ).toBeGreaterThan(0);

        expect(
          seedResult?.seeded,
        ).toBe(true);

        expect(
          seedResult?.seededCount,
        ).toBe(
          records.length,
        );

        expect(
          await composition
            .recommendationService
            .getRecommendation(
              records[0]?.id ??
                "",
            ),
        ).toEqual(
          records[0],
        );

        expect(
          composition
            .marketSnapshotRepository
            .getAll(),
        ).toEqual([]);
      },
    );

    it(
      "shares one recommendation repository between reading and publishing services",
      async () => {
        const composition =
          createTestComposition({
            seedDatabase: false,
          });

        const result =
          await composition
            .recommendationPublisher
            .publish([
              {
                id:
                  "MP-COMPOSITION-0001",
                asset:
                  "Composition Test Asset",
                symbol: "CMP",
                category: "Crypto",
                publishedAt:
                  "2026-08-01",
                evaluationDate:
                  "2026-08-08",
                entryPrice: 100,
                evaluationPrice:
                  null,
                targetReturn: 5,
                score: 90,
                confidence: 88,
              },
            ]);

        expect(
          result.publishedCount,
        ).toBe(1);

        expect(
          await composition
            .recommendationService
            .getRecommendation(
              "MP-COMPOSITION-0001",
            ),
        ).toEqual(
          result
            .publishedRecords[0],
        );
      },
    );

    it(
      "shares the snapshot repository with the capture service",
      async () => {
        const composition =
          createTestComposition({
            seedDatabase: false,
          });

        const result =
          await composition
            .marketSnapshotCaptureService
            .capture({
              quotes: [
                {
                  symbol: "BTC",
                  category:
                    "crypto",
                  price: 100_000,
                  priceChange24h:
                    3,
                  volume24hUsd:
                    5_000_000_000,
                  marketCapUsd:
                    1_900_000_000_000,
                  volatility24h:
                    5,
                  lastUpdated:
                    "2026-08-08T07:59:30.000Z",
                  source:
                    "CoinGecko",
                },
              ],
              capturedAt:
                new Date(
                  "2026-08-08T08:00:00.000Z",
                ),
            });

        expect(
          result.capturedCount,
        ).toBe(1);

        expect(
          (
            await composition
              .marketSnapshotRepository
              .getLatestBySymbol(
                "btc",
              )
          )?.price,
        ).toBe(
          100_000,
        );
      },
    );

    it(
      "does not seed when database seeding is disabled",
      async () => {
        const composition =
          createTestComposition({
            seedDatabase: false,
          });

        expect(
          composition.seedResult,
        ).toBeNull();

        expect(
          await composition
            .recommendationHistoryService
            .getAllRecommendations(),
        ).toEqual([]);
      },
    );

    it(
      "does not duplicate seed records when reopened",
      async () => {
        const {
          databasePath,
          temporaryDirectory,
        } =
          createTemporaryDatabase();

        const firstComposition =
          createApplicationComposition({
            databasePath,
          });

        const firstSeedResult =
          await firstComposition.seedResult;

        const firstCount =
          (
            await firstComposition
              .recommendationHistoryService
              .getAllRecommendations()
          ).length;

        expect(
          firstSeedResult?.seeded,
        ).toBe(true);

        await firstComposition.close();

        const secondComposition =
          createApplicationComposition({
            databasePath,
          });

        openCompositions.push(
          secondComposition,
        );

        temporaryDirectories.push(
          temporaryDirectory,
        );

        expect(
          await secondComposition.seedResult,
        ).toEqual({
          seeded: false,
          seededCount: 0,
          seededRecords: [],
        });

        expect(
          await secondComposition
            .recommendationHistoryService
            .getAllRecommendations(),
        ).toHaveLength(
          firstCount,
        );
      },
    );
  },
);

type TestCompositionOptions = {
  seedDatabase?: boolean;
};

function createTestComposition({
  seedDatabase = true,
}: TestCompositionOptions = {}):
  ApplicationComposition {
  const {
    databasePath,
    temporaryDirectory,
  } =
    createTemporaryDatabase();

  const composition =
    createApplicationComposition({
      databasePath,
      seedDatabase,
    });

  openCompositions.push(
    composition,
  );

  temporaryDirectories.push(
    temporaryDirectory,
  );

  return composition;
}

function createTemporaryDatabase(): {
  databasePath: string;
  temporaryDirectory: string;
} {
  const temporaryDirectory =
    mkdtempSync(
      join(
        tmpdir(),
        "marketpilot-composition-test-",
      ),
    );

  return {
    databasePath:
      join(
        temporaryDirectory,
        "marketpilot.sqlite",
      ),
    temporaryDirectory,
  };
}

describe(
  "historical recommendation verification composition",
  () => {
    it(
      "verifies and persists a pending recommendation using stored market snapshots",
      async () => {
        const composition =
          createTestComposition({
            seedDatabase: false,
          });

        await composition
          .recommendationPublisher
          .publish([
            {
              id:
                "MP-HISTORICAL-VERIFY-001",
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
            },
          ]);

        await composition
          .marketSnapshotCaptureService
          .capture({
            quotes: [
              {
                symbol: "BTC",
                category: "crypto",
                price: 108,
                priceChange24h: 3,
                volume24hUsd:
                  5_000_000_000,
                marketCapUsd:
                  1_900_000_000_000,
                volatility24h: 5,
                lastUpdated:
                  "2026-08-05T11:59:30.000Z",
                source:
                  "CoinGecko",
              },
            ],
            capturedAt:
              new Date(
                "2026-08-05T12:00:00.000Z",
              ),
          });

        await composition
          .marketSnapshotCaptureService
          .capture({
            quotes: [
              {
                symbol: "BTC",
                category: "crypto",
                price: 102,
                priceChange24h: 1,
                volume24hUsd:
                  4_500_000_000,
                marketCapUsd:
                  1_850_000_000_000,
                volatility24h: 4,
                lastUpdated:
                  "2026-08-08T11:59:30.000Z",
                source:
                  "CoinGecko",
              },
            ],
            capturedAt:
              new Date(
                "2026-08-08T12:00:00.000Z",
              ),
          });

        const result =
          await composition
            .pendingRecommendationVerificationService
            .verifyPending({
              currentDate:
                new Date(
                  "2026-08-09T00:00:00.000Z",
                ),
            });

        expect(
          result.verifiedCount,
        ).toBe(1);

        expect(
          result.verifiedRecords,
        ).toHaveLength(1);

        expect(
          composition
            .repository
            .getById(
              "MP-HISTORICAL-VERIFY-001",
            ),
        ).toMatchObject({
          evaluationPrice: 102,
          actualReturn: 2,
          status:
            "Successful",
          targetReached: true,
        });
      },
    );
  },
);
