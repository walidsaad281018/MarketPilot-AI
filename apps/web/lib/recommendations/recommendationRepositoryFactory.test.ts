import {
  existsSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import {
  tmpdir,
} from "node:os";
import path from "node:path";
import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import type {
  RecommendationRecord,
} from "@/data/recommendations";
import {
  createSqliteRecommendationRepository,
} from "@/lib/recommendations/recommendationRepositoryFactory";
import type {
  SqliteRecommendationRepository,
} from "@/lib/recommendations/sqliteRecommendationRepository";

function createRecommendation():
  RecommendationRecord {
  return {
    id: "MP-FACTORY-0001",
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
    targetPrice: 105,
    actualReturn: null,
    status: "Pending",
    targetReached: null,
  };
}

describe(
  "createSqliteRecommendationRepository",
  () => {
    const repositories:
      SqliteRecommendationRepository[] =
      [];

    const temporaryDirectories:
      string[] = [];

    afterEach(() => {
      for (
        const repository
        of repositories
      ) {
        repository.close();
      }

      repositories.length = 0;

      for (
        const directory
        of temporaryDirectories
      ) {
        rmSync(
          directory,
          {
            recursive: true,
            force: true,
          },
        );
      }

      temporaryDirectories.length =
        0;
    });

    function createTemporaryDatabasePath():
      string {
      const temporaryDirectory =
        mkdtempSync(
          path.join(
            tmpdir(),
            "marketpilot-repository-",
          ),
        );

      temporaryDirectories.push(
        temporaryDirectory,
      );

      return path.join(
        temporaryDirectory,
        "nested",
        "marketpilot.db",
      );
    }

    it(
      "creates a usable SQLite recommendation repository",
      () => {
        const repository =
          createSqliteRecommendationRepository({
            databasePath:
              ":memory:",
          });

        repositories.push(
          repository,
        );

        const recommendation =
          createRecommendation();

        repository.save(
          recommendation,
        );

        expect(
          repository.getById(
            recommendation.id,
          ),
        ).toEqual(
          recommendation,
        );
      },
    );

    it(
      "creates the database file when using a file path",
      () => {
        const databasePath =
          createTemporaryDatabasePath();

        const repository =
          createSqliteRecommendationRepository({
            databasePath,
          });

        repositories.push(
          repository,
        );

        expect(
          existsSync(
            databasePath,
          ),
        ).toBe(true);
      },
    );

    it(
      "persists recommendations across repository instances",
      () => {
        const databasePath =
          createTemporaryDatabasePath();

        const firstRepository =
          createSqliteRecommendationRepository({
            databasePath,
          });

        repositories.push(
          firstRepository,
        );

        const recommendation =
          createRecommendation();

        firstRepository.save(
          recommendation,
        );

        firstRepository.close();

        const firstIndex =
          repositories.indexOf(
            firstRepository,
          );

        if (firstIndex >= 0) {
          repositories.splice(
            firstIndex,
            1,
          );
        }

        const secondRepository =
          createSqliteRecommendationRepository({
            databasePath,
          });

        repositories.push(
          secondRepository,
        );

        expect(
          secondRepository.getById(
            recommendation.id,
          ),
        ).toEqual(
          recommendation,
        );
      },
    );
  },
);
