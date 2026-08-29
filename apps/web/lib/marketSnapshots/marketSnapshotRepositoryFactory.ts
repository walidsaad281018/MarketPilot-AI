import {
  resolveMarketPilotDatabasePath,
} from "@/lib/database/databasePaths";
import {
  createPostgresClient,
  type PostgresEnvironment,
} from "@/lib/database/postgres/postgresClient";
import {
  PostgresMarketSnapshotRepository,
} from "@/lib/database/postgres/postgresMarketSnapshotRepository";
import {
  openSqliteDatabase,
} from "@/lib/database/sqliteDatabaseFactory";
import {
  SqliteMarketSnapshotRepository,
} from "@/lib/marketSnapshots/sqliteMarketSnapshotRepository";

export type CreateMarketSnapshotRepositoryOptions = {
  databasePath?: string;
};

export function createSqliteMarketSnapshotRepository({
  databasePath =
    resolveMarketPilotDatabasePath(),
}: CreateMarketSnapshotRepositoryOptions = {}):
  SqliteMarketSnapshotRepository {
  const database =
    openSqliteDatabase({
      databasePath,
    });

  try {
    return new SqliteMarketSnapshotRepository(
      database,
    );
  } catch (error) {
    if (database.isOpen) {
      database.close();
    }

    throw error;
  }
}


export type CreatePostgresMarketSnapshotRepositoryOptions = {
  databaseUrl?: string;
  environment?: PostgresEnvironment;
};

export function createPostgresMarketSnapshotRepository({
  databaseUrl,
  environment,
}: CreatePostgresMarketSnapshotRepositoryOptions = {}):
  PostgresMarketSnapshotRepository {
  const sql =
    createPostgresClient({
      databaseUrl,
      environment,
    });

  return new PostgresMarketSnapshotRepository(
    sql,
  );
}
