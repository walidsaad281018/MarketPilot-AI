import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  tmpdir,
} from "node:os";
import path from "node:path";
import {
  DatabaseSync,
} from "node:sqlite";
import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  runDatabaseMigrations,
} from "@/lib/database/migrations/runDatabaseMigrations";

describe(
  "runDatabaseMigrations",
  () => {
    const temporaryDirectories:
      string[] = [];

    const openDatabases:
      DatabaseSync[] = [];

    afterEach(() => {
      for (
        const database
        of openDatabases
      ) {
        if (database.isOpen) {
          database.close();
        }
      }

      openDatabases.length = 0;

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

    it(
      "executes SQL migrations in filename order",
      () => {
        const migrationsDirectory =
          createMigrationsDirectory();

        writeMigration(
          migrationsDirectory,
          "002_create_second.sql",
          `
            CREATE TABLE second_table (
              id INTEGER PRIMARY KEY
            ) STRICT;
          `,
        );

        writeMigration(
          migrationsDirectory,
          "001_create_first.sql",
          `
            CREATE TABLE first_table (
              id INTEGER PRIMARY KEY
            ) STRICT;
          `,
        );

        const database =
          createDatabase();

        const result =
          runDatabaseMigrations({
            database,
            migrationsDirectory,
          });

        expect(
          result.appliedMigrations,
        ).toEqual([
          "001_create_first.sql",
          "002_create_second.sql",
        ]);

        expect(
          getTableNames(
            database,
          ),
        ).toEqual([
          "first_table",
          "second_table",
        ]);
      },
    );

    it(
      "ignores files that are not numbered SQL migrations",
      () => {
        const migrationsDirectory =
          createMigrationsDirectory();

        writeMigration(
          migrationsDirectory,
          "README.md",
          "Not a migration.",
        );

        writeMigration(
          migrationsDirectory,
          "migration.sql",
          `
            CREATE TABLE ignored_table (
              id INTEGER PRIMARY KEY
            );
          `,
        );

        writeMigration(
          migrationsDirectory,
          "001_create_example.sql",
          `
            CREATE TABLE example (
              id INTEGER PRIMARY KEY
            ) STRICT;
          `,
        );

        const database =
          createDatabase();

        const result =
          runDatabaseMigrations({
            database,
            migrationsDirectory,
          });

        expect(
          result.appliedMigrations,
        ).toEqual([
          "001_create_example.sql",
        ]);

        expect(
          getTableNames(
            database,
          ),
        ).toEqual([
          "example",
        ]);
      },
    );

    it(
      "supports idempotent migrations",
      () => {
        const migrationsDirectory =
          createMigrationsDirectory();

        writeMigration(
          migrationsDirectory,
          "001_create_example.sql",
          `
            CREATE TABLE IF NOT EXISTS example (
              id INTEGER PRIMARY KEY
            ) STRICT;
          `,
        );

        const database =
          createDatabase();

        runDatabaseMigrations({
          database,
          migrationsDirectory,
        });

        expect(() =>
          runDatabaseMigrations({
            database,
            migrationsDirectory,
          }),
        ).not.toThrow();

        expect(
          getTableNames(
            database,
          ),
        ).toEqual([
          "example",
        ]);
      },
    );

    it(
      "rolls back all changes when one migration fails",
      () => {
        const migrationsDirectory =
          createMigrationsDirectory();

        writeMigration(
          migrationsDirectory,
          "001_create_first.sql",
          `
            CREATE TABLE first_table (
              id INTEGER PRIMARY KEY
            ) STRICT;
          `,
        );

        writeMigration(
          migrationsDirectory,
          "002_invalid.sql",
          `
            THIS IS NOT VALID SQL;
          `,
        );

        const database =
          createDatabase();

        expect(() =>
          runDatabaseMigrations({
            database,
            migrationsDirectory,
          }),
        ).toThrow(
          "Database migration failed",
        );

        expect(
          getTableNames(
            database,
          ),
        ).toEqual([]);
      },
    );

    it(
      "rejects a missing migrations directory",
      () => {
        const database =
          createDatabase();

        const missingDirectory =
          path.join(
            tmpdir(),
            "marketpilot-missing-migrations",
            String(Date.now()),
          );

        expect(() =>
          runDatabaseMigrations({
            database,
            migrationsDirectory:
              missingDirectory,
          }),
        ).toThrow(
          "Database migrations directory was not found",
        );
      },
    );

    function createDatabase():
      DatabaseSync {
      const database =
        new DatabaseSync(
          ":memory:",
        );

      openDatabases.push(
        database,
      );

      return database;
    }

    function createMigrationsDirectory():
      string {
      const temporaryDirectory =
        mkdtempSync(
          path.join(
            tmpdir(),
            "marketpilot-migrations-",
          ),
        );

      temporaryDirectories.push(
        temporaryDirectory,
      );

      const migrationsDirectory =
        path.join(
          temporaryDirectory,
          "migrations",
        );

      mkdirSync(
        migrationsDirectory,
        {
          recursive: true,
        },
      );

      return migrationsDirectory;
    }
  },
);

function writeMigration(
  migrationsDirectory: string,
  fileName: string,
  sql: string,
): void {
  writeFileSync(
    path.join(
      migrationsDirectory,
      fileName,
    ),
    sql,
    "utf8",
  );
}

function getTableNames(
  database: DatabaseSync,
): string[] {
  const rows =
    database
      .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE
          type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name;
      `)
      .all() as {
        name: string;
      }[];

  return rows.map(
    (row) => row.name,
  );
}
