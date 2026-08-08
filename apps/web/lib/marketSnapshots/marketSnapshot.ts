import type {
  MarketDataSource,
} from "@/lib/market/marketDataMetadata";

export type MarketSnapshotCategory =
  | "Crypto"
  | "Stock"
  | "ETF";

export type MarketSnapshot = {
  id: string;
  symbol: string;
  category: MarketSnapshotCategory;
  capturedAt: string;
  price: number;
  priceChange24h: number;
  volume24hUsd: number;
  marketCapUsd: number | null;
  volatility24h: number;
  dataSource: MarketDataSource;
  source: string;
  providerTimestamp: string | null;
  isStale: boolean;
};
