import {
  existsSync,
  mkdtempSync,
  rmSync,
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
  "openSqliteDatabase",
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

    function trackDatabase(
      database: DatabaseSync,
    ): DatabaseSync {
      openDatabases.push(
        database,
      );

      return database;
    }

    function createTemporaryDirectory():
      string {
      const directory =
        mkdtempSync(
          path.join(
            tmpdir(),
            "marketpilot-sqlite-",
          ),
        );

      temporaryDirectories.push(
        directory,
      );

      return directory;
    }

    it(
      "opens an in-memory SQLite database",
      () => {
        const database =
          trackDatabase(
            openSqliteDatabase({
              databasePath:
                ":memory:",
            }),
          );

        expect(
          database.isOpen,
        ).toBe(true);

        database.exec(`
          CREATE TABLE example (
            id INTEGER PRIMARY KEY
          );
        `);

        const row =
          database
            .prepare(`
              SELECT COUNT(*) AS count
              FROM example;
            `)
            .get() as {
              count: number;
            };

        expect(
          row.count,
        ).toBe(0);
      },
    );

    it(
      "creates missing parent directories for a file database",
      () => {
        const temporaryDirectory =
          createTemporaryDirectory();

        const databasePath =
          path.join(
            temporaryDirectory,
            "nested",
            "database",
            "marketpilot.db",
          );

        const database =
          trackDatabase(
            openSqliteDatabase({
              databasePath,
            }),
          );

        expect(
          database.isOpen,
        ).toBe(true);

        expect(
          existsSync(
            databasePath,
          ),
        ).toBe(true);
      },
    );

    it(
      "enables SQLite foreign-key enforcement",
      () => {
        const database =
          trackDatabase(
            openSqliteDatabase({
              databasePath:
                ":memory:",
            }),
          );

        const row =
          database
            .prepare(
              "PRAGMA foreign_keys;",
            )
            .get() as {
              foreign_keys: number;
            };

        expect(
          row.foreign_keys,
        ).toBe(1);
      },
    );

    it(
      "configures WAL mode for a file database",
      () => {
        const temporaryDirectory =
          createTemporaryDirectory();

        const databasePath =
          path.join(
            temporaryDirectory,
            "marketpilot.db",
          );

        const database =
          trackDatabase(
            openSqliteDatabase({
              databasePath,
            }),
          );

        const row =
          database
            .prepare(
              "PRAGMA journal_mode;",
            )
            .get() as {
              journal_mode: string;
            };

        expect(
          row.journal_mode.toLowerCase(),
        ).toBe("wal");
      },
    );
  },
);
