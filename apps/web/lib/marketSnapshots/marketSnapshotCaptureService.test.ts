import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  MarketSnapshot,
} from "@/lib/marketSnapshots/marketSnapshot";
import {
  MarketSnapshotCaptureService,
} from "@/lib/marketSnapshots/marketSnapshotCaptureService";
import type {
  MarketSnapshotRepository,
} from "@/lib/marketSnapshots/marketSnapshotRepository";
import type {
  MarketQuote,
} from "@/lib/providers/marketProvider";

function createQuote(
  overrides:
    Partial<MarketQuote> = {},
): MarketQuote {
  return {
    symbol: "BTC",
    category: "crypto",
    price: 100_000,
    priceChange24h: 3,
    volume24hUsd:
      5_000_000_000,
    marketCapUsd:
      1_900_000_000_000,
    volatility24h: 5.25,
    lastUpdated:
      "2026-08-05T11:59:30.000Z",
    source: "CoinGecko",
    ...overrides,
  };
}

class RecordingMarketSnapshotRepository
  implements MarketSnapshotRepository
{
  readonly savedSnapshots:
    MarketSnapshot[] = [];

  getAll(): MarketSnapshot[] {
    return this.savedSnapshots.map(
      cloneSnapshot,
    );
  }

  getById(
    snapshotId: string,
  ): MarketSnapshot | undefined {
    const snapshot =
      this.savedSnapshots.find(
        (candidate) =>
          candidate.id ===
          snapshotId,
      );

    return snapshot
      ? cloneSnapshot(snapshot)
      : undefined;
  }

  getBySymbol(
    symbol: string,
  ): MarketSnapshot[] {
    const normalizedSymbol =
      symbol
        .trim()
        .toUpperCase();

    return this.savedSnapshots
      .filter(
        (snapshot) =>
          snapshot.symbol ===
          normalizedSymbol,
      )
      .map(
        cloneSnapshot,
      );
  }

  getByCategory(
    category:
      MarketSnapshot["category"],
  ): MarketSnapshot[] {
    return this.savedSnapshots
      .filter(
        (snapshot) =>
          snapshot.category ===
          category,
      )
      .map(
        cloneSnapshot,
      );
  }

  getLatestBySymbol(
    symbol: string,
  ): MarketSnapshot | undefined {
    return this.getBySymbol(
      symbol,
    ).at(-1);
  }

  save(
    snapshot: MarketSnapshot,
  ): MarketSnapshot {
    return this.saveMany([
      snapshot,
    ])[0]!;
  }

  saveMany(
    snapshots:
      MarketSnapshot[],
  ): MarketSnapshot[] {
    const copies =
      snapshots.map(
        cloneSnapshot,
      );

    this.savedSnapshots.push(
      ...copies,
    );

    return copies.map(
      cloneSnapshot,
    );
  }
}

describe(
  "MarketSnapshotCaptureService",
  () => {
    it(
      "returns an empty result for an empty quote batch",
      () => {
        const repository =
          new RecordingMarketSnapshotRepository();

        const service =
          new MarketSnapshotCaptureService({
            repository,
          });

        expect(
          service.capture({
            quotes: [],
          }),
        ).toEqual({
          capturedSnapshots: [],
          capturedCount: 0,
        });

        expect(
          repository.savedSnapshots,
        ).toEqual([]);
      },
    );

    it(
      "builds and persists snapshots",
      () => {
        const repository =
          new RecordingMarketSnapshotRepository();

        const service =
          new MarketSnapshotCaptureService({
            repository,
          });

        const result =
          service.capture({
            quotes: [
              createQuote(),
              createQuote({
                symbol: "ETH",
                price: 4_000,
                marketCapUsd:
                  480_000_000_000,
              }),
            ],
            capturedAt:
              new Date(
                "2026-08-05T12:00:00.000Z",
              ),
          });

        expect(
          result.capturedCount,
        ).toBe(2);

        expect(
          result.capturedSnapshots.map(
            (snapshot) =>
              snapshot.symbol,
          ),
        ).toEqual([
          "BTC",
          "ETH",
        ]);

        expect(
          repository.savedSnapshots,
        ).toHaveLength(2);
      },
    );

    it(
      "uses the same capture timestamp for the complete batch",
      () => {
        const repository =
          new RecordingMarketSnapshotRepository();

        const service =
          new MarketSnapshotCaptureService({
            repository,
          });

        const result =
          service.capture({
            quotes: [
              createQuote(),
              createQuote({
                symbol: "ETH",
              }),
            ],
            capturedAt:
              new Date(
                "2026-08-05T12:00:00.000Z",
              ),
          });

        expect(
          new Set(
            result.capturedSnapshots.map(
              (snapshot) =>
                snapshot.capturedAt,
            ),
          ),
        ).toEqual(
          new Set([
            "2026-08-05T12:00:00.000Z",
          ]),
        );
      },
    );

    it(
      "rejects duplicate quote keys before saving",
      () => {
        const repository =
          new RecordingMarketSnapshotRepository();

        const service =
          new MarketSnapshotCaptureService({
            repository,
          });

        expect(() =>
          service.capture({
            quotes: [
              createQuote(),
              createQuote({
                symbol: "btc",
              }),
            ],
          }),
        ).toThrow(
          "Duplicate market quote in snapshot capture batch: btc.",
        );

        expect(
          repository.savedSnapshots,
        ).toEqual([]);
      },
    );
  },
);

function cloneSnapshot(
  snapshot: MarketSnapshot,
): MarketSnapshot {
  return {
    ...snapshot,
  };
}
