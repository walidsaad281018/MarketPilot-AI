import {
  cryptoOpportunities,
  type Opportunity,
  type RiskLevel,
  type Trend,
} from "@/data/opportunities";
import {
  cryptoProvider,
  type MarketQuote,
} from "@/lib/providers/marketProvider";
import { calculateOpportunityScore } from "@/lib/scoring/scoreEngine";

type CryptoAsset = {
  asset: string;
  symbol: string;
};

export type LiveCryptoOpportunity =
  Opportunity & {
    currentPriceUsd: number | null;
  };

const cryptoAssets: CryptoAsset[] = [
  { asset: "Bitcoin", symbol: "BTC" },
  { asset: "Ethereum", symbol: "ETH" },
  { asset: "Solana", symbol: "SOL" },
  { asset: "BNB", symbol: "BNB" },
  { asset: "XRP", symbol: "XRP" },
  { asset: "Cardano", symbol: "ADA" },
  {
    asset: "Avalanche",
    symbol: "AVAX",
  },
  {
    asset: "Chainlink",
    symbol: "LINK",
  },
  {
    asset: "Polkadot",
    symbol: "DOT",
  },
  { asset: "Sui", symbol: "SUI" },
  {
    asset: "Toncoin",
    symbol: "TON",
  },
  {
    asset: "Litecoin",
    symbol: "LTC",
  },
  {
    asset: "Uniswap",
    symbol: "UNI",
  },
  {
    asset: "Aptos",
    symbol: "APT",
  },
  {
    asset: "NEAR Protocol",
    symbol: "NEAR",
  },
  {
    asset: "Internet Computer",
    symbol: "ICP",
  },
  {
    asset: "Render",
    symbol: "RENDER",
  },
  { asset: "Sei", symbol: "SEI" },
  {
    asset: "Hedera",
    symbol: "HBAR",
  },
  {
    asset: "Arbitrum",
    symbol: "ARB",
  },
];

export async function getLiveCryptoOpportunities(): Promise<
  LiveCryptoOpportunity[]
> {
  try {
    const symbols = cryptoAssets.map(
      (asset) => asset.symbol,
    );

    const quotes =
      await cryptoProvider.getQuotes(
        symbols,
      );

    if (quotes.length === 0) {
      return createFallbackOpportunities();
    }

    const quotesBySymbol = new Map(
      quotes.map((quote) => [
        quote.symbol.toUpperCase(),
        quote,
      ]),
    );

    const liveOpportunities =
      cryptoAssets
        .map((asset) => {
          const quote =
            quotesBySymbol.get(
              asset.symbol.toUpperCase(),
            );

          if (!quote) {
            return null;
          }

          return buildLiveOpportunity(
            asset,
            quote,
          );
        })
        .filter(
          (
            opportunity,
          ): opportunity is LiveCryptoOpportunity =>
            opportunity !== null,
        );

    if (
      liveOpportunities.length === 0
    ) {
      return createFallbackOpportunities();
    }

    return liveOpportunities
      .sort(
        (first, second) =>
          second.score -
          first.score,
      )
      .map(
        (
          opportunity,
          index,
        ) => ({
          ...opportunity,
          rank: index + 1,
        }),
      );
  } catch (error) {
    console.error(
      "Unable to build live crypto opportunities:",
      error,
    );

    return createFallbackOpportunities();
  }
}

function buildLiveOpportunity(
  asset: CryptoAsset,
  quote: MarketQuote,
): LiveCryptoOpportunity {
  validateMarketPrice(
    quote.price,
    quote.symbol,
  );

  const scoringResult =
    calculateOpportunityScore({
      priceChange24h:
        quote.priceChange24h,
      volatility24h:
        quote.volatility24h,
      volume24hUsd:
        quote.volume24hUsd,
    });

  return {
    rank: 0,
    asset: asset.asset,
    symbol: asset.symbol,
    category: "Crypto",
    score: scoringResult.overall,
    expectedReturn:
      calculateExpectedReturn(
        scoringResult.overall,
        quote.priceChange24h,
      ),
    risk: determineRiskLevel(
      quote.volatility24h,
    ),
    confidence:
      calculateConfidence(
        scoringResult.overall,
        quote,
      ),
    trend: determineTrend(
      quote.priceChange24h,
    ),
    historicalAccuracy:
      calculateHistoricalAccuracy(
        scoringResult.overall,
      ),
    currentPriceUsd:
      roundPrice(
        quote.price,
      ),
    priceChange24h:
      roundToTwoDecimals(
        quote.priceChange24h,
      ),
    volatility24h:
      roundToTwoDecimals(
        quote.volatility24h,
      ),
    volume24hUsd:
      quote.volume24hUsd,
  };
}

function createFallbackOpportunities(): LiveCryptoOpportunity[] {
  return cryptoOpportunities.map(
    (opportunity) => ({
      ...opportunity,
      currentPriceUsd: null,
    }),
  );
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
      `Invalid market price received for ${symbol}.`,
    );
  }
}

function calculateConfidence(
  score: number,
  quote: MarketQuote,
): number {
  const volatilityPenalty =
    Math.min(
      15,
      Math.round(
        quote.volatility24h *
          0.8,
      ),
    );

  const liquidityBonus =
    quote.volume24hUsd >=
    5_000_000_000
      ? 5
      : quote.volume24hUsd >=
          1_000_000_000
        ? 3
        : quote.volume24hUsd >=
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