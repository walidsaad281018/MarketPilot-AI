import {
  resolveMarketPilotDatabasePath,
} from "@/lib/database/databasePaths";
import {
  createPostgresClient,
  type PostgresEnvironment,
} from "@/lib/database/postgres/postgresClient";
import {
  PostgresRecommendationRepository,
} from "@/lib/database/postgres/postgresRecommendationRepository";
import {
  openSqliteDatabase,
} from "@/lib/database/sqliteDatabaseFactory";
import {
  SqliteRecommendationRepository,
} from "@/lib/recommendations/sqliteRecommendationRepository";

export type CreateRecommendationRepositoryOptions = {
  databasePath?: string;
};

export function createSqliteRecommendationRepository({
  databasePath =
    resolveMarketPilotDatabasePath(),
}: CreateRecommendationRepositoryOptions = {}):
  SqliteRecommendationRepository {
  const database =
    openSqliteDatabase({
      databasePath,
    });

  try {
    return new SqliteRecommendationRepository(
      database,
    );
  } catch (error) {
    if (database.isOpen) {
      database.close();
    }

    throw error;
  }
}


export type CreatePostgresRecommendationRepositoryOptions = {
  databaseUrl?: string;
  environment?: PostgresEnvironment;
};

export function createPostgresRecommendationRepository({
  databaseUrl,
  environment,
}: CreatePostgresRecommendationRepositoryOptions = {}):
  PostgresRecommendationRepository {
  const sql =
    createPostgresClient({
      databaseUrl,
      environment,
    });

  return new PostgresRecommendationRepository(
    sql,
  );
}
