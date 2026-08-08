import type {
  DatabaseSync,
  StatementSync,
} from "node:sqlite";

import type {
  MarketSnapshot,
  MarketSnapshotCategory,
} from "@/lib/marketSnapshots/marketSnapshot";
import type {
  MarketSnapshotRepository,
} from "@/lib/marketSnapshots/marketSnapshotRepository";
import {
  fromSqliteMarketSnapshotRow,
  toSqliteMarketSnapshotParameters,
  type SqliteMarketSnapshotRow,
} from "@/lib/marketSnapshots/sqliteMarketSnapshotMapper";

const insertMarketSnapshotSql = `
  INSERT INTO market_snapshots (
    id,
    symbol,
    category,
    captured_at,
    price,
    price_change_24h,
    volume_24h_usd,
    market_cap_usd,
    volatility_24h,
    data_source,
    source,
    provider_timestamp,
    is_stale
  ) VALUES (
    $id,
    $symbol,
    $category,
    $capturedAt,
    $price,
    $priceChange24h,
    $volume24hUsd,
    $marketCapUsd,
    $volatility24h,
    $dataSource,
    $source,
    $providerTimestamp,
    $isStale
  );
`;

const selectColumns = `
  id,
  symbol,
  category,
  captured_at,
  price,
  price_change_24h,
  volume_24h_usd,
  market_cap_usd,
  volatility_24h,
  data_source,
  source,
  provider_timestamp,
  is_stale
`;

export class SqliteMarketSnapshotRepository
  implements MarketSnapshotRepository
{
  private readonly database:
    DatabaseSync;

  private readonly insertStatement:
    StatementSync;

  constructor(
    database: DatabaseSync,
  ) {
    this.database = database;

    this.insertStatement =
      database.prepare(
        insertMarketSnapshotSql,
      );
  }

  getAll(): MarketSnapshot[] {
    const rows =
      this.database
        .prepare(`
          SELECT ${selectColumns}
          FROM market_snapshots
          ORDER BY
            captured_at ASC,
            id ASC;
        `)
        .all() as
          SqliteMarketSnapshotRow[];

    return rows.map(
      fromSqliteMarketSnapshotRow,
    );
  }

  getById(
    snapshotId: string,
  ): MarketSnapshot | undefined {
    const row =
      this.database
        .prepare(`
          SELECT ${selectColumns}
          FROM market_snapshots
          WHERE id = ? COLLATE NOCASE
          LIMIT 1;
        `)
        .get(
          snapshotId.trim(),
        ) as
          | SqliteMarketSnapshotRow
          | undefined;

    return row
      ? fromSqliteMarketSnapshotRow(
          row,
        )
      : undefined;
  }

  getBySymbol(
    symbol: string,
  ): MarketSnapshot[] {
    const rows =
      this.database
        .prepare(`
          SELECT ${selectColumns}
          FROM market_snapshots
          WHERE symbol = ? COLLATE NOCASE
          ORDER BY
            captured_at ASC,
            id ASC;
        `)
        .all(
          symbol.trim(),
        ) as
          SqliteMarketSnapshotRow[];

    return rows.map(
      fromSqliteMarketSnapshotRow,
    );
  }

  getByCategory(
    category: MarketSnapshotCategory,
  ): MarketSnapshot[] {
    const rows =
      this.database
        .prepare(`
          SELECT ${selectColumns}
          FROM market_snapshots
          WHERE category = ?
          ORDER BY
            captured_at ASC,
            id ASC;
        `)
        .all(
          category,
        ) as
          SqliteMarketSnapshotRow[];

    return rows.map(
      fromSqliteMarketSnapshotRow,
    );
  }

  getLatestBySymbol(
    symbol: string,
  ): MarketSnapshot | undefined {
    const row =
      this.database
        .prepare(`
          SELECT ${selectColumns}
          FROM market_snapshots
          WHERE symbol = ? COLLATE NOCASE
          ORDER BY
            captured_at DESC,
            id DESC
          LIMIT 1;
        `)
        .get(
          symbol.trim(),
        ) as
          | SqliteMarketSnapshotRow
          | undefined;

    return row
      ? fromSqliteMarketSnapshotRow(
          row,
        )
      : undefined;
  }

  save(
    snapshot: MarketSnapshot,
  ): MarketSnapshot {
    const savedSnapshots =
      this.saveMany([
        snapshot,
      ]);

    const savedSnapshot =
      savedSnapshots[0];

    if (!savedSnapshot) {
      throw new Error(
        "Market snapshot was not saved.",
      );
    }

    return savedSnapshot;
  }

  saveMany(
    snapshots: MarketSnapshot[],
  ): MarketSnapshot[] {
    if (
      snapshots.length === 0
    ) {
      return [];
    }

    let transactionStarted =
      false;

    try {
      this.database.exec(
        "BEGIN IMMEDIATE TRANSACTION;",
      );

      transactionStarted = true;

      for (
        const snapshot
        of snapshots
      ) {
        this.insertStatement.run(
          toSqliteMarketSnapshotParameters(
            snapshot,
          ),
        );
      }

      this.database.exec(
        "COMMIT;",
      );

      transactionStarted = false;
    } catch (error) {
      if (transactionStarted) {
        try {
          this.database.exec(
            "ROLLBACK;",
          );
        } catch {
          // Preserve the original SQLite error.
        }
      }

      throw translateSqliteError(
        error,
      );
    }

    return snapshots.map(
      cloneMarketSnapshot,
    );
  }

  close(): void {
    if (this.database.isOpen) {
      this.database.close();
    }
  }
}

function translateSqliteError(
  error: unknown,
): Error {
  if (!(error instanceof Error)) {
    return new Error(
      "Unknown SQLite market snapshot repository error.",
    );
  }

  const normalizedMessage =
    error.message.toLowerCase();

  const isIdConstraint =
    normalizedMessage.includes(
      "market_snapshots.id",
    ) ||
    normalizedMessage.includes(
      "unique constraint failed: market_snapshots.id",
    );

  if (isIdConstraint) {
    return new Error(
      "Market snapshot ID already exists.",
      {
        cause: error,
      },
    );
  }

  const isCaptureConstraint =
    normalizedMessage.includes(
      "market_snapshots.category",
    ) &&
    normalizedMessage.includes(
      "market_snapshots.symbol",
    ) &&
    normalizedMessage.includes(
      "market_snapshots.captured_at",
    ) &&
    normalizedMessage.includes(
      "market_snapshots.source",
    );

  if (isCaptureConstraint) {
    return new Error(
      "Market snapshot capture already exists.",
      {
        cause: error,
      },
    );
  }

  return error;
}

function cloneMarketSnapshot(
  snapshot: MarketSnapshot,
): MarketSnapshot {
  return {
    ...snapshot,
  };
}
