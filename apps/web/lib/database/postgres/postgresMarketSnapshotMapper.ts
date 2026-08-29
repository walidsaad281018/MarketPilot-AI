import type {
  MarketDataSource,
} from "@/lib/market/marketDataMetadata";
import type {
  MarketSnapshot,
  MarketSnapshotCategory,
} from "@/lib/marketSnapshots/marketSnapshot";

export type PostgresMarketSnapshotRow = {
  id: string;
  symbol: string;
  category: string;
  captured_at: string;
  price: number | string;
  price_change_24h: number | string;
  volume_24h_usd: number | string;
  market_cap_usd:
    | number
    | string
    | null;
  volatility_24h: number | string;
  data_source: string;
  source: string;
  provider_timestamp: string | null;
  is_stale: boolean;
};

export type PostgresMarketSnapshotParameters = {
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

export function toPostgresMarketSnapshotParameters(
  snapshot: MarketSnapshot,
): PostgresMarketSnapshotParameters {
  return {
    id: snapshot.id,
    symbol: snapshot.symbol,
    category: snapshot.category,
    capturedAt:
      snapshot.capturedAt,
    price: snapshot.price,
    priceChange24h:
      snapshot.priceChange24h,
    volume24hUsd:
      snapshot.volume24hUsd,
    marketCapUsd:
      snapshot.marketCapUsd,
    volatility24h:
      snapshot.volatility24h,
    dataSource:
      snapshot.dataSource,
    source: snapshot.source,
    providerTimestamp:
      snapshot.providerTimestamp,
    isStale:
      snapshot.isStale,
  };
}

export function fromPostgresMarketSnapshotRow(
  row: PostgresMarketSnapshotRow,
): MarketSnapshot {
  return {
    id: row.id,
    symbol: row.symbol,
    category:
      parseCategory(
        row.category,
      ),
    capturedAt:
      row.captured_at,
    price:
      Number(row.price),
    priceChange24h:
      Number(
        row.price_change_24h,
      ),
    volume24hUsd:
      Number(
        row.volume_24h_usd,
      ),
    marketCapUsd:
      row.market_cap_usd === null
        ? null
        : Number(
            row.market_cap_usd,
          ),
    volatility24h:
      Number(
        row.volatility_24h,
      ),
    dataSource:
      parseDataSource(
        row.data_source,
      ),
    source: row.source,
    providerTimestamp:
      row.provider_timestamp,
    isStale:
      row.is_stale,
  };
}

function parseCategory(
  value: string,
): MarketSnapshotCategory {
  if (
    value === "Crypto" ||
    value === "Stock" ||
    value === "ETF"
  ) {
    return value;
  }

  throw new Error(
    `Invalid market snapshot category: ${value}.`,
  );
}

function parseDataSource(
  value: string,
): MarketDataSource {
  if (
    value === "live" ||
    value === "fallback"
  ) {
    return value;
  }

  throw new Error(
    `Invalid market snapshot data source: ${value}.`,
  );
}
