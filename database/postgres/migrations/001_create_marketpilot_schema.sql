BEGIN;

CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT NOT NULL,
  asset TEXT NOT NULL,
  symbol TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (
      category IN (
        'Crypto',
        'Stock',
        'ETF'
      )
    ),
  published_at TEXT NOT NULL,
  evaluation_date TEXT NOT NULL,
  entry_price DOUBLE PRECISION NOT NULL
    CHECK (entry_price > 0),
  evaluation_price DOUBLE PRECISION
    CHECK (
      evaluation_price IS NULL
      OR evaluation_price > 0
    ),
  target_return DOUBLE PRECISION NOT NULL
    CHECK (
      target_return > 0
      AND target_return <= 100
    ),
  score DOUBLE PRECISION NOT NULL
    CHECK (
      score >= 0
      AND score <= 100
    ),
  confidence DOUBLE PRECISION NOT NULL
    CHECK (
      confidence >= 0
      AND confidence <= 100
    ),
  target_price DOUBLE PRECISION NOT NULL
    CHECK (target_price > 0),
  actual_return DOUBLE PRECISION,
  status TEXT NOT NULL
    CHECK (
      status IN (
        'Pending',
        'Successful',
        'Unsuccessful'
      )
    ),
  target_reached BOOLEAN,
  CONSTRAINT recommendations_pkey
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS
  recommendations_publication_unique_idx
ON recommendations (
  category,
  upper(symbol),
  published_at
);

CREATE UNIQUE INDEX IF NOT EXISTS
  recommendations_id_upper_unique_idx
ON recommendations (
  upper(id)
);

CREATE TABLE IF NOT EXISTS market_snapshots (
  id TEXT NOT NULL,
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
  price DOUBLE PRECISION NOT NULL
    CHECK (price > 0),
  price_change_24h DOUBLE PRECISION NOT NULL,
  volume_24h_usd DOUBLE PRECISION NOT NULL,
  market_cap_usd DOUBLE PRECISION,
  volatility_24h DOUBLE PRECISION NOT NULL,
  data_source TEXT NOT NULL
    CHECK (
      data_source IN (
        'live',
        'fallback'
      )
    ),
  source TEXT NOT NULL,
  provider_timestamp TEXT,
  is_stale BOOLEAN NOT NULL,
  CONSTRAINT market_snapshots_pkey
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS
  market_snapshots_capture_unique_idx
ON market_snapshots (
  category,
  upper(symbol),
  captured_at,
  source
);

CREATE INDEX IF NOT EXISTS
  market_snapshots_symbol_captured_at_idx
ON market_snapshots (
  upper(symbol),
  captured_at DESC
);

CREATE UNIQUE INDEX IF NOT EXISTS
  market_snapshots_id_upper_unique_idx
ON market_snapshots (
  upper(id)
);

COMMIT;
