import {
  getLiveCryptoRecommendationCandidates,
  type GetLiveCryptoRecommendationCandidatesOptions,
} from "@/data/getLiveCryptoRecommendationCandidates";
import type {
  MarketSnapshotCaptureService,
} from "@/lib/marketSnapshots/marketSnapshotCaptureService";
import {
  recommendationPublisher,
  type PublishRecommendationsResult,
  type RecommendationPublisher,
} from "@/lib/recommendations/recommendationPublisher";
import type {
  MarketProvider,
} from "@/lib/providers/marketProvider";
import type {
  PendingRecommendationVerificationService,
} from "@/lib/services/pendingRecommendationVerificationService";

type CandidateGenerator =
  typeof getLiveCryptoRecommendationCandidates;

type Publisher = Pick<
  RecommendationPublisher,
  "publish"
>;

type SnapshotCaptureService = Pick<
  MarketSnapshotCaptureService,
  "capture"
>;

type QuoteProvider = Pick<
  MarketProvider,
  "getQuotes"
>;

type PendingVerificationService = Pick<
  PendingRecommendationVerificationService,
  "verifyPending"
>;

type LiveCryptoRecommendationPublicationDependencies = {
  candidateGenerator?: CandidateGenerator;
  publisher?: Publisher;
  snapshotCaptureService?:
    SnapshotCaptureService;
  marketProvider?: QuoteProvider;
  pendingVerificationService?:
    PendingVerificationService;
};

export class LiveCryptoRecommendationPublicationService {
  private readonly candidateGenerator:
    CandidateGenerator;

  private readonly publisher:
    Publisher;

  private readonly snapshotCaptureService:
    SnapshotCaptureService | undefined;

  private readonly marketProvider:
    QuoteProvider | undefined;

  private readonly pendingVerificationService:
    PendingVerificationService | undefined;

  constructor({
    candidateGenerator =
      getLiveCryptoRecommendationCandidates,
    publisher =
      recommendationPublisher,
    snapshotCaptureService,
    marketProvider,
    pendingVerificationService,
  }: LiveCryptoRecommendationPublicationDependencies = {}) {
    validateSnapshotDependencies(
      snapshotCaptureService,
      marketProvider,
    );

    this.candidateGenerator =
      candidateGenerator;

    this.publisher =
      publisher;

    this.snapshotCaptureService =
      snapshotCaptureService;

    this.marketProvider =
      marketProvider;

    this.pendingVerificationService =
      pendingVerificationService;
  }

  async publish(
    options:
      GetLiveCryptoRecommendationCandidatesOptions = {},
  ): Promise<PublishRecommendationsResult> {
    const candidates =
      await this.candidateGenerator(
        options,
      );

    if (
      candidates.length === 0
    ) {
      return {
        publishedRecords: [],
        publishedCount: 0,
      };
    }

    await this.captureMarketSnapshots(
      candidates.map(
        (candidate) =>
          candidate.symbol,
      ),
    );

    await this.pendingVerificationService
      ?.verifyPending();

    return this.publisher.publish(
      candidates,
    );
  }

  private async captureMarketSnapshots(
    symbols: string[],
  ): Promise<void> {
    if (
      !this.snapshotCaptureService ||
      !this.marketProvider
    ) {
      return;
    }

    const uniqueSymbols =
      normalizeUniqueSymbols(
        symbols,
      );

    const quotes =
      await this.marketProvider.getQuotes(
        uniqueSymbols,
      );

    validateSnapshotQuotes(
      uniqueSymbols,
      quotes.map(
        (quote) =>
          quote.symbol,
      ),
    );

    await this.snapshotCaptureService.capture({
      quotes,
      capturedAt:
        new Date(),
    });
  }
}

function validateSnapshotDependencies(
  snapshotCaptureService:
    SnapshotCaptureService | undefined,
  marketProvider:
    QuoteProvider | undefined,
): void {
  const hasCaptureService =
    snapshotCaptureService !==
    undefined;

  const hasMarketProvider =
    marketProvider !==
    undefined;

  if (
    hasCaptureService !==
    hasMarketProvider
  ) {
    throw new Error(
      "Snapshot capture service and market provider must be configured together.",
    );
  }
}

function normalizeUniqueSymbols(
  symbols: string[],
): string[] {
  return Array.from(
    new Set(
      symbols
        .map(
          (symbol) =>
            symbol
              .trim()
              .toUpperCase(),
        )
        .filter(
          (symbol) =>
            symbol.length > 0,
        ),
    ),
  );
}

function validateSnapshotQuotes(
  requestedSymbols: string[],
  receivedSymbols: string[],
): void {
  const receivedSymbolSet =
    new Set(
      receivedSymbols.map(
        (symbol) =>
          symbol
            .trim()
            .toUpperCase(),
      ),
    );

  const missingSymbols =
    requestedSymbols.filter(
      (symbol) =>
        !receivedSymbolSet.has(
          symbol,
        ),
    );

  if (
    missingSymbols.length > 0
  ) {
    throw new Error(
      `Unable to capture market snapshots for: ${missingSymbols.join(", ")}.`,
    );
  }
}

type ProductionPublicationService = Pick<
  LiveCryptoRecommendationPublicationService,
  "publish"
>;

export const liveCryptoRecommendationPublicationService:
  ProductionPublicationService = {
    async publish(
      options:
        GetLiveCryptoRecommendationCandidatesOptions = {},
    ): Promise<PublishRecommendationsResult> {
      const {
        productionApplication,
      } = await import(
        "@/lib/application/productionApplication"
      );

      return productionApplication
        .liveCryptoRecommendationPublicationService
        .publish(options);
    },
  };
