import type {
  Sql,
} from "postgres";

import {
  fromPostgresMarketSnapshotRow,
  toPostgresMarketSnapshotParameters,
  type PostgresMarketSnapshotRow,
} from "@/lib/database/postgres/postgresMarketSnapshotMapper";
import type {
  MarketSnapshot,
  MarketSnapshotCategory,
} from "@/lib/marketSnapshots/marketSnapshot";
import type {
  MarketSnapshotRepository,
} from "@/lib/marketSnapshots/marketSnapshotRepository";

export class PostgresMarketSnapshotRepository
  implements MarketSnapshotRepository
{
  constructor(
    private readonly sql: Sql,
  ) {}

  async getAll():
    Promise<MarketSnapshot[]> {
    const rows =
      await this.sql<PostgresMarketSnapshotRow[]>`
        SELECT
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
        FROM market_snapshots
        ORDER BY
          captured_at ASC,
          id ASC
      `;

    return rows.map(
      fromPostgresMarketSnapshotRow,
    );
  }

  async getById(
    snapshotId: string,
  ):
    Promise<
      MarketSnapshot | undefined
    > {
    const rows =
      await this.sql<PostgresMarketSnapshotRow[]>`
        SELECT
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
        FROM market_snapshots
        WHERE
          upper(id) =
          upper(${snapshotId.trim()})
        LIMIT 1
      `;

    const row =
      rows[0];

    return row
      ? fromPostgresMarketSnapshotRow(
          row,
        )
      : undefined;
  }

  async getBySymbol(
    symbol: string,
  ): Promise<MarketSnapshot[]> {
    const rows =
      await this.sql<PostgresMarketSnapshotRow[]>`
        SELECT
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
        FROM market_snapshots
        WHERE
          upper(symbol) =
          upper(${symbol.trim()})
        ORDER BY
          captured_at ASC,
          id ASC
      `;

    return rows.map(
      fromPostgresMarketSnapshotRow,
    );
  }

  async getByCategory(
    category: MarketSnapshotCategory,
  ): Promise<MarketSnapshot[]> {
    const rows =
      await this.sql<PostgresMarketSnapshotRow[]>`
        SELECT
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
        FROM market_snapshots
        WHERE category = ${category}
        ORDER BY
          captured_at ASC,
          id ASC
      `;

    return rows.map(
      fromPostgresMarketSnapshotRow,
    );
  }

  async getLatestBySymbol(
    symbol: string,
  ):
    Promise<
      MarketSnapshot | undefined
    > {
    const rows =
      await this.sql<PostgresMarketSnapshotRow[]>`
        SELECT
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
        FROM market_snapshots
        WHERE
          upper(symbol) =
          upper(${symbol.trim()})
        ORDER BY
          captured_at DESC,
          id DESC
        LIMIT 1
      `;

    const row =
      rows[0];

    return row
      ? fromPostgresMarketSnapshotRow(
          row,
        )
      : undefined;
  }

  async save(
    snapshot: MarketSnapshot,
  ): Promise<MarketSnapshot> {
    const saved =
      await this.saveMany([
        snapshot,
      ]);

    const result =
      saved[0];

    if (!result) {
      throw new Error(
        "Market snapshot was not saved.",
      );
    }

    return result;
  }

  async saveMany(
    snapshots: MarketSnapshot[],
  ): Promise<MarketSnapshot[]> {
    if (
      snapshots.length === 0
    ) {
      return [];
    }

    validateBatchIds(
      snapshots,
    );

    validateBatchCaptureKeys(
      snapshots,
    );

    try {
      await this.sql.begin(
        async (transaction) => {
          for (
            const snapshot
            of snapshots
          ) {
            const parameters =
              toPostgresMarketSnapshotParameters(
                snapshot,
              );

            const existingIds =
              await transaction<
                { id: string }[]
              >`
                SELECT id
                FROM market_snapshots
                WHERE
                  upper(id) =
                  upper(${parameters.id.trim()})
                LIMIT 1
              `;

            if (
              existingIds.length > 0
            ) {
              throw new Error(
                `Market snapshot ID already exists: ${snapshot.id}.`,
              );
            }

            await transaction`
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
              )
              VALUES (
                ${parameters.id},
                ${parameters.symbol},
                ${parameters.category},
                ${parameters.capturedAt},
                ${parameters.price},
                ${parameters.priceChange24h},
                ${parameters.volume24hUsd},
                ${parameters.marketCapUsd},
                ${parameters.volatility24h},
                ${parameters.dataSource},
                ${parameters.source},
                ${parameters.providerTimestamp},
                ${parameters.isStale}
              )
            `;
          }
        },
      );
    } catch (error) {
      throw translatePostgresError(
        error,
      );
    }

    return snapshots.map(
      cloneMarketSnapshot,
    );
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}

function validateBatchIds(
  snapshots: MarketSnapshot[],
): void {
  const normalizedIds =
    new Set<string>();

  for (
    const snapshot
    of snapshots
  ) {
    const normalizedId =
      snapshot.id
        .trim()
        .toUpperCase();

    if (
      normalizedIds.has(
        normalizedId,
      )
    ) {
      throw new Error(
        `Duplicate market snapshot ID in save batch: ${snapshot.id}.`,
      );
    }

    normalizedIds.add(
      normalizedId,
    );
  }
}

function validateBatchCaptureKeys(
  snapshots: MarketSnapshot[],
): void {
  const keys =
    new Set<string>();

  for (
    const snapshot
    of snapshots
  ) {
    const key = [
      snapshot.category,
      snapshot.symbol
        .trim()
        .toUpperCase(),
      snapshot.capturedAt,
      snapshot.source,
    ].join(":");

    if (
      keys.has(key)
    ) {
      throw new Error(
        `Duplicate market snapshot capture in save batch for ${snapshot.symbol} on ${snapshot.capturedAt}.`,
      );
    }

    keys.add(key);
  }
}

function translatePostgresError(
  error: unknown,
): Error {
  if (!(error instanceof Error)) {
    return new Error(
      "Unknown PostgreSQL market snapshot repository error.",
    );
  }

  const postgresError =
    error as Error & {
      code?: string;
      constraint_name?: string;
      constraint?: string;
    };

  if (
    postgresError.code ===
    "23505"
  ) {
    const constraint =
      (
        postgresError
          .constraint_name ??
        postgresError
          .constraint ??
        ""
      ).toLowerCase();

    if (
      constraint.includes(
        "market_snapshots_capture_unique",
      )
    ) {
      return new Error(
        "Market snapshot capture already exists.",
        {
          cause: error,
        },
      );
    }

    if (
      constraint.includes(
        "market_snapshots_pkey",
      ) ||
      constraint.includes(
        "market_snapshots_id_upper",
      )
    ) {
      return new Error(
        "Market snapshot ID already exists.",
        {
          cause: error,
        },
      );
    }
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
