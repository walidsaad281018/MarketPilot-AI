import {
  resolveMarketPilotDatabasePath,
} from "@/lib/database/databasePaths";
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
