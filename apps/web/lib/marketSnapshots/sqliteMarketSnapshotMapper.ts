import type {
  MarketSnapshot,
  MarketSnapshotCategory,
} from "@/lib/marketSnapshots/marketSnapshot";
import type {
  MarketDataSource,
} from "@/lib/market/marketDataMetadata";

export type SqliteMarketSnapshotRow = {
  id: string;
  symbol: string;
  category: string;
  captured_at: string;
  price: number;
  price_change_24h: number;
  volume_24h_usd: number;
  market_cap_usd: number | null;
  volatility_24h: number;
  data_source: string;
  source: string;
  provider_timestamp: string | null;
  is_stale: number;
};

export type SqliteMarketSnapshotParameters = {
  $id: string;
  $symbol: string;
  $category: MarketSnapshotCategory;
  $capturedAt: string;
  $price: number;
  $priceChange24h: number;
  $volume24hUsd: number;
  $marketCapUsd: number | null;
  $volatility24h: number;
  $dataSource: MarketDataSource;
  $source: string;
  $providerTimestamp: string | null;
  $isStale: number;
};

export function toSqliteMarketSnapshotParameters(
  snapshot: MarketSnapshot,
): SqliteMarketSnapshotParameters {
  return {
    $id: snapshot.id,
    $symbol: snapshot.symbol,
    $category: snapshot.category,
    $capturedAt:
      snapshot.capturedAt,
    $price: snapshot.price,
    $priceChange24h:
      snapshot.priceChange24h,
    $volume24hUsd:
      snapshot.volume24hUsd,
    $marketCapUsd:
      snapshot.marketCapUsd,
    $volatility24h:
      snapshot.volatility24h,
    $dataSource:
      snapshot.dataSource,
    $source: snapshot.source,
    $providerTimestamp:
      snapshot.providerTimestamp,
    $isStale:
      snapshot.isStale ? 1 : 0,
  };
}

export function fromSqliteMarketSnapshotRow(
  row: SqliteMarketSnapshotRow,
): MarketSnapshot {
  return {
    id: row.id,
    symbol: row.symbol,
    category:
      row.category as
        MarketSnapshotCategory,
    capturedAt:
      row.captured_at,
    price: row.price,
    priceChange24h:
      row.price_change_24h,
    volume24hUsd:
      row.volume_24h_usd,
    marketCapUsd:
      row.market_cap_usd,
    volatility24h:
      row.volatility_24h,
    dataSource:
      row.data_source as
        MarketDataSource,
    source: row.source,
    providerTimestamp:
      row.provider_timestamp,
    isStale:
      row.is_stale === 1,
  };
}
