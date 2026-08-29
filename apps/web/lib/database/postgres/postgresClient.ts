import postgres, {
  type Sql,
} from "postgres";

export const MARKETPILOT_DATABASE_URL_ENV =
  "DATABASE_URL";

export type PostgresEnvironment =
  Readonly<
    Record<
      string,
      string | undefined
    >
  >;

export function resolvePostgresDatabaseUrl(
  environment:
    PostgresEnvironment = process.env,
): string {
  const databaseUrl =
    environment[
      MARKETPILOT_DATABASE_URL_ENV
    ]?.trim();

  if (!databaseUrl) {
    throw new Error(
      `${MARKETPILOT_DATABASE_URL_ENV} is required for PostgreSQL persistence.`,
    );
  }

  return databaseUrl;
}

export type CreatePostgresClientOptions = {
  databaseUrl?: string;
  environment?: PostgresEnvironment;
};

export function createPostgresClient({
  databaseUrl,
  environment = process.env,
}: CreatePostgresClientOptions = {}):
  Sql {
  const resolvedDatabaseUrl =
    databaseUrl?.trim() ||
    resolvePostgresDatabaseUrl(
      environment,
    );

  return postgres(
    resolvedDatabaseUrl,
    {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    },
  );
}
