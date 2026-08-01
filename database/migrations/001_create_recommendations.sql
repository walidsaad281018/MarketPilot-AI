CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY COLLATE NOCASE,
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
  entry_price REAL NOT NULL
    CHECK (entry_price > 0),
  evaluation_price REAL
    CHECK (
      evaluation_price IS NULL
      OR evaluation_price > 0
    ),
  target_return REAL NOT NULL
    CHECK (
      target_return > 0
      AND target_return <= 100
    ),
  score REAL NOT NULL
    CHECK (
      score >= 0
      AND score <= 100
    ),
  confidence REAL NOT NULL
    CHECK (
      confidence >= 0
      AND confidence <= 100
    ),
  target_price REAL NOT NULL
    CHECK (target_price > 0),
  actual_return REAL,
  status TEXT NOT NULL
    CHECK (
      status IN (
        'Pending',
        'Successful',
        'Unsuccessful'
      )
    ),
  target_reached INTEGER
    CHECK (
      target_reached IS NULL
      OR target_reached IN (0, 1)
    ),
  UNIQUE (
    category,
    symbol COLLATE NOCASE,
    published_at
  )
) STRICT;
