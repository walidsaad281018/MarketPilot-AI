import {
  getLiveCryptoOpportunities,
  type LiveCryptoOpportunity,
} from "@/data/getLiveCryptoOpportunities";
import {
  createLiveMarketDataMetadata,
} from "@/lib/market/marketDataMetadata";
import {
  buildCryptoOpportunity,
} from "@/lib/opportunities/cryptoOpportunityBuilder";
import {
  cryptoProvider,
  type DiscoveredCryptoMarket,
} from "@/lib/providers/marketProvider";

export type DynamicCryptoOpportunityOptions = {
  discoveryLimit?: number;
  resultLimit?: number;
  currentTime?: Date;
};

const DEFAULT_DISCOVERY_LIMIT = 200;
const DEFAULT_RESULT_LIMIT = 100;
const MAX_DISCOVERY_LIMIT = 250;

const MINIMUM_MARKET_CAP_USD =
  50_000_000;

const MINIMUM_VOLUME_24H_USD =
  10_000_000;

const MAXIMUM_ABSOLUTE_CHANGE_24H =
  60;

const EXCLUDED_SYMBOLS = new Set([
  "USDT",
  "USDC",
  "USDS",
  "USDE",
  "USD1",
  "USD0",
  "USDTB",
  "USDF",
  "USDQ",
  "USDX",
  "USDD",
  "USDP",
  "PYUSD",
  "FDUSD",
  "TUSD",
  "DAI",
  "FRAX",
  "LUSD",
  "GUSD",
  "RLUSD",
  "SUSD",
  "BUSD",
  "EURS",
  "EURC",
  "EURT",
  "XAUT",
  "PAXG",
  "WBTC",
  "WETH",
  "STETH",
  "WSTETH",
  "CBETH",
  "RETH",
]);

const EXCLUDED_NAME_TERMS = [
  "stablecoin",
  "stable coin",
  "wrapped ",
  "bridged ",
  "staked ",
  "liquid staked",
  "restaked ",
  "leveraged",
  "bull token",
  "bear token",
  "2x long",
  "2x short",
  "3x long",
  "3x short",
];

const EXCLUDED_EXACT_NAMES =
  new Set([
    "stable",
    "first digital usd",
    "paypal usd",
    "ripple usd",
    "world liberty financial usd",
    "ethena usde",
    "usual usd",
  ]);

export async function getDynamicCryptoOpportunities(
  options: DynamicCryptoOpportunityOptions = {},
): Promise<LiveCryptoOpportunity[]> {
  const discoveryLimit =
    options.discoveryLimit ??
    DEFAULT_DISCOVERY_LIMIT;

  const resultLimit =
    options.resultLimit ??
    DEFAULT_RESULT_LIMIT;

  const currentTime =
    options.currentTime ??
    new Date();

  validateLimits(
    discoveryLimit,
    resultLimit,
  );

  try {
    const discoveredMarkets =
      await cryptoProvider.getTopMarkets(
        discoveryLimit,
      );

    const eligibleMarkets =
      discoveredMarkets.filter(
        isEligibleMarket,
      );

    const uniqueMarkets =
      removeDuplicateSymbols(
        eligibleMarkets,
      );

    const opportunities =
      uniqueMarkets
        .map(
          (
            market,
          ): LiveCryptoOpportunity =>
            buildDynamicOpportunity(
              market,
              currentTime,
            ),
        )
        .sort(compareOpportunities)
        .slice(0, resultLimit)
        .map(
          (
            opportunity,
            index,
          ): LiveCryptoOpportunity => ({
            ...opportunity,
            rank: index + 1,
          }),
        );

    if (
      opportunities.length === 0
    ) {
      return createFallbackOpportunities(
        resultLimit,
        currentTime,
      );
    }

    return opportunities;
  } catch (error) {
    console.error(
      "Unable to build dynamic crypto opportunities:",
      error,
    );

    return createFallbackOpportunities(
      resultLimit,
      currentTime,
    );
  }
}

