CREATE TABLE IF NOT EXISTS market_snapshots (
  id TEXT PRIMARY KEY COLLATE NOCASE,
  symbol TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (
      category IN (
        'Crypto',
        'Stock',
        'ETF'
      )
    ),
  captured_at TEXT NOT NULL,
  price REAL NOT NULL
    CHECK (price > 0),
  price_change_24h REAL NOT NULL,
  volume_24h_usd REAL NOT NULL
    CHECK (volume_24h_usd >= 0),
  market_cap_usd REAL
    CHECK (
      market_cap_usd IS NULL
      OR market_cap_usd >= 0
    ),
  volatility_24h REAL NOT NULL
    CHECK (volatility_24h >= 0),
  data_source TEXT NOT NULL
    CHECK (
      data_source IN (
        'live',
        'fallback'
      )
    ),
  source TEXT NOT NULL,
  provider_timestamp TEXT,
  is_stale INTEGER NOT NULL
    CHECK (
      is_stale IN (0, 1)
    ),
  UNIQUE (
    category,
    symbol COLLATE NOCASE,
    captured_at,
    source COLLATE NOCASE
  )
) STRICT;

CREATE INDEX IF NOT EXISTS
  idx_market_snapshots_symbol_captured_at
ON market_snapshots (
  symbol COLLATE NOCASE,
  captured_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_market_snapshots_captured_at
ON market_snapshots (
  captured_at DESC
);
