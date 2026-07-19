export type CryptoPriceData = {
  usd: number;
  usd_24h_change: number;
};

export type CryptoPricesResponse = Record<
  string,
  CryptoPriceData
>;

export type CryptoMarketChart = {
  prices: [number, number][];
};

type PriceCacheEntry = {
  data: CryptoPricesResponse;
  expiresAt: number;
};

type ChartCacheEntry = {
  data: CryptoMarketChart;
  expiresAt: number;
};

const PRICE_CACHE_DURATION_MS = 60_000;
const CHART_CACHE_DURATION_MS = 5 * 60_000;

const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 1_000;

const priceCache = new Map<
  string,
  PriceCacheEntry
>();

const chartCache = new Map<
  string,
  ChartCacheEntry
>();

export async function getCryptoPrices(
  coinIds: string[],
): Promise<CryptoPricesResponse> {
  const normalizedIds = normalizeCoinIds(coinIds);

  if (normalizedIds.length === 0) {
    return {};
  }

  const cacheKey = normalizedIds
    .slice()
    .sort()
    .join(",");

  const cachedEntry =
    priceCache.get(cacheKey);

  if (
    cachedEntry &&
    Date.now() < cachedEntry.expiresAt
  ) {
    return cachedEntry.data;
  }

  try {
    const data =
      await requestWithRetry<CryptoPricesResponse>(
        createSimplePriceUrl(normalizedIds),
      );

    const validatedData =
      validateCryptoPrices(
        data,
        normalizedIds,
      );

    priceCache.set(cacheKey, {
      data: validatedData,
      expiresAt:
        Date.now() +
        PRICE_CACHE_DURATION_MS,
    });

    return validatedData;
  } catch (error) {
    if (cachedEntry) {
      console.warn(
        "Using cached cryptocurrency prices because CoinGecko is temporarily unavailable.",
      );

      return cachedEntry.data;
    }

    throw error;
  }
}

export async function getCryptoMarketChart(
  coinId: string,
  days = 7,
): Promise<CryptoMarketChart> {
  const normalizedCoinId = coinId
    .trim()
    .toLowerCase();

  if (!normalizedCoinId) {
    throw new Error(
      "A CoinGecko coin ID is required.",
    );
  }

  if (
    !Number.isFinite(days) ||
    days <= 0
  ) {
    throw new Error(
      "Chart days must be a positive number.",
    );
  }

  const normalizedDays =
    Math.floor(days);

  const cacheKey =
    `${normalizedCoinId}:${normalizedDays}`;

  const cachedEntry =
    chartCache.get(cacheKey);

  if (
    cachedEntry &&
    Date.now() < cachedEntry.expiresAt
  ) {
    return cachedEntry.data;
  }

  try {
    const data =
      await requestWithRetry<CryptoMarketChart>(
        createMarketChartUrl(
          normalizedCoinId,
          normalizedDays,
        ),
      );

    const validatedData =
      validateMarketChart(data);

    chartCache.set(cacheKey, {
      data: validatedData,
      expiresAt:
        Date.now() +
        CHART_CACHE_DURATION_MS,
    });

    return validatedData;
  } catch (error) {
    if (cachedEntry) {
      console.warn(
        `Using cached market chart for ${normalizedCoinId} because CoinGecko is temporarily unavailable.`,
      );

      return cachedEntry.data;
    }

    throw error;
  }
}

function createSimplePriceUrl(
  coinIds: string[],
): string {
  const query = new URLSearchParams({
    ids: coinIds.join(","),
    vs_currencies: "usd",
    include_24hr_change: "true",
  });

  return `https://api.coingecko.com/api/v3/simple/price?${query.toString()}`;
}

function createMarketChartUrl(
  coinId: string,
  days: number,
): string {
  const query = new URLSearchParams({
    vs_currency: "usd",
    days: String(days),
  });

  return `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
    coinId,
  )}/market_chart?${query.toString()}`;
}

async function requestWithRetry<T>(
  url: string,
): Promise<T> {
  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= MAX_RETRY_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await requestJson<T>(url);
    } catch (error) {
      lastError = error;

      if (
        attempt === MAX_RETRY_ATTEMPTS ||
        !shouldRetry(error)
      ) {
        break;
      }

      const delay =
        INITIAL_RETRY_DELAY_MS *
        2 ** (attempt - 1);

      await wait(delay);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(
    "An unknown CoinGecko error occurred.",
  );
}

async function requestJson<T>(
  url: string,
): Promise<T> {
  const apiKey =
    process.env.COINGECKO_DEMO_API_KEY?.trim();

  const response = await fetch(url, {
    headers: apiKey
      ? {
          "x-cg-demo-api-key": apiKey,
        }
      : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new CoinGeckoRequestError(
      response.status,
      `CoinGecko request failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}

function validateCryptoPrices(
  data: CryptoPricesResponse,
  requestedIds: string[],
): CryptoPricesResponse {
  const validated:
    CryptoPricesResponse = {};

  for (const coinId of requestedIds) {
    const value = data[coinId];

    if (
      !value ||
      typeof value.usd !== "number" ||
      !Number.isFinite(value.usd)
    ) {
      continue;
    }

    validated[coinId] = {
      usd: value.usd,
      usd_24h_change:
        typeof value.usd_24h_change ===
          "number" &&
        Number.isFinite(
          value.usd_24h_change,
        )
          ? value.usd_24h_change
          : 0,
    };
  }

  return validated;
}

function validateMarketChart(
  data: CryptoMarketChart,
): CryptoMarketChart {
  if (!Array.isArray(data.prices)) {
    throw new Error(
      "CoinGecko returned invalid market-chart data.",
    );
  }

  const prices: [number, number][] =
    data.prices.filter(
      (
        item,
      ): item is [number, number] =>
        Array.isArray(item) &&
        item.length >= 2 &&
        typeof item[0] === "number" &&
        Number.isFinite(item[0]) &&
        typeof item[1] === "number" &&
        Number.isFinite(item[1]),
    );

  return {
    prices,
  };
}

function normalizeCoinIds(
  coinIds: string[],
): string[] {
  return Array.from(
    new Set(
      coinIds
        .map((coinId) =>
          coinId
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  );
}

function shouldRetry(
  error: unknown,
): boolean {
  if (
    error instanceof
    CoinGeckoRequestError
  ) {
    return (
      error.status === 429 ||
      error.status >= 500
    );
  }

  return true;
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