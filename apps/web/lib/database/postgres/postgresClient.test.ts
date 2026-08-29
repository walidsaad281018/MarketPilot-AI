import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPostgresClient,
  resolvePostgresDatabaseUrl,
} from "@/lib/database/postgres/postgresClient";

describe(
  "resolvePostgresDatabaseUrl",
  () => {
    it(
      "returns the configured DATABASE_URL",
      () => {
        expect(
          resolvePostgresDatabaseUrl({
            DATABASE_URL:
              "postgresql://user:password@example.com:5432/marketpilot",
          }),
        ).toBe(
          "postgresql://user:password@example.com:5432/marketpilot",
        );
      },
    );

    it(
      "trims the configured DATABASE_URL",
      () => {
        expect(
          resolvePostgresDatabaseUrl({
            DATABASE_URL:
              "  postgresql://example.test/marketpilot  ",
          }),
        ).toBe(
          "postgresql://example.test/marketpilot",
        );
      },
    );

    it(
      "throws when DATABASE_URL is missing",
      () => {
        expect(
          () =>
            resolvePostgresDatabaseUrl(
              {},
            ),
        ).toThrow(
          "DATABASE_URL is required for PostgreSQL persistence.",
        );
      },
    );
  },
);

describe(
  "createPostgresClient",
  () => {
    it(
      "creates a client without opening a connection eagerly",
      async () => {
        const sql =
          createPostgresClient({
            databaseUrl:
              "postgresql://user:password@127.0.0.1:1/marketpilot",
          });

        expect(
          typeof sql,
        ).toBe(
          "function",
        );

        await sql.end({
          timeout: 0,
        });
      },
    );
  },
);
