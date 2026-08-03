import {
  mkdirSync,
} from "node:fs";
import path from "node:path";
import {
  DatabaseSync,
} from "node:sqlite";

import {
  runDatabaseMigrations,
} from "@/lib/database/migrations";

export type OpenSqliteDatabaseOptions = {
  databasePath: string;
  timeoutMilliseconds?: number;
  migrationsDirectory?: string;
  applyMigrations?: boolean;
};

export function openSqliteDatabase({
  databasePath,
  timeoutMilliseconds = 5_000,
  migrationsDirectory,
  applyMigrations = true,
}: OpenSqliteDatabaseOptions): DatabaseSync {
  ensureDatabaseDirectory(
    databasePath,
  );

  const database =
    new DatabaseSync(
      databasePath,
      {
        timeout:
          timeoutMilliseconds,
      },
    );

  try {
    configureDatabase(
      database,
      databasePath,
    );

    if (applyMigrations) {
      runDatabaseMigrations({
        database,
        migrationsDirectory,
      });
    }

    return database;
  } catch (error) {
    if (database.isOpen) {
      database.close();
    }

    throw error;
  }
}

function ensureDatabaseDirectory(
  databasePath: string,
): void {
  if (
    databasePath === ":memory:"
  ) {
    return;
  }

  const databaseDirectory =
    path.dirname(
      databasePath,
    );

  mkdirSync(
    databaseDirectory,
    {
      recursive: true,
    },
  );
}

function configureDatabase(
  database: DatabaseSync,
  databasePath: string,
): void {
  database.exec(
    "PRAGMA foreign_keys = ON;",
  );

  database.exec(
    "PRAGMA busy_timeout = 5000;",
  );

  if (
    databasePath !== ":memory:"
  ) {
    database.exec(
      "PRAGMA journal_mode = WAL;",
    );
  }
}
