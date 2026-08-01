import {
  mkdtempSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

afterEach(() => {
  for (
    const composition
    of openCompositions.splice(0)
  ) {
    composition.close();
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
      () => {
        const composition =
          createTestComposition();

        const records =
          composition
            .recommendationHistoryService
            .getAllRecommendations();

        expect(records.length).toBeGreaterThan(
          0,
        );

        expect(
          composition.seedResult?.seeded,
        ).toBe(true);

        expect(
          composition.seedResult?.seededCount,
        ).toBe(records.length);

        expect(
          composition
            .recommendationService
            .getRecommendation(
              records[0]?.id ?? "",
            ),
        ).toEqual(records[0]);
      },
    );

    it(
      "shares one repository between reading and publishing services",
      () => {
        const composition =
          createTestComposition({
            seedDatabase: false,
          });

        const result =
          composition
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
                evaluationPrice: null,
                targetReturn: 5,
                score: 90,
                confidence: 88,
              },
            ]);

        expect(
          result.publishedCount,
        ).toBe(1);

        expect(
          composition
            .recommendationService
            .getRecommendation(
              "MP-COMPOSITION-0001",
            ),
        ).toEqual(
          result.publishedRecords[0],
        );
      },
    );

    it(
      "does not seed when database seeding is disabled",
      () => {
        const composition =
          createTestComposition({
            seedDatabase: false,
          });

        expect(
          composition.seedResult,
        ).toBeNull();

        expect(
          composition
            .recommendationHistoryService
            .getAllRecommendations(),
        ).toEqual([]);
      },
    );

    it(
      "does not duplicate seed records when reopened",
      () => {
        const {
          databasePath,
          temporaryDirectory,
        } = createTemporaryDatabase();

        const firstComposition =
          createApplicationComposition({
            databasePath,
          });

        const firstCount =
          firstComposition
            .recommendationHistoryService
            .getAllRecommendations()
            .length;

        expect(
          firstComposition.seedResult?.seeded,
        ).toBe(true);

        firstComposition.close();

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
          secondComposition.seedResult,
        ).toEqual({
          seeded: false,
          seededCount: 0,
          seededRecords: [],
        });

        expect(
          secondComposition
            .recommendationHistoryService
            .getAllRecommendations(),
        ).toHaveLength(firstCount);
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
  } = createTemporaryDatabase();

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
