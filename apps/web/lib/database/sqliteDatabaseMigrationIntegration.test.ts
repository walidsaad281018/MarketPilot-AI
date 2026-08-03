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
import type {
  DatabaseSync,
} from "node:sqlite";
import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  openSqliteDatabase,
} from "@/lib/database/sqliteDatabaseFactory";

describe(
  "SQLite database migration integration",
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
      "applies migrations while opening a database",
      () => {
        const temporaryDirectory =
          createTemporaryDirectory();

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

        writeFileSync(
          path.join(
            migrationsDirectory,
            "001_create_example.sql",
          ),
          `
            CREATE TABLE IF NOT EXISTS example (
              id INTEGER PRIMARY KEY,
              value TEXT NOT NULL
            ) STRICT;
          `,
          "utf8",
        );

        const database =
          openSqliteDatabase({
            databasePath:
              path.join(
                temporaryDirectory,
                "marketpilot.db",
              ),
            migrationsDirectory,
          });

        openDatabases.push(
          database,
        );

        const table =
          database
            .prepare(`
              SELECT name
              FROM sqlite_master
              WHERE
                type = 'table'
                AND name = 'example';
            `)
            .get() as
              | {
                  name: string;
                }
              | undefined;

        expect(
          table?.name,
        ).toBe("example");
      },
    );

    it(
      "can skip migrations when explicitly requested",
      () => {
        const temporaryDirectory =
          createTemporaryDirectory();

        const database =
          openSqliteDatabase({
            databasePath:
              path.join(
                temporaryDirectory,
                "marketpilot.db",
              ),
            applyMigrations: false,
          });

        openDatabases.push(
          database,
        );

        const tables =
          database
            .prepare(`
              SELECT name
              FROM sqlite_master
              WHERE
                type = 'table'
                AND name NOT LIKE 'sqlite_%';
            `)
            .all();

        expect(
          tables,
        ).toEqual([]);
      },
    );

    function createTemporaryDirectory():
      string {
      const directory =
        mkdtempSync(
          path.join(
            tmpdir(),
            "marketpilot-migration-integration-",
          ),
        );

      temporaryDirectories.push(
        directory,
      );

      return directory;
    }
  },
);