function isEligibleMarket(
  market: DiscoveredCryptoMarket,
): boolean {
  const normalizedSymbol =
    market.symbol
      .trim()
      .toUpperCase();

  const normalizedName =
    market.name
      .trim()
      .toLowerCase();

  const marketCapUsd =
    market.marketCapUsd ?? 0;

  if (
    !/^[A-Z0-9]{2,12}$/.test(
      normalizedSymbol,
    )
  ) {
    return false;
  }

  if (
    EXCLUDED_SYMBOLS.has(
      normalizedSymbol,
    )
  ) {
    return false;
  }

  if (
    EXCLUDED_NAME_TERMS.some(
      (term) =>
        normalizedName.includes(
          term,
        ),
    )
  ) {
    return false;
  }

  if (
    EXCLUDED_EXACT_NAMES.has(
      normalizedName,
    )
  ) {
    return false;
  }

  if (
    marketCapUsd <
    MINIMUM_MARKET_CAP_USD
  ) {
    return false;
  }

  if (
    market.volume24hUsd <
    MINIMUM_VOLUME_24H_USD
  ) {
    return false;
  }

  if (
    Math.abs(
      market.priceChange24h,
    ) >
    MAXIMUM_ABSOLUTE_CHANGE_24H
  ) {
    return false;
  }

  return true;
}

function buildDynamicOpportunity(
  market: DiscoveredCryptoMarket,
  currentTime: Date,
): LiveCryptoOpportunity {
  const metadata =
    createLiveMarketDataMetadata({
      source: market.source,
      lastUpdated:
        market.lastUpdated,
      currentTime,
    });

  return buildCryptoOpportunity({
    asset: market.name,
    symbol: market.symbol,
    market,
    metadata,
  });
}

function removeDuplicateSymbols(
  markets: DiscoveredCryptoMarket[],
): DiscoveredCryptoMarket[] {
  const uniqueMarkets =
    new Map<
      string,
      DiscoveredCryptoMarket
    >();

  for (const market of markets) {
    const normalizedSymbol =
      market.symbol
        .trim()
        .toUpperCase();

    if (
      normalizedSymbol.length === 0 ||
      uniqueMarkets.has(
        normalizedSymbol,
      )
    ) {
      continue;
    }

    uniqueMarkets.set(
      normalizedSymbol,
      {
        ...market,
        symbol: normalizedSymbol,
      },
    );
  }

  return Array.from(
    uniqueMarkets.values(),
  );
}

function compareOpportunities(
  first: LiveCryptoOpportunity,
  second: LiveCryptoOpportunity,
): number {
  if (
    second.score !== first.score
  ) {
    return (
      second.score -
      first.score
    );
  }

  if (
    second.confidence !==
    first.confidence
  ) {
    return (
      second.confidence -
      first.confidence
    );
  }

  return (
    (second.volume24hUsd ?? 0) -
    (first.volume24hUsd ?? 0)
  );
}

async function createFallbackOpportunities(
  resultLimit: number,
  currentTime: Date,
): Promise<LiveCryptoOpportunity[]> {
  const fallbackOpportunities =
    await getLiveCryptoOpportunities({
      currentTime,
    });

  return fallbackOpportunities
    .slice(0, resultLimit)
    .map(
      (
        opportunity,
        index,
      ): LiveCryptoOpportunity => ({
        ...opportunity,
        rank: index + 1,
      }),
    );
}

function validateLimits(
  discoveryLimit: number,
  resultLimit: number,
): void {
  if (
    !Number.isInteger(
      discoveryLimit,
    ) ||
    discoveryLimit < 1 ||
    discoveryLimit >
      MAX_DISCOVERY_LIMIT
  ) {
    throw new Error(
      `Discovery limit must be an integer between 1 and ${MAX_DISCOVERY_LIMIT}.`,
    );
  }

  if (
    !Number.isInteger(
      resultLimit,
    ) ||
    resultLimit < 1
  ) {
    throw new Error(
      "Result limit must be a positive integer.",
    );
  }

  if (
    resultLimit >
    discoveryLimit
  ) {
    throw new Error(
      "Result limit cannot exceed the discovery limit.",
    );
  }
}
