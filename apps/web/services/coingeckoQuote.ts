type CoinGeckoSimplePriceRecord = {
  usd?: number;
  usd_24h_change?: number;
  last_updated_at?: number;
};

type CoinGeckoSimplePriceResponse = Record<
  string,
  CoinGeckoSimplePriceRecord
>;

export type CoinGeckoQuote = {
  price: number;
  change24h: number | null;
  providerUpdatedAt: string | null;
};

type QuoteCacheEntry = {
  quote: CoinGeckoQuote;
  expiresAt: number;
};

const CACHE_DURATION_MS = 60_000;
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 1_000;

const quoteCache = new Map<
  string,
  QuoteCacheEntry
>();

export async function getCoinGeckoQuote(
  coinId: string,
): Promise<CoinGeckoQuote> {
  const normalizedCoinId = coinId
    .trim()
    .toLowerCase();

  if (!normalizedCoinId) {
    throw new Error(
      "A CoinGecko coin ID is required.",
    );
  }

  const cachedQuote =
    getValidCachedQuote(normalizedCoinId);

  if (cachedQuote) {
    return cachedQuote;
  }

  try {
    const quote =
      await requestQuoteWithRetry(
        normalizedCoinId,
      );

    quoteCache.set(normalizedCoinId, {
      quote,
      expiresAt:
        Date.now() + CACHE_DURATION_MS,
    });

    return quote;
  } catch (error) {
    const expiredCachedQuote =
      quoteCache.get(
        normalizedCoinId,
      )?.quote;

    if (expiredCachedQuote) {
      console.warn(
        `Using an expired CoinGecko quote for ${normalizedCoinId} because the provider request failed.`,
      );

      return expiredCachedQuote;
    }

    throw error;
  }
}

async function requestQuoteWithRetry(
  coinId: string,
): Promise<CoinGeckoQuote> {
  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= MAX_RETRY_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await requestQuote(coinId);
    } catch (error) {
      lastError = error;

      if (
        attempt === MAX_RETRY_ATTEMPTS ||
        !shouldRetry(error)
      ) {
        break;
      }

      const retryDelay =
        INITIAL_RETRY_DELAY_MS *
        2 ** (attempt - 1);

      await wait(retryDelay);
    }
  }

  throw normalizeError(lastError);
}

async function requestQuote(
  coinId: string,
): Promise<CoinGeckoQuote> {
  const query = new URLSearchParams({
    ids: coinId,
    vs_currencies: "usd",
    include_24hr_change: "true",
    include_last_updated_at: "true",
  });

  const apiKey =
    process.env.COINGECKO_DEMO_API_KEY?.trim();

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?${query.toString()}`,
    {
      headers: apiKey
        ? {
            "x-cg-demo-api-key": apiKey,
          }
        : undefined,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new CoinGeckoRequestError(
      response.status,
      `CoinGecko quote request failed with status ${response.status}.`,
    );
  }

  const data =
    (await response.json()) as CoinGeckoSimplePriceResponse;

  const providerQuote = data[coinId];

  if (
    !providerQuote ||
    typeof providerQuote.usd !== "number" ||
    !Number.isFinite(providerQuote.usd)
  ) {
    throw new Error(
      `CoinGecko returned an invalid quote for ${coinId}.`,
    );
  }

  const change24h =
    typeof providerQuote.usd_24h_change ===
      "number" &&
    Number.isFinite(
      providerQuote.usd_24h_change,
    )
      ? providerQuote.usd_24h_change
      : null;

  const providerUpdatedAt =
    typeof providerQuote.last_updated_at ===
      "number" &&
    Number.isFinite(
      providerQuote.last_updated_at,
    )
      ? new Date(
          providerQuote.last_updated_at *
            1_000,
        ).toISOString()
      : null;

  return {
    price: providerQuote.usd,
    change24h,
    providerUpdatedAt,
  };
}

function getValidCachedQuote(
  coinId: string,
): CoinGeckoQuote | null {
  const cacheEntry =
    quoteCache.get(coinId);

  if (!cacheEntry) {
    return null;
  }

  if (Date.now() >= cacheEntry.expiresAt) {
    return null;
  }

  return cacheEntry.quote;
}

function shouldRetry(
  error: unknown,
): boolean {
  if (
    error instanceof CoinGeckoRequestError
  ) {
    return (
      error.status === 429 ||
      error.status >= 500
    );
  }

  return true;
}

function normalizeError(
  error: unknown,
): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(
    "An unknown CoinGecko error occurred.",
  );
}

function wait(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

class CoinGeckoRequestError extends Error {
  readonly status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);

    this.name =
      "CoinGeckoRequestError";

    this.status = status;
  }
}