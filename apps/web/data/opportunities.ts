export type OpportunityCategory = "Crypto" | "Stock" | "ETF";
export type RiskLevel = "Low" | "Medium" | "High";
export type Trend = "Bullish" | "Neutral" | "Bearish";

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
};

type AssetSeed = {
  asset: string;
  symbol: string;
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
  { asset: "NEAR Protocol", symbol: "NEAR" },
  { asset: "Internet Computer", symbol: "ICP" },
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
  { asset: "Meta Platforms", symbol: "META" },
  { asset: "Tesla", symbol: "TSLA" },
  { asset: "Broadcom", symbol: "AVGO" },
  { asset: "Netflix", symbol: "NFLX" },
  { asset: "AMD", symbol: "AMD" },
  { asset: "Visa", symbol: "V" },
  { asset: "Mastercard", symbol: "MA" },
  { asset: "Eli Lilly", symbol: "LLY" },
  { asset: "JPMorgan Chase", symbol: "JPM" },
  { asset: "Costco", symbol: "COST" },
  { asset: "Walmart", symbol: "WMT" },
  { asset: "Oracle", symbol: "ORCL" },
  { asset: "Salesforce", symbol: "CRM" },
  { asset: "Adobe", symbol: "ADBE" },
  { asset: "Palantir", symbol: "PLTR" },
];

const etfAssets: AssetSeed[] = [
  { asset: "Vanguard S&P 500 ETF", symbol: "VOO" },
  { asset: "Invesco QQQ Trust", symbol: "QQQ" },
  { asset: "SPDR S&P 500 ETF", symbol: "SPY" },
  { asset: "Vanguard Total Stock Market ETF", symbol: "VTI" },
  { asset: "iShares Core S&P 500 ETF", symbol: "IVV" },
  { asset: "Vanguard Growth ETF", symbol: "VUG" },
  { asset: "Schwab U.S. Dividend Equity ETF", symbol: "SCHD" },
  { asset: "Vanguard Dividend Appreciation ETF", symbol: "VIG" },
  { asset: "iShares Russell 1000 Growth ETF", symbol: "IWF" },
  { asset: "Technology Select Sector SPDR Fund", symbol: "XLK" },
  { asset: "Vanguard Information Technology ETF", symbol: "VGT" },
  { asset: "iShares Semiconductor ETF", symbol: "SOXX" },
  { asset: "VanEck Semiconductor ETF", symbol: "SMH" },
  { asset: "Vanguard Value ETF", symbol: "VTV" },
  { asset: "iShares MSCI World ETF", symbol: "URTH" },
  { asset: "Vanguard FTSE Developed Markets ETF", symbol: "VEA" },
  { asset: "iShares Core MSCI Emerging Markets ETF", symbol: "IEMG" },
  { asset: "SPDR Gold Shares", symbol: "GLD" },
  { asset: "iShares 20+ Year Treasury Bond ETF", symbol: "TLT" },
  { asset: "Vanguard Real Estate ETF", symbol: "VNQ" },
];

function buildOpportunities(
  assets: AssetSeed[],
  category: OpportunityCategory,
): Opportunity[] {
  return assets.map((asset, index) => {
    const rank = index + 1;
    const score = Math.max(72, 95 - index);
    const confidence = Math.max(70, 92 - Math.floor(index / 2));
    const historicalAccuracy = Math.max(68, 87 - Math.floor(index / 3));

    const risk: RiskLevel =
      index % 7 === 0 ? "Medium" : index % 11 === 0 ? "High" : "Low";

    const trend: Trend =
      index < 12 ? "Bullish" : index < 17 ? "Neutral" : "Bearish";

    const expectedReturnValue = Math.max(3, 14 - Math.floor(index / 2));

    return {
      rank,
      asset: asset.asset,
      symbol: asset.symbol,
      category,
      score,
      expectedReturn: `+${expectedReturnValue}%`,
      risk,
      confidence,
      trend,
      historicalAccuracy,
    };
  });
}

export const cryptoOpportunities = buildOpportunities(
  cryptoAssets,
  "Crypto",
);

export const stockOpportunities = buildOpportunities(
  stockAssets,
  "Stock",
);

export const etfOpportunities = buildOpportunities(
  etfAssets,
  "ETF",
);