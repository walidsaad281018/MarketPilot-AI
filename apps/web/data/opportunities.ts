import { calculateOpportunityScore } from "@/lib/scoring/scoreEngine";

export type OpportunityCategory =
  | "Crypto"
  | "Stock"
  | "ETF";

export type RiskLevel =
  | "Low"
  | "Medium"
  | "High";

export type Trend =
  | "Bullish"
  | "Neutral"
  | "Bearish";

export type Opportunity = {
  rank: number;
  asset: string;
  symbol: string;
  category: OpportunityCategory;

  score: number;
  expectedReturn: string;
  risk: RiskLevel;
  confidence: number;
  trend: Trend;
  historicalAccuracy: number;

  priceChange24h: number | null;
  volatility24h: number | null;
  volume24hUsd: number | null;
};

type AssetSeed = {
  asset: string;
  symbol: string;
};

type MockMarketInputs = {
  priceChange24h: number;
  volatility24h: number;
  volume24hUsd: number;
};

const cryptoAssets: AssetSeed[] = [
  { asset: "Bitcoin", symbol: "BTC" },
  { asset: "Ethereum", symbol: "ETH" },
  { asset: "Solana", symbol: "SOL" },
  { asset: "BNB", symbol: "BNB" },
  { asset: "XRP", symbol: "XRP" },
  { asset: "Cardano", symbol: "ADA" },
  { asset: "Avalanche", symbol: "AVAX" },
  { asset: "Chainlink", symbol: "LINK" },
  { asset: "Polkadot", symbol: "DOT" },
  { asset: "Sui", symbol: "SUI" },
  { asset: "Toncoin", symbol: "TON" },
  { asset: "Litecoin", symbol: "LTC" },
  { asset: "Uniswap", symbol: "UNI" },
  { asset: "Aptos", symbol: "APT" },
  {
    asset: "NEAR Protocol",
    symbol: "NEAR",
  },
  {
    asset: "Internet Computer",
    symbol: "ICP",
  },
  { asset: "Render", symbol: "RENDER" },
  { asset: "Sei", symbol: "SEI" },
  { asset: "Hedera", symbol: "HBAR" },
  { asset: "Arbitrum", symbol: "ARB" },
];

const stockAssets: AssetSeed[] = [
  { asset: "NVIDIA", symbol: "NVDA" },
  { asset: "Microsoft", symbol: "MSFT" },
  { asset: "Apple", symbol: "AAPL" },
  { asset: "Amazon", symbol: "AMZN" },
  { asset: "Alphabet", symbol: "GOOGL" },
  {
    asset: "Meta Platforms",
    symbol: "META",
  },
  { asset: "Tesla", symbol: "TSLA" },
  { asset: "Broadcom", symbol: "AVGO" },
  { asset: "Netflix", symbol: "NFLX" },
  { asset: "AMD", symbol: "AMD" },
  { asset: "Visa", symbol: "V" },
  { asset: "Mastercard", symbol: "MA" },
  { asset: "Eli Lilly", symbol: "LLY" },
  {
    asset: "JPMorgan Chase",
    symbol: "JPM",
  },
  { asset: "Costco", symbol: "COST" },
  { asset: "Walmart", symbol: "WMT" },
  { asset: "Oracle", symbol: "ORCL" },
  { asset: "Salesforce", symbol: "CRM" },
  { asset: "Adobe", symbol: "ADBE" },
  { asset: "Palantir", symbol: "PLTR" },
];

const etfAssets: AssetSeed[] = [
  {
    asset: "Vanguard S&P 500 ETF",
    symbol: "VOO",
  },
  {
    asset: "Invesco QQQ Trust",
    symbol: "QQQ",
  },
  {
    asset: "SPDR S&P 500 ETF",
    symbol: "SPY",
  },
  {
    asset:
      "Vanguard Total Stock Market ETF",
    symbol: "VTI",
  },
  {
    asset:
      "iShares Core S&P 500 ETF",
    symbol: "IVV",
  },
  {
    asset: "Vanguard Growth ETF",
    symbol: "VUG",
  },
  {
    asset:
      "Schwab U.S. Dividend Equity ETF",
    symbol: "SCHD",
  },
  {
    asset:
      "Vanguard Dividend Appreciation ETF",
    symbol: "VIG",
  },
  {
    asset:
      "iShares Russell 1000 Growth ETF",
    symbol: "IWF",
  },
  {
    asset:
      "Technology Select Sector SPDR Fund",
    symbol: "XLK",
  },
  {
    asset:
      "Vanguard Information Technology ETF",
    symbol: "VGT",
  },
  {
    asset: "iShares Semiconductor ETF",
    symbol: "SOXX",
  },
  {
    asset: "VanEck Semiconductor ETF",
    symbol: "SMH",
  },
  {
    asset: "Vanguard Value ETF",
    symbol: "VTV",
  },
  {
    asset: "iShares MSCI World ETF",
    symbol: "URTH",
  },
  {
    asset:
      "Vanguard FTSE Developed Markets ETF",
    symbol: "VEA",
  },
  {
    asset:
      "iShares Core MSCI Emerging Markets ETF",
    symbol: "IEMG",
  },
  {
    asset: "SPDR Gold Shares",
    symbol: "GLD",
  },
  {
    asset:
      "iShares 20+ Year Treasury Bond ETF",
    symbol: "TLT",
  },
  {
    asset: "Vanguard Real Estate ETF",
    symbol: "VNQ",
  },
];

