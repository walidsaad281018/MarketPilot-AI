import {
  resolveMarketPilotDatabasePath,
} from "@/lib/database/databasePaths";
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
