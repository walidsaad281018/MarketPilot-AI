import {
  buildMarketSnapshot,
} from "@/lib/marketSnapshots/marketSnapshotBuilder";
import type {
  MarketSnapshot,
} from "@/lib/marketSnapshots/marketSnapshot";
import type {
  MarketSnapshotRepository,
} from "@/lib/marketSnapshots/marketSnapshotRepository";
import type {
  MarketQuote,
} from "@/lib/providers/marketProvider";

export type CaptureMarketSnapshotsOptions = {
  quotes: MarketQuote[];
  capturedAt?: Date;
};

export type CaptureMarketSnapshotsResult = {
  capturedSnapshots:
    MarketSnapshot[];
  capturedCount: number;
};

export type MarketSnapshotCaptureServiceDependencies = {
  repository:
    MarketSnapshotRepository;
};

export class MarketSnapshotCaptureService {
  private readonly repository:
    MarketSnapshotRepository;

  constructor({
    repository,
  }: MarketSnapshotCaptureServiceDependencies) {
    this.repository =
      repository;
  }

  async capture({
    quotes,
    capturedAt = new Date(),
  }: CaptureMarketSnapshotsOptions):
    Promise<CaptureMarketSnapshotsResult> {
    if (
      quotes.length === 0
    ) {
      return {
        capturedSnapshots: [],
        capturedCount: 0,
      };
    }

    validateUniqueQuotes(
      quotes,
    );

    const snapshots =
      quotes.map(
        (quote) =>
          buildMarketSnapshot({
            quote,
            capturedAt,
          }),
      );

    const capturedSnapshots =
      await this.repository.saveMany(
        snapshots,
      );

    return {
      capturedSnapshots,
      capturedCount:
        capturedSnapshots.length,
    };
  }
}

function validateUniqueQuotes(
  quotes: MarketQuote[],
): void {
  const quoteKeys =
    new Set<string>();

  for (
    const quote
    of quotes
  ) {
    const key = [
      quote.category,
      quote.symbol
        .trim()
        .toUpperCase(),
      quote.source
        .trim()
        .toUpperCase(),
    ].join(":");

    if (
      quoteKeys.has(key)
    ) {
      throw new Error(
        `Duplicate market quote in snapshot capture batch: ${quote.symbol}.`,
      );
    }

    quoteKeys.add(key);
  }
}
