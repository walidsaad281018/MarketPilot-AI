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

type PendingVerificationService =
  Pick<
    PendingRecommendationVerificationService,
    "verifyPending"
  > &
  Partial<
    Pick<
      PendingRecommendationVerificationService,
      "getPendingRecommendations"
    >
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

    const candidateSymbols =
      candidates.map(
        (candidate) =>
          candidate.symbol,
      );

    const pendingRecommendations =
      await this.pendingVerificationService
        ?.getPendingRecommendations?.();

    const pendingCryptoSymbols =
      pendingRecommendations
        ?.filter(
          (recommendation) =>
            recommendation.category ===
            "Crypto",
        )
        .map(
          (recommendation) =>
            recommendation.symbol,
        ) ??
      [];

    const capturedSymbols =
      await this.captureMarketSnapshots(
        candidateSymbols,
        pendingCryptoSymbols,
      );

    if (
      this.pendingVerificationService
    ) {
      if (
        pendingRecommendations ===
          undefined ||
        capturedSymbols === undefined
      ) {
        await this.pendingVerificationService
          .verifyPending();
      } else {
        await this.pendingVerificationService
          .verifyPending({
            symbols:
              capturedSymbols,
          });
      }
    }

    if (
      candidates.length === 0
    ) {
      return {
        publishedRecords: [],
        publishedCount: 0,
      };
    }

    return this.publisher.publish(
      candidates,
    );
  }

  private async captureMarketSnapshots(
    candidateSymbols: string[],
    pendingSymbols: string[],
  ): Promise<string[] | undefined> {
    if (
      !this.snapshotCaptureService ||
      !this.marketProvider
    ) {
      return undefined;
    }

    const requiredSymbols =
      normalizeUniqueSymbols(
        candidateSymbols,
      );

    const requiredSymbolSet =
      new Set(
        requiredSymbols,
      );

    const optionalSymbols =
      normalizeUniqueSymbols(
        pendingSymbols,
      ).filter(
        (symbol) =>
          !requiredSymbolSet.has(
            symbol,
          ),
      );

    const requestedSymbols = [
      ...requiredSymbols,
      ...optionalSymbols,
    ];

    if (
      requestedSymbols.length === 0
    ) {
      return [];
    }

    const quotes =
      await this.marketProvider.getQuotes(
        requestedSymbols,
      );

    const receivedSymbols =
      normalizeUniqueSymbols(
        quotes.map(
          (quote) =>
            quote.symbol,
        ),
      );

    validateSnapshotQuotes(
      requiredSymbols,
      receivedSymbols,
    );

    if (
      quotes.length === 0
    ) {
      return [];
    }

    await this.snapshotCaptureService.capture({
      quotes,
      capturedAt:
        new Date(),
    });

    return receivedSymbols;
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
  requiredSymbols: string[],
  receivedSymbols: string[],
): void {
  const receivedSymbolSet =
    new Set(
      receivedSymbols,
    );

  const missingSymbols =
    requiredSymbols.filter(
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
