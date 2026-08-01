import {
  mkdtempSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  spawnSync,
  type SpawnSyncReturns,
} from "node:child_process";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

const temporaryDirectories:
  string[] = [];

afterEach(() => {
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
  "application SQLite persistence",
  () => {
    it(
      "retains a published recommendation across separate Node.js processes",
      () => {
        const temporaryDirectory =
          mkdtempSync(
            join(
              tmpdir(),
              "marketpilot-persistence-",
            ),
          );

        temporaryDirectories.push(
          temporaryDirectory,
        );

        const databasePath =
          join(
            temporaryDirectory,
            "marketpilot.sqlite",
          );

        const writeProcess =
          runPersistenceProbe(
            "write",
            databasePath,
          );

        expectProcessToSucceed(
          writeProcess,
        );

        const writeResult =
          parseProcessOutput<{
            operation: "write";
            publishedCount: number;
            recommendation: {
              id: string;
              symbol: string;
              status: string;
            } | null;
          }>(
            writeProcess,
          );

        expect(
          writeResult.operation,
        ).toBe("write");

        expect(
          writeResult.publishedCount,
        ).toBe(1);

        expect(
          writeResult.recommendation,
        ).toMatchObject({
          id:
            "MP-PERSISTENCE-0001",
          symbol: "PST",
          status: "Pending",
        });

        const readProcess =
          runPersistenceProbe(
            "read",
            databasePath,
          );

        expectProcessToSucceed(
          readProcess,
        );

        const readResult =
          parseProcessOutput<{
            operation: "read";
            found: boolean;
            recommendation: {
              id: string;
              symbol: string;
              status: string;
            } | null;
          }>(
            readProcess,
          );

        expect(
          readResult.operation,
        ).toBe("read");

        expect(
          readResult.found,
        ).toBe(true);

        expect(
          readResult.recommendation,
        ).toMatchObject({
          id:
            "MP-PERSISTENCE-0001",
          symbol: "PST",
          status: "Pending",
        });
      },
      60_000,
    );
  },
);

type PersistenceOperation =
  | "write"
  | "read";

function runPersistenceProbe(
  operation: PersistenceOperation,
  databasePath: string,
): SpawnSyncReturns<string> {
  const tsxCliPath =
    join(
      process.cwd(),
      "node_modules",
      "tsx",
      "dist",
      "cli.mjs",
    );

  return spawnSync(
    process.execPath,
    [
      tsxCliPath,
      join(
        process.cwd(),
        "scripts",
        "persistenceProbe.ts",
      ),
      operation,
      databasePath,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    },
  );
}

function expectProcessToSucceed(
  result: SpawnSyncReturns<string>,
): void {
  expect(
    result.error,
  ).toBeUndefined();

  expect(
    result.status,
    createFailureMessage(result),
  ).toBe(0);
}

function parseProcessOutput<T>(
  result: SpawnSyncReturns<string>,
): T {
  expect(
    result.stdout.trim(),
    createFailureMessage(result),
  ).not.toBe("");

  return JSON.parse(
    result.stdout.trim(),
  ) as T;
}

function createFailureMessage(
  result: SpawnSyncReturns<string>,
): string {
  return [
    `Exit status: ${result.status}`,
    `STDOUT: ${result.stdout}`,
    `STDERR: ${result.stderr}`,
  ].join("\n");
}