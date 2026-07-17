export type CryptoPrice = {
  usd: number;
  usd_24h_change: number;
};

export type CryptoPriceResponse = Record<
  string,
  CryptoPrice
>;

export type MarketChartPoint = [
  timestamp: number,
  value: number,
];

export type CryptoMarketChartResponse = {
  prices: MarketChartPoint[];
  market_caps: MarketChartPoint[];
  total_volumes: MarketChartPoint[];
};

type CacheEntry<T> = {
  data: T;
  savedAt: number;
};

type CoinGeckoCache = {
  prices: Map<
    string,
    CacheEntry<CryptoPriceResponse>
  >;
  charts: Map<
    string,
    CacheEntry<CryptoMarketChartResponse>
  >;
};

const COINGECKO_BASE_URL =
  "https://api.coingecko.com/api/v3";

const PRICE_CACHE_DURATION_MS = 60_000;
const CHART_CACHE_DURATION_MS = 5 * 60_000;

const PRICE_REVALIDATION_SECONDS = 60;
const CHART_REVALIDATION_SECONDS = 300;

const globalForCoinGecko = globalThis as typeof globalThis & {
  coinGeckoCache?: CoinGeckoCache;
};

const cache: CoinGeckoCache =
  globalForCoinGecko.coinGeckoCache ?? {
    prices: new Map(),
    charts: new Map(),
  };

globalForCoinGecko.coinGeckoCache = cache;

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function isFresh<T>(
  entry: CacheEntry<T> | undefined,
  durationMs: number,
): entry is CacheEntry<T> {
  if (!entry) {
    return false;
  }

  return Date.now() - entry.savedAt < durationMs;
}

function createHeaders(): HeadersInit {
  const demoApiKey =
    process.env.COINGECKO_DEMO_API_KEY;

  if (!demoApiKey) {
    return {
      Accept: "application/json",
    };
  }

  return {
    Accept: "application/json",
    "x-cg-demo-api-key": demoApiKey,
  };
}

async function fetchCoinGeckoJson<T>(
  url: string,
  revalidationSeconds: number,
): Promise<T> {
  const maximumAttempts = 3;

  for (
    let attempt = 0;
    attempt < maximumAttempts;
    attempt += 1
  ) {
    const response = await fetch(url, {
      headers: createHeaders(),
      next: {
        revalidate: revalidationSeconds,
      },
    });

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    if (response.status !== 429) {
      throw new Error(
        `CoinGecko request failed with status ${response.status}`,
      );
    }

    const retryAfterHeader =
      response.headers.get("retry-after");

    const retryAfterSeconds = retryAfterHeader
      ? Number(retryAfterHeader)
      : Number.NaN;

    const delayMilliseconds =
      Number.isFinite(retryAfterSeconds) &&
      retryAfterSeconds > 0
        ? retryAfterSeconds * 1_000
        : 1_000 * 2 ** attempt;

    if (attempt < maximumAttempts - 1) {
      await sleep(delayMilliseconds);
    }
  }

  throw new Error(
    "CoinGecko rate limit exceeded after multiple attempts.",
  );
}

export async function getCryptoPrices(
  coinIds: readonly string[],
): Promise<CryptoPriceResponse> {
  const normalizedCoinIds = [...coinIds]
    .sort()
    .join(",");

  const cachedEntry =
    cache.prices.get(normalizedCoinIds);

  if (
    isFresh(
      cachedEntry,
      PRICE_CACHE_DURATION_MS,
    )
  ) {
    return cachedEntry.data;
  }

  const query = new URLSearchParams({
    ids: normalizedCoinIds,
    vs_currencies: "usd",
    include_24hr_change: "true",
  });

  const url =
    `${COINGECKO_BASE_URL}/simple/price?${query}`;

  try {
    const data =
      await fetchCoinGeckoJson<CryptoPriceResponse>(
        url,
        PRICE_REVALIDATION_SECONDS,
      );

    cache.prices.set(normalizedCoinIds, {
      data,
      savedAt: Date.now(),
    });

    return data;
  } catch (error) {
    /*
     * If CoinGecko is temporarily unavailable,
     * continue serving the last successful result.
     */
    if (cachedEntry) {
      return cachedEntry.data;
    }

    throw error;
  }
}

export async function getCryptoMarketChart(
  coinId: string,
  days: number,
): Promise<CryptoMarketChartResponse> {
  const cacheKey = `${coinId}-${days}`;

  const cachedEntry =
    cache.charts.get(cacheKey);

  if (
    isFresh(
      cachedEntry,
      CHART_CACHE_DURATION_MS,
    )
  ) {
    return cachedEntry.data;
  }

  const query = new URLSearchParams({
    vs_currency: "usd",
    days: String(days),
  });

  const url =
    `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?${query}`;

  try {
    const data =
      await fetchCoinGeckoJson<CryptoMarketChartResponse>(
        url,
        CHART_REVALIDATION_SECONDS,
      );

    cache.charts.set(cacheKey, {
      data,
      savedAt: Date.now(),
    });

    return data;
  } catch (error) {
    /*
     * Use the most recent successful chart while
     * the external provider is rate-limited.
     */
    if (cachedEntry) {
      return cachedEntry.data;
    }

    throw error;
  }
}