export type MarketCategory =
  | "crypto"
  | "stock"
  | "etf";

export interface MarketQuote {
  symbol: string;
  category: MarketCategory;
  price: number;
  priceChange24h: number;
  volume24hUsd: number;
  volatility24h: number;
  marketCapUsd?: number;
  lastUpdated: string;
  source: string;
}

export interface DiscoveredCryptoMarket
  extends MarketQuote {
  id: string;
  name: string;
  marketCapRank: number | null;
}

export interface MarketProvider {
  getQuote(
    symbol: string,
  ): Promise<MarketQuote | null>;

  getQuotes(
    symbols: string[],
  ): Promise<MarketQuote[]>;
}

export interface CryptoMarketDiscoveryProvider {
  getTopMarkets(
    limit?: number,
  ): Promise<DiscoveredCryptoMarket[]>;
}

interface CoinGeckoMarketResponse {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h:
    | number
    | null;
  total_volume: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  last_updated: string;
}

const COINGECKO_BASE_URL =
  "https://api.coingecko.com/api/v3";

const DEFAULT_DISCOVERY_LIMIT = 200;
const MAX_DISCOVERY_LIMIT = 250;

const coinGeckoIds: Record<
  string,
  string
> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  DOT: "polkadot",
  SUI: "sui",
  TON: "the-open-network",
  LTC: "litecoin",
  UNI: "uniswap",
  APT: "aptos",
  NEAR: "near",
  ICP: "internet-computer",
  RENDER: "render-token",
  SEI: "sei-network",
  HBAR: "hedera",
  ARB: "arbitrum",
};

function calculateVolatility(
  change24h: number,
): number {
  return Number(
    (
      Math.abs(change24h) * 1.35 +
      1.2
    ).toFixed(2),
  );
}

export class CoinGeckoProvider
  implements
    MarketProvider,
    CryptoMarketDiscoveryProvider
{
  async getQuote(
    symbol: string,
  ): Promise<MarketQuote | null> {
    const quotes =
      await this.getQuotes([
        symbol,
      ]);

    return quotes.length > 0
      ? quotes[0]
      : null;
  }

  async getQuotes(
    symbols: string[],
  ): Promise<MarketQuote[]> {
    const ids = symbols
      .map(
        (symbol) =>
          coinGeckoIds[
            symbol.toUpperCase()
          ],
      )
      .filter(
        (
          id,
        ): id is string =>
          id !== undefined,
      );

    if (ids.length === 0) {
      return [];
    }

    const searchParams =
      new URLSearchParams({
        vs_currency: "usd",
        ids: ids.join(","),
        price_change_percentage:
          "24h",
      });

    const data =
      await fetchCoinGeckoMarkets(
        searchParams,
      );

    return data.map(
      mapCoinGeckoMarketToQuote,
    );
  }

  async getTopMarkets(
    limit:
      number = DEFAULT_DISCOVERY_LIMIT,
  ): Promise<
    DiscoveredCryptoMarket[]
  > {
    validateDiscoveryLimit(limit);

    const searchParams =
      new URLSearchParams({
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: String(limit),
        page: "1",
        sparkline: "false",
        price_change_percentage:
          "24h",
      });

    const data =
      await fetchCoinGeckoMarkets(
        searchParams,
      );

    return data
      .filter(hasUsableMarketData)
      .map(
        (
          coin,
        ): DiscoveredCryptoMarket => ({
          ...mapCoinGeckoMarketToQuote(
            coin,
          ),
          id: coin.id,
          name: coin.name,
          marketCapRank:
            coin.market_cap_rank,
        }),
      );
  }
}

async function fetchCoinGeckoMarkets(
  searchParams: URLSearchParams,
): Promise<
  CoinGeckoMarketResponse[]
> {
  const url =
    `${COINGECKO_BASE_URL}/coins/markets?` +
    searchParams.toString();

  const response =
    await fetch(url, {
      next: {
        revalidate: 60,
      },
    });

  if (!response.ok) {
    throw new Error(
      `Unable to fetch CoinGecko data. Status: ${response.status}.`,
    );
  }

  return (
    await response.json()
  ) as CoinGeckoMarketResponse[];
}

function mapCoinGeckoMarketToQuote(
  coin: CoinGeckoMarketResponse,
): MarketQuote {
  const priceChange24h =
    coin.price_change_percentage_24h ??
    0;

  return {
    symbol:
      coin.symbol.toUpperCase(),

    category: "crypto",

    price:
      coin.current_price,

    priceChange24h,

    volume24hUsd:
      coin.total_volume ?? 0,

    volatility24h:
      calculateVolatility(
        priceChange24h,
      ),

    marketCapUsd:
      coin.market_cap ??
      undefined,

    lastUpdated:
      coin.last_updated,

    source: "CoinGecko",
  };
}

function hasUsableMarketData(
  coin: CoinGeckoMarketResponse,
): boolean {
  return (
    typeof coin.id === "string" &&
    coin.id.length > 0 &&
    typeof coin.name === "string" &&
    coin.name.length > 0 &&
    typeof coin.symbol === "string" &&
    coin.symbol.length > 0 &&
    Number.isFinite(
      coin.current_price,
    ) &&
    coin.current_price > 0 &&
    Number.isFinite(
      coin.total_volume,
    ) &&
    (coin.total_volume ?? 0) > 0 &&
    Number.isFinite(
      coin.market_cap,
    ) &&
    (coin.market_cap ?? 0) > 0
  );
}

function validateDiscoveryLimit(
  limit: number,
): void {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit >
      MAX_DISCOVERY_LIMIT
  ) {
    throw new Error(
      `Crypto discovery limit must be an integer between 1 and ${MAX_DISCOVERY_LIMIT}.`,
    );
  }
}

export const cryptoProvider =
  new CoinGeckoProvider();