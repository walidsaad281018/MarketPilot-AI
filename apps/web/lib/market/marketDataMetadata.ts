export type MarketDataSource =
  | "live"
  | "fallback";

export type MarketDataMetadata = {
  dataSource: MarketDataSource;
  source: string;
  lastUpdated: string | null;
  isStale: boolean;
};

export const LIVE_MARKET_SOURCE =
  "CoinGecko";

export const FALLBACK_MARKET_SOURCE =
  "MarketPilot Demo";

export const MARKET_DATA_STALE_AFTER_MS =
  5 * 60 * 1_000;

export type CreateLiveMarketDataMetadataOptions = {
  source?: string;
  lastUpdated: string;
  currentTime?: Date;
  staleAfterMs?: number;
};

export function createLiveMarketDataMetadata({
  source = LIVE_MARKET_SOURCE,
  lastUpdated,
  currentTime = new Date(),
  staleAfterMs =
    MARKET_DATA_STALE_AFTER_MS,
}: CreateLiveMarketDataMetadataOptions):
  MarketDataMetadata {
  validateSource(source);

  const normalizedLastUpdated =
    normalizeTimestamp(lastUpdated);

  validateStaleAfterMs(
    staleAfterMs,
  );

  return {
    dataSource: "live",
    source: source.trim(),
    lastUpdated:
      normalizedLastUpdated,
    isStale: isMarketDataStale({
      lastUpdated:
        normalizedLastUpdated,
      currentTime,
      staleAfterMs,
    }),
  };
}

export function createFallbackMarketDataMetadata():
  MarketDataMetadata {
  return {
    dataSource: "fallback",
    source:
      FALLBACK_MARKET_SOURCE,
    lastUpdated: null,
    isStale: false,
  };
}

export type IsMarketDataStaleOptions = {
  lastUpdated: string;
  currentTime?: Date;
  staleAfterMs?: number;
};

export function isMarketDataStale({
  lastUpdated,
  currentTime = new Date(),
  staleAfterMs =
    MARKET_DATA_STALE_AFTER_MS,
}: IsMarketDataStaleOptions):
  boolean {
  const normalizedLastUpdated =
    normalizeTimestamp(lastUpdated);

  validateStaleAfterMs(
    staleAfterMs,
  );

  const updatedAtMs =
    Date.parse(
      normalizedLastUpdated,
    );

  const currentTimeMs =
    currentTime.getTime();

  if (
    !Number.isFinite(
      currentTimeMs,
    )
  ) {
    throw new Error(
      "Current market-data time must be valid.",
    );
  }

  const ageMs =
    currentTimeMs -
    updatedAtMs;

  if (ageMs < 0) {
    return false;
  }

  return ageMs > staleAfterMs;
}

function normalizeTimestamp(
  value: string,
): string {
  const normalizedValue =
    value.trim();

  if (
    normalizedValue.length === 0 ||
    !Number.isFinite(
      Date.parse(
        normalizedValue,
      ),
    )
  ) {
    throw new Error(
      "Market-data last-updated timestamp must be valid.",
    );
  }

  return normalizedValue;
}

function validateSource(
  source: string,
): void {
  if (
    source.trim().length === 0
  ) {
    throw new Error(
      "Market-data source is required.",
    );
  }
}

function validateStaleAfterMs(
  staleAfterMs: number,
): void {
  if (
    !Number.isFinite(
      staleAfterMs,
    ) ||
    staleAfterMs < 0
  ) {
    throw new Error(
      "Market-data stale duration must be a non-negative number.",
    );
  }
}
