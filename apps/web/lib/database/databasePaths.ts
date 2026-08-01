import path from "node:path";

export const MARKETPILOT_DATABASE_PATH_ENV =
  "MARKETPILOT_DATABASE_PATH";

export type DatabasePathEnvironment =
  Readonly<Record<string, string | undefined>>;

export function resolveMarketPilotDatabasePath(
  environment: DatabasePathEnvironment = process.env,
  workingDirectory: string = process.cwd(),
): string {
  const configuredPath =
    environment[
      MARKETPILOT_DATABASE_PATH_ENV
    ]?.trim();

  if (configuredPath) {
    return path.resolve(
      workingDirectory,
      configuredPath,
    );
  }

  return path.resolve(
    workingDirectory,
    "..",
    "..",
    "database",
    "marketpilot.db",
  );
}