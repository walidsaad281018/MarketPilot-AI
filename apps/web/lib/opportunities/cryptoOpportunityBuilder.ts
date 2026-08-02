import type {
  RiskLevel,
  Trend,
} from "@/data/opportunities";
import {
  createFallbackMarketDataMetadata,
  type MarketDataMetadata,
} from "@/lib/market/marketDataMetadata";
import {
  assessMarketQuality,
} from "@/lib/marketQuality/marketQualityEngine";
import type {
  OpportunityWithMarketMetadata,
} from "@/lib/opportunities/opportunityWithMarketMetadata";
import type {
  MarketQuote,
} from "@/lib/providers/marketProvider";
import {
  calculateOpportunityScore,
} from "@/lib/scoring/scoreEngine";

export type CryptoOpportunityMarketInput =
  Pick<
    MarketQuote,
    | "price"
    | "priceChange24h"
    | "volume24hUsd"
    | "volatility24h"
  > & {
    marketCapUsd?:
      number | null;
  };

export type BuildCryptoOpportunityInput = {
  asset: string;
  symbol: string;
  market: CryptoOpportunityMarketInput;
  metadata?: MarketDataMetadata;
};

export type BuiltCryptoOpportunity =
  OpportunityWithMarketMetadata & {
    currentPriceUsd: number;
  };

export function buildCryptoOpportunity({
  asset,
  symbol,
  market,
  metadata =
    createFallbackMarketDataMetadata(),
}: BuildCryptoOpportunityInput):
  BuiltCryptoOpportunity {
  validateAssetName(asset);
  validateSymbol(symbol);
  validateMarketPrice(
    market.price,
    symbol,
  );

  const normalizedAsset =
    asset.trim();

  const normalizedSymbol =
    symbol
      .trim()
      .toUpperCase();

  const scoringResult =
    calculateOpportunityScore({
      priceChange24h:
        market.priceChange24h,
      volatility24h:
        market.volatility24h,
      volume24hUsd:
        market.volume24hUsd,
    });

  const marketQuality =
    assessMarketQuality({
      volume24hUsd:
        market.volume24hUsd,
      marketCapUsd:
        market.marketCapUsd ??
        null,
      volatility24h:
        market.volatility24h,
      isStale:
        metadata.isStale,
    });

  return {
    rank: 0,
    asset: normalizedAsset,
    symbol: normalizedSymbol,
    category: "Crypto",
    score: scoringResult.overall,
    expectedReturn:
      calculateExpectedReturn(
        scoringResult.overall,
        market.priceChange24h,
      ),
    risk:
      determineRiskLevel(
        market.volatility24h,
      ),
    confidence:
      calculateConfidence(
        scoringResult.overall,
        market,
      ),
    trend:
      determineTrend(
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
    ...metadata,
    marketQuality,
  };
}

function calculateConfidence(
  score: number,
  market: CryptoOpportunityMarketInput,
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

function validateAssetName(
  asset: string,
): void {
  if (asset.trim().length === 0) {
    throw new Error(
      "Crypto opportunity asset name is required.",
    );
  }
}

function validateSymbol(
  symbol: string,
): void {
  if (symbol.trim().length === 0) {
    throw new Error(
      "Crypto opportunity symbol is required.",
    );
  }
}

function validateMarketPrice(
  price: number,
  symbol: string,
): void {
  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {
    throw new Error(
      `Invalid market price received for ${symbol.trim().toUpperCase()}.`,
    );
  }
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

