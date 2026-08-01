import {
  getLiveCryptoOpportunities,
  type LiveCryptoOpportunity,
} from "@/data/getLiveCryptoOpportunities";
import type {
  RiskLevel,
  Trend,
} from "@/data/opportunities";
import {
  cryptoProvider,
  type DiscoveredCryptoMarket,
} from "@/lib/providers/marketProvider";
import { calculateOpportunityScore } from "@/lib/scoring/scoreEngine";

export type DynamicCryptoOpportunityOptions = {
  discoveryLimit?: number;
  resultLimit?: number;
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
          buildDynamicOpportunity,
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

    if (opportunities.length === 0) {
      return createFallbackOpportunities(
        resultLimit,
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
): LiveCryptoOpportunity {
  const scoringResult =
    calculateOpportunityScore({
      priceChange24h:
        market.priceChange24h,
      volatility24h:
        market.volatility24h,
      volume24hUsd:
        market.volume24hUsd,
    });

  return {
    rank: 0,
    asset: market.name,
    symbol: market.symbol,
    category: "Crypto",
    score: scoringResult.overall,
    expectedReturn:
      calculateExpectedReturn(
        scoringResult.overall,
        market.priceChange24h,
      ),
    risk: determineRiskLevel(
      market.volatility24h,
    ),
    confidence:
      calculateConfidence(
        scoringResult.overall,
        market,
      ),
    trend: determineTrend(
      market.priceChange24h,
    ),
    historicalAccuracy:
      calculateHistoricalAccuracy(
        scoringResult.overall,
      ),
    currentPriceUsd:
      roundPrice(
        market.price,
      ),
    priceChange24h:
      roundToTwoDecimals(
        market.priceChange24h,
      ),
    volatility24h:
      roundToTwoDecimals(
        market.volatility24h,
      ),
    volume24hUsd:
      market.volume24hUsd,
  };
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
  if (second.score !== first.score) {
    return second.score - first.score;
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
): Promise<LiveCryptoOpportunity[]> {
  const fallbackOpportunities =
    await getLiveCryptoOpportunities();

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

function calculateConfidence(
  score: number,
  market: DiscoveredCryptoMarket,
): number {
  const volatilityPenalty =
    Math.min(
      15,
      Math.round(
        market.volatility24h *
          0.8,
      ),
    );

  const liquidityBonus =
    market.volume24hUsd >=
    5_000_000_000
      ? 5
      : market.volume24hUsd >=
          1_000_000_000
        ? 3
        : market.volume24hUsd >=
            100_000_000
          ? 1
          : 0;

  return clampScore(
    Math.round(
      score -
        volatilityPenalty +
        liquidityBonus,
    ),
  );
}

function calculateExpectedReturn(
  score: number,
  priceChange24h: number,
): string {
  const scoreContribution =
    score * 0.12;

  const momentumContribution =
    Math.max(
      0,
      priceChange24h * 0.35,
    );

  const expectedReturn =
    Math.max(
      1,
      scoreContribution +
        momentumContribution,
    );

  return `+${roundToTwoDecimals(
    expectedReturn,
  )}%`;
}

function calculateHistoricalAccuracy(
  score: number,
): number {
  return clampScore(
    Math.round(
      60 + score * 0.28,
    ),
  );
}

function determineRiskLevel(
  volatility24h: number,
): RiskLevel {
  if (volatility24h >= 8) {
    return "High";
  }

  if (volatility24h >= 4) {
    return "Medium";
  }

  return "Low";
}

function determineTrend(
  priceChange24h: number,
): Trend {
  if (priceChange24h >= 1) {
    return "Bullish";
  }

  if (priceChange24h <= -1) {
    return "Bearish";
  }

  return "Neutral";
}

function clampScore(
  value: number,
): number {
  return Math.min(
    100,
    Math.max(0, value),
  );
}

function roundPrice(
  value: number,
): number {
  if (value >= 1) {
    return roundToTwoDecimals(
      value,
    );
  }

  return (
    Math.round(
      value * 100_000_000,
    ) / 100_000_000
  );
}

function roundToTwoDecimals(
  value: number,
): number {
  return (
    Math.round(value * 100) /
    100
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