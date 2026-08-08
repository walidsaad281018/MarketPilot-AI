import {
  MarketSnapshotCaptureService,
} from "@/lib/marketSnapshots/marketSnapshotCaptureService";
import {
  createSqliteMarketSnapshotRepository,
} from "@/lib/marketSnapshots/marketSnapshotRepositoryFactory";
import type {
  SqliteMarketSnapshotRepository,
} from "@/lib/marketSnapshots/sqliteMarketSnapshotRepository";
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
  createSqliteRecommendationRepository,
} from "@/lib/recommendations/recommendationRepositoryFactory";
import {
  RecommendationSeedService,
  type SeedRecommendationsResult,
} from "@/lib/recommendations/recommendationSeedService";
import type {
  SqliteRecommendationRepository,
} from "@/lib/recommendations/sqliteRecommendationRepository";
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

export type CreateApplicationCompositionOptions = {
  databasePath?: string;
  seedDatabase?: boolean;
};

export type ApplicationComposition = {
  repository:
    SqliteRecommendationRepository;

  marketSnapshotRepository:
    SqliteMarketSnapshotRepository;

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
    SeedRecommendationsResult | null;

  close: () => void;
};

export function createApplicationComposition({
  databasePath,
  seedDatabase = true,
}: CreateApplicationCompositionOptions = {}):
  ApplicationComposition {
  const repository =
    createSqliteRecommendationRepository({
      databasePath,
    });

  let marketSnapshotRepository:
    SqliteMarketSnapshotRepository |
    undefined;

  try {
    marketSnapshotRepository =
      createSqliteMarketSnapshotRepository({
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
      close: () => {
        marketSnapshotRepository?.close();
        repository.close();
      },
    };
  } catch (error) {
    marketSnapshotRepository?.close();
    repository.close();

    throw error;
  }
}