function buildOpportunities(
  assets: AssetSeed[],
  category: OpportunityCategory,
): Opportunity[] {
  const opportunities = assets.map(
    (asset, index) => {
      const marketInputs =
        createMockMarketInputs(
          category,
          index,
        );

      const scoringResult =
        calculateOpportunityScore({
          priceChange24h:
            marketInputs.priceChange24h,
          volatility24h:
            marketInputs.volatility24h,
          volume24hUsd:
            marketInputs.volume24hUsd,
        });

      const confidence =
        calculateConfidence(
          scoringResult.overall,
          marketInputs,
        );

      const historicalAccuracy =
        Math.max(
          68,
          87 - Math.floor(index / 3),
        );

      const risk = determineRiskLevel(
        marketInputs.volatility24h,
      );

      const trend = determineTrend(
        marketInputs.priceChange24h,
      );

      const expectedReturn =
        calculateExpectedReturn(
          scoringResult.overall,
          category,
        );

      return {
        rank: 0,
        asset: asset.asset,
        symbol: asset.symbol,
        category,
        score: scoringResult.overall,
        expectedReturn,
        risk,
        confidence,
        trend,
        historicalAccuracy,
        priceChange24h:
          marketInputs.priceChange24h,
        volatility24h:
          marketInputs.volatility24h,
        volume24hUsd:
          marketInputs.volume24hUsd,
      };
    },
  );

  return opportunities
    .sort(
      (first, second) =>
        second.score - first.score,
    )
    .map((opportunity, index) => ({
      ...opportunity,
      rank: index + 1,
    }));
}

function createMockMarketInputs(
  category: OpportunityCategory,
  index: number,
): MockMarketInputs {
  if (category === "Crypto") {
    return {
      priceChange24h:
        roundToTwoDecimals(
          Math.max(
            -4,
            9.5 - index * 0.65,
          ),
        ),

      volatility24h:
        roundToTwoDecimals(
          4.5 + (index % 7) * 0.9,
        ),

      volume24hUsd: Math.max(
        8_000_000,
        8_000_000_000 -
          index * 380_000_000,
      ),
    };
  }

  if (category === "Stock") {
    return {
      priceChange24h:
        roundToTwoDecimals(
          Math.max(
            -2.5,
            6.5 - index * 0.45,
          ),
        ),

      volatility24h:
        roundToTwoDecimals(
          1.6 + (index % 6) * 0.65,
        ),

      volume24hUsd: Math.max(
        25_000_000,
        4_000_000_000 -
          index * 185_000_000,
      ),
    };
  }

  return {
    priceChange24h:
      roundToTwoDecimals(
        Math.max(
          -1.5,
          4.5 - index * 0.3,
        ),
      ),

    volatility24h:
      roundToTwoDecimals(
        0.8 + (index % 5) * 0.45,
      ),

    volume24hUsd: Math.max(
      15_000_000,
      2_500_000_000 -
        index * 115_000_000,
    ),
  };
}

function calculateConfidence(
  score: number,
  marketInputs: MockMarketInputs,
): number {
  const volatilityPenalty =
    Math.min(
      12,
      Math.round(
        marketInputs.volatility24h,
      ),
    );

  const liquidityBonus =
    marketInputs.volume24hUsd >=
    1_000_000_000
      ? 4
      : marketInputs.volume24hUsd >=
          100_000_000
        ? 2
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
  category: OpportunityCategory,
): string {
  const categoryMultiplier =
    category === "Crypto"
      ? 0.16
      : category === "Stock"
        ? 0.11
        : 0.08;

  const expectedReturn =
    Math.max(
      2,
      score * categoryMultiplier,
    );

  return `+${roundToTwoDecimals(
    expectedReturn,
  )}%`;
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

function roundToTwoDecimals(
  value: number,
): number {
  return (
    Math.round(value * 100) / 100
  );
}

export const cryptoOpportunities =
  buildOpportunities(
    cryptoAssets,
    "Crypto",
  );

export const stockOpportunities =
  buildOpportunities(
    stockAssets,
    "Stock",
  );

export const etfOpportunities =
  buildOpportunities(
    etfAssets,
    "ETF",
  );