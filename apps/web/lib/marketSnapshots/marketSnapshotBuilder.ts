import {
  randomUUID,
} from "node:crypto";

import {
  createLiveMarketDataMetadata,
} from "@/lib/market/marketDataMetadata";
import type {
  MarketSnapshot,
  MarketSnapshotCategory,
} from "@/lib/marketSnapshots/marketSnapshot";
import type {
  MarketCategory,
  MarketQuote,
} from "@/lib/providers/marketProvider";

export type BuildMarketSnapshotOptions = {
  quote: MarketQuote;
  capturedAt?: Date;
  snapshotId?: string;
};

export function buildMarketSnapshot({
  quote,
  capturedAt = new Date(),
  snapshotId,
}: BuildMarketSnapshotOptions):
  MarketSnapshot {
  validateQuote(
    quote,
  );

  const normalizedCapturedAt =
    normalizeDate(
      capturedAt,
      "Snapshot capture time",
    );

  const metadata =
    createLiveMarketDataMetadata({
      source: quote.source,
      lastUpdated:
        quote.lastUpdated,
      currentTime:
        capturedAt,
    });

  return {
    id:
      snapshotId ??
      createMarketSnapshotId(
        quote.symbol,
        normalizedCapturedAt,
      ),
    symbol:
      normalizeSymbol(
        quote.symbol,
      ),
    category:
      normalizeCategory(
        quote.category,
      ),
    capturedAt:
      normalizedCapturedAt,
    price:
      roundNumber(
        quote.price,
        getPriceDecimalPlaces(
          quote.price,
        ),
      ),
    priceChange24h:
      roundNumber(
        quote.priceChange24h,
        4,
      ),
    volume24hUsd:
      roundNumber(
        quote.volume24hUsd,
        2,
      ),
    marketCapUsd:
      quote.marketCapUsd ===
      undefined
        ? null
        : roundNumber(
            quote.marketCapUsd,
            2,
          ),
    volatility24h:
      roundNumber(
        quote.volatility24h,
        4,
      ),
    dataSource:
      metadata.dataSource,
    source:
      metadata.source,
    providerTimestamp:
      metadata.lastUpdated,
    isStale:
      metadata.isStale,
  };
}

export function createMarketSnapshotId(
  symbol: string,
  capturedAt:
    string = new Date().toISOString(),
): string {
  const normalizedSymbol =
    normalizeSymbol(
      symbol,
    ).replace(
      /[^A-Z0-9]/g,
      "",
    );

  const normalizedTimestamp =
    normalizeTimestamp(
      capturedAt,
    )
      .replace(
        /[-:.TZ]/g,
        "",
      )
      .slice(
        0,
        14,
      );

  const uniquePart =
    randomUUID()
      .split("-")[0]
      .toUpperCase();

  return [
    "MS",
    normalizedTimestamp,
    normalizedSymbol,
    uniquePart,
  ].join("-");
}

function validateQuote(
  quote: MarketQuote,
): void {
  normalizeSymbol(
    quote.symbol,
  );

  validatePositiveNumber(
    quote.price,
    "Market price",
  );

  validateFiniteNumber(
    quote.priceChange24h,
    "24-hour price change",
  );

  validateNonNegativeNumber(
    quote.volume24hUsd,
    "24-hour volume",
  );

  validateNonNegativeNumber(
    quote.volatility24h,
    "24-hour volatility",
  );

  if (
    quote.marketCapUsd !==
    undefined
  ) {
    validateNonNegativeNumber(
      quote.marketCapUsd,
      "Market capitalization",
    );
  }

  if (
    quote.source.trim()
      .length === 0
  ) {
    throw new Error(
      "Market data source is required.",
    );
  }

  normalizeTimestamp(
    quote.lastUpdated,
  );
}

function normalizeSymbol(
  symbol: string,
): string {
  const normalizedSymbol =
    symbol
      .trim()
      .toUpperCase();

  if (
    normalizedSymbol.length ===
    0
  ) {
    throw new Error(
      "Market snapshot symbol is required.",
    );
  }

  return normalizedSymbol;
}

function normalizeCategory(
  category: MarketCategory,
): MarketSnapshotCategory {
  switch (category) {
    case "crypto":
      return "Crypto";

    case "stock":
      return "Stock";

    case "etf":
      return "ETF";
  }
}

function normalizeDate(
  value: Date,
  fieldName: string,
): string {
  if (
    !Number.isFinite(
      value.getTime(),
    )
  ) {
    throw new Error(
      `${fieldName} must be valid.`,
    );
  }

  return value.toISOString();
}

function normalizeTimestamp(
  value: string,
): string {
  const normalizedValue =
    value.trim();

  if (
    normalizedValue.length ===
      0 ||
    !Number.isFinite(
      Date.parse(
        normalizedValue,
      ),
    )
  ) {
    throw new Error(
      "Market provider timestamp must be valid.",
    );
  }

  return new Date(
    normalizedValue,
  ).toISOString();
}

function validatePositiveNumber(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${fieldName} must be a positive finite number.`,
    );
  }
}

function validateNonNegativeNumber(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${fieldName} must be a non-negative finite number.`,
    );
  }
}

function validateFiniteNumber(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isFinite(value)
  ) {
    throw new Error(
      `${fieldName} must be a finite number.`,
    );
  }
}

function getPriceDecimalPlaces(
  price: number,
): number {
  return price < 1
    ? 8
    : 2;
}

function roundNumber(
  value: number,
  decimalPlaces: number,
): number {
  const multiplier =
    10 ** decimalPlaces;

  return (
    Math.round(
      (
        value +
        Number.EPSILON
      ) * multiplier,
    ) / multiplier
  );
}
