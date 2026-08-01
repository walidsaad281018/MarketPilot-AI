import path from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MARKETPILOT_DATABASE_PATH_ENV,
  resolveMarketPilotDatabasePath,
} from "@/lib/database/databasePaths";

describe(
  "resolveMarketPilotDatabasePath",
  () => {
    it(
      "resolves the default repository-level database path",
      () => {
        const workingDirectory =
          path.join(
            "C:",
            "Projects",
            "MarketPilot-AI",
            "apps",
            "web",
          );

        const result =
          resolveMarketPilotDatabasePath(
            {},
            workingDirectory,
          );

        expect(result).toBe(
          path.resolve(
            workingDirectory,
            "..",
            "..",
            "database",
            "marketpilot.db",
          ),
        );
      },
    );

    it(
      "uses an absolute configured database path",
      () => {
        const configuredPath =
          path.resolve(
            "temporary",
            "custom-marketpilot.db",
          );

        const result =
          resolveMarketPilotDatabasePath(
            {
              [MARKETPILOT_DATABASE_PATH_ENV]:
                configuredPath,
            },
            process.cwd(),
          );

        expect(result).toBe(
          configuredPath,
        );
      },
    );

    it(
      "resolves a relative configured path from the working directory",
      () => {
        const workingDirectory =
          path.resolve(
            "temporary",
            "application",
          );

        const result =
          resolveMarketPilotDatabasePath(
            {
              [MARKETPILOT_DATABASE_PATH_ENV]:
                "./data/test.db",
            },
            workingDirectory,
          );

        expect(result).toBe(
          path.resolve(
            workingDirectory,
            "data",
            "test.db",
          ),
        );
      },
    );

    it(
      "ignores an empty configured path",
      () => {
        const workingDirectory =
          path.resolve(
            "temporary",
            "apps",
            "web",
          );

        const result =
          resolveMarketPilotDatabasePath(
            {
              [MARKETPILOT_DATABASE_PATH_ENV]:
                "   ",
            },
            workingDirectory,
          );

        expect(result).toBe(
          path.resolve(
            workingDirectory,
            "..",
            "..",
            "database",
            "marketpilot.db",
          ),
        );
      },
    );
  },
);
