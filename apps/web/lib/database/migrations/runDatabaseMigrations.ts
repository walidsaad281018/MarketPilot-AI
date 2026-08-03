import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";
import type {
  DatabaseSync,
} from "node:sqlite";

const migrationFilePattern =
  /^\d+.*\.sql$/i;

export type RunDatabaseMigrationsOptions = {
  database: DatabaseSync;
  migrationsDirectory?: string;
  workingDirectory?: string;
};

export type DatabaseMigrationResult = {
  appliedMigrations: string[];
};

export function runDatabaseMigrations({
  database,
  migrationsDirectory =
    resolveDatabaseMigrationsDirectory(),
}: RunDatabaseMigrationsOptions):
  DatabaseMigrationResult {
  validateMigrationsDirectory(
    migrationsDirectory,
  );

  const migrationFiles =
    discoverMigrationFiles(
      migrationsDirectory,
    );

  if (migrationFiles.length === 0) {
    return {
      appliedMigrations: [],
    };
  }

  let transactionStarted =
    false;

  try {
    database.exec(
      "BEGIN IMMEDIATE TRANSACTION;",
    );

    transactionStarted = true;

    for (
      const migrationFile
      of migrationFiles
    ) {
      const migrationPath =
        path.join(
          migrationsDirectory,
          migrationFile,
        );

      const migrationSql =
        readFileSync(
          migrationPath,
          "utf8",
        ).trim();

      if (
        migrationSql.length === 0
      ) {
        throw new Error(
          `Database migration is empty: ${migrationFile}`,
        );
      }

      database.exec(
        migrationSql,
      );
    }

    database.exec(
      "COMMIT;",
    );

    transactionStarted = false;

    return {
      appliedMigrations:
        migrationFiles,
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        database.exec(
          "ROLLBACK;",
        );
      } catch {
        // Preserve the original migration error.
      }
    }

    throw createMigrationError(
      error,
    );
  }
}

export function resolveDatabaseMigrationsDirectory(
  workingDirectory:
    string = process.cwd(),
): string {
  const candidates = [
    path.resolve(
      workingDirectory,
      "database",
      "migrations",
    ),
    path.resolve(
      workingDirectory,
      "..",
      "..",
      "database",
      "migrations",
    ),
  ];

  const existingDirectory =
    candidates.find(
      isDirectory,
    );

  return (
    existingDirectory ??
    candidates[0]
  );
}

function discoverMigrationFiles(
  migrationsDirectory: string,
): string[] {
  return readdirSync(
    migrationsDirectory,
    {
      withFileTypes: true,
    },
  )
    .filter(
      (entry) =>
        entry.isFile() &&
        migrationFilePattern.test(
          entry.name,
        ),
    )
    .map(
      (entry) => entry.name,
    )
    .sort(
      (first, second) =>
        first.localeCompare(
          second,
          "en",
          {
            numeric: true,
            sensitivity: "base",
          },
        ),
    );
}

function validateMigrationsDirectory(
  migrationsDirectory: string,
): void {
  if (
    !isDirectory(
      migrationsDirectory,
    )
  ) {
    throw new Error(
      `Database migrations directory was not found: ${migrationsDirectory}`,
    );
  }
}

function isDirectory(
  candidatePath: string,
): boolean {
  if (
    !existsSync(candidatePath)
  ) {
    return false;
  }

  try {
    return statSync(
      candidatePath,
    ).isDirectory();
  } catch {
    return false;
  }
}

function createMigrationError(
  error: unknown,
): Error {
  if (
    error instanceof Error
  ) {
    return new Error(
      `Database migration failed: ${error.message}`,
      {
        cause: error,
      },
    );
  }

  return new Error(
    "Database migration failed because of an unknown error.",
  );
}
