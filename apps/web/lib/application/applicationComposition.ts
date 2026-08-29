import {
  MarketSnapshotCaptureService,
} from "@/lib/marketSnapshots/marketSnapshotCaptureService";
import {
  createPostgresMarketSnapshotRepository,
  createSqliteMarketSnapshotRepository,
} from "@/lib/marketSnapshots/marketSnapshotRepositoryFactory";
import type {
  MarketSnapshotRepository,
} from "@/lib/marketSnapshots/marketSnapshotRepository";
import {
  cryptoProvider,
} from "@/lib/providers/marketProvider";
import {
  LiveCryptoRecommendationPublicationService,
} from "@/lib/recommendations/liveCryptoRecommendationPublicationService";
import {
  RecommendationPublisher,
} from "@/lib/recommendations/recommendationPublisher";
import {
  createPostgresRecommendationRepository,
  createSqliteRecommendationRepository,
} from "@/lib/recommendations/recommendationRepositoryFactory";
import {
  RecommendationSeedService,
  type SeedRecommendationsResult,
} from "@/lib/recommendations/recommendationSeedService";
import type {
  RecommendationWriteDataSource,
} from "@/lib/recommendations/recommendationDataSource";
import type {
  PersistenceLifecycle,
} from "@/lib/application/persistenceLifecycle";
import {
  RecommendationService,
} from "@/lib/services/api/recommendationServiceCore";
import {
  RecommendationHistoryService,
} from "@/lib/services/recommendationHistoryService";
import {
  RecommendationVerificationService,
} from "@/lib/services/recommendationVerificationService";
import {
  PendingRecommendationVerificationService,
} from "@/lib/services/pendingRecommendationVerificationService";

export type ApplicationPersistence =
  | "sqlite"
  | "postgres";

export type CreateApplicationCompositionOptions = {
  persistence?: ApplicationPersistence;
  databasePath?: string;
  databaseUrl?: string;
  seedDatabase?: boolean;
};

export type ApplicationComposition = {
  repository:
    RecommendationWriteDataSource &
    PersistenceLifecycle;

  marketSnapshotRepository:
    MarketSnapshotRepository &
    PersistenceLifecycle;

  marketSnapshotCaptureService:
    MarketSnapshotCaptureService;

  recommendationHistoryService:
    RecommendationHistoryService;

  recommendationService:
    RecommendationService;

  recommendationPublisher:
    RecommendationPublisher;

  recommendationVerificationService:
    RecommendationVerificationService;

  pendingRecommendationVerificationService:
    PendingRecommendationVerificationService;

  liveCryptoRecommendationPublicationService:
    LiveCryptoRecommendationPublicationService;

  seedResult:
    Promise<SeedRecommendationsResult> | null;

  close: () => Promise<void>;
};

export function createApplicationComposition({
  persistence = "sqlite",
  databasePath,
  databaseUrl,
  seedDatabase = true,
}: CreateApplicationCompositionOptions = {}):
  ApplicationComposition {
  const repository =
    persistence === "postgres"
      ? createPostgresRecommendationRepository({
          databaseUrl,
        })
      : createSqliteRecommendationRepository({
          databasePath,
        });

  let marketSnapshotRepository:
    (MarketSnapshotRepository &
      PersistenceLifecycle) |
    undefined;

  try {
    marketSnapshotRepository =
      persistence === "postgres"
        ? createPostgresMarketSnapshotRepository({
            databaseUrl,
          })
        : createSqliteMarketSnapshotRepository({
            databasePath,
          });

    const seedResult =
      seedDatabase
        ? new RecommendationSeedService({
            repository,
          }).seedIfEmpty()
        : null;

    const marketSnapshotCaptureService =
      new MarketSnapshotCaptureService({
        repository:
          marketSnapshotRepository,
      });

    const recommendationHistoryService =
      new RecommendationHistoryService(
        repository,
      );

    const recommendationService =
      new RecommendationService({
        historyService:
          recommendationHistoryService,
      });

    const recommendationPublisher =
      new RecommendationPublisher({
        repository,
      });

    const recommendationVerificationService =
      new RecommendationVerificationService(
        marketSnapshotRepository,
      );

    const pendingRecommendationVerificationService =
      new PendingRecommendationVerificationService({
        repository,
        verificationService:
          recommendationVerificationService,
      });

    const liveCryptoRecommendationPublicationService =
      new LiveCryptoRecommendationPublicationService({
        publisher:
          recommendationPublisher,
        snapshotCaptureService:
          marketSnapshotCaptureService,
        marketProvider:
          cryptoProvider,
        pendingVerificationService:
          pendingRecommendationVerificationService,
      });

    return {
      repository,
      marketSnapshotRepository,
      marketSnapshotCaptureService,
      recommendationHistoryService,
      recommendationService,
      recommendationPublisher,
      recommendationVerificationService,
      pendingRecommendationVerificationService,
      liveCryptoRecommendationPublicationService,
      seedResult,
      close: async () => {
        await marketSnapshotRepository?.close();
        await repository.close();
      },
    };
  } catch (error) {
    marketSnapshotRepository?.close();
    repository.close();

    throw error;
  }
}

