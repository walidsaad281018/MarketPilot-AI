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
  recommendationRecords,
  type RecommendationRecord,
} from "@/data/recommendations";
import {
  RecommendationSeedService,
} from "@/lib/recommendations/recommendationSeedService";
import {
  createSqliteRecommendationRepository,
} from "@/lib/recommendations/recommendationRepositoryFactory";
import type {
  SqliteRecommendationRepository,
} from "@/lib/recommendations/sqliteRecommendationRepository";

type TestRepositoryContext = {
  repository:
    SqliteRecommendationRepository;
  temporaryDirectory: string;
};

const openRepositories:
  SqliteRecommendationRepository[] = [];

const temporaryDirectories:
  string[] = [];

afterEach(() => {
  for (
    const repository
    of openRepositories.splice(0)
  ) {
    repository.close();
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
  "RecommendationSeedService",
  () => {
    it(
      "seeds an empty SQLite repository",
      () => {
        const { repository } =
          createTestRepository();

        const seedRecords =
          recommendationRecords.slice(
            0,
            2,
          );

        const service =
          new RecommendationSeedService({
            repository,
            seedRecords,
          });

        const result =
          service.seedIfEmpty();

        expect(result.seeded).toBe(
          true,
        );

        expect(
          result.seededCount,
        ).toBe(2);

        expect(
          result.seededRecords,
        ).toEqual(seedRecords);

        expect(
          repository.getAll(),
        ).toEqual(seedRecords);
      },
    );

    it(
      "does not seed a SQLite repository that already contains records",
      () => {
        const { repository } =
          createTestRepository();

        const existingRecord =
          getDemoRecommendation(0);

        repository.save(
          existingRecord,
        );

        const service =
          new RecommendationSeedService({
            repository,
            seedRecords:
              recommendationRecords.slice(
                1,
                3,
              ),
          });

        const result =
          service.seedIfEmpty();

        expect(result).toEqual({
          seeded: false,
          seededCount: 0,
          seededRecords: [],
        });

        expect(
          repository.getAll(),
        ).toEqual([
          existingRecord,
        ]);
      },
    );

    it(
      "does nothing when the seed collection is empty",
      () => {
        const { repository } =
          createTestRepository();

        const service =
          new RecommendationSeedService({
            repository,
            seedRecords: [],
          });

        const result =
          service.seedIfEmpty();

        expect(result).toEqual({
          seeded: false,
          seededCount: 0,
          seededRecords: [],
        });

        expect(
          repository.getAll(),
        ).toEqual([]);
      },
    );

    it(
      "is idempotent when called more than once",
      () => {
        const { repository } =
          createTestRepository();

        const seedRecords =
          recommendationRecords.slice(
            0,
            3,
          );

        const service =
          new RecommendationSeedService({
            repository,
            seedRecords,
          });

        const firstResult =
          service.seedIfEmpty();

        const secondResult =
          service.seedIfEmpty();

        expect(firstResult.seeded).toBe(
          true,
        );

        expect(
          firstResult.seededCount,
        ).toBe(3);

        expect(secondResult).toEqual({
          seeded: false,
          seededCount: 0,
          seededRecords: [],
        });

        expect(
          repository.getAll(),
        ).toEqual(seedRecords);
      },
    );

    it(
      "protects its internal seed collection from later array mutation",
      () => {
        const { repository } =
          createTestRepository();

        const firstRecord =
          getDemoRecommendation(0);

        const seedRecords:
          RecommendationRecord[] = [
            firstRecord,
          ];

        const service =
          new RecommendationSeedService({
            repository,
            seedRecords,
          });

        seedRecords.length = 0;

        const result =
          service.seedIfEmpty();

        expect(result.seeded).toBe(
          true,
        );

        expect(
          result.seededCount,
        ).toBe(1);

        expect(
          repository.getAll(),
        ).toEqual([
          firstRecord,
        ]);
      },
    );
  },
);

function createTestRepository():
  TestRepositoryContext {
  const temporaryDirectory =
    mkdtempSync(
      join(
        tmpdir(),
        "marketpilot-seed-test-",
      ),
    );

  const databasePath =
    join(
      temporaryDirectory,
      "recommendations.sqlite",
    );

  const repository =
    createSqliteRecommendationRepository({
      databasePath,
    });

  temporaryDirectories.push(
    temporaryDirectory,
  );

  openRepositories.push(
    repository,
  );

  return {
    repository,
    temporaryDirectory,
  };
}

function getDemoRecommendation(
  index: number,
): RecommendationRecord {
  const recommendation =
    recommendationRecords[index];

  if (!recommendation) {
    throw new Error(
      `Expected demo recommendation at index ${index}.`,
    );
  }

  return recommendation;
}
