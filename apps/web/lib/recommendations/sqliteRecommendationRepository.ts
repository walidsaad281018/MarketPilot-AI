import {
  DatabaseSync,
  type StatementSync,
} from "node:sqlite";

import type {
  RecommendationRecord,
} from "@/data/recommendations";
import type {
  RecommendationCategory,
  RecommendationWriteDataSource,
} from "@/lib/recommendations/recommendationDataSource";
import {
  fromSqliteRow,
  toSqliteParameters,
  type SqliteRecommendationRow,
} from "@/lib/recommendations/sqliteRecommendationMapper";

const createRecommendationsTableSql = `
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
`;

const insertRecommendationSql = `
  INSERT INTO recommendations (
    id,
    asset,
    symbol,
    category,
    published_at,
    evaluation_date,
    entry_price,
    evaluation_price,
    target_return,
    score,
    confidence,
    target_price,
    actual_return,
    status,
    target_reached
  ) VALUES (
    $id,
    $asset,
    $symbol,
    $category,
    $publishedAt,
    $evaluationDate,
    $entryPrice,
    $evaluationPrice,
    $targetReturn,
    $score,
    $confidence,
    $targetPrice,
    $actualReturn,
    $status,
    $targetReached
  );
`;

const updateRecommendationSql = `
  UPDATE recommendations
  SET
    asset = $asset,
    symbol = $symbol,
    category = $category,
    published_at = $publishedAt,
    evaluation_date = $evaluationDate,
    entry_price = $entryPrice,
    evaluation_price = $evaluationPrice,
    target_return = $targetReturn,
    score = $score,
    confidence = $confidence,
    target_price = $targetPrice,
    actual_return = $actualReturn,
    status = $status,
    target_reached = $targetReached
  WHERE id = $id COLLATE NOCASE;
`;

const selectColumns = `
  id,
  asset,
  symbol,
  category,
  published_at,
  evaluation_date,
  entry_price,
  evaluation_price,
  target_return,
  score,
  confidence,
  target_price,
  actual_return,
  status,
  target_reached
`;

type RecommendationStatus =
  | "Pending"
  | "Successful"
  | "Unsuccessful";

type SuccessRateRow = {
  completed_count: number;
  successful_count: number | null;
};

export class SqliteRecommendationRepository
  implements RecommendationWriteDataSource
{
  private readonly database:
    DatabaseSync;

  private readonly insertStatement:
    StatementSync;

  private readonly updateStatement:
    StatementSync;

  constructor(
    database: DatabaseSync,
  ) {
    this.database = database;

    this.database.exec(
      createRecommendationsTableSql,
    );

    this.insertStatement =
      this.database.prepare(
        insertRecommendationSql,
      );

    this.updateStatement =
      this.database.prepare(
        updateRecommendationSql,
      );
  }

  static open(
    databasePath: string,
  ): SqliteRecommendationRepository {
    const database =
      new DatabaseSync(
        databasePath,
        {
          timeout: 5_000,
        },
      );

    return new SqliteRecommendationRepository(
      database,
    );
  }

  getAll(): RecommendationRecord[] {
    const statement =
      this.database.prepare(`
        SELECT ${selectColumns}
        FROM recommendations
        ORDER BY
          published_at ASC,
          id ASC;
      `);

    const rows =
      statement.all() as
        SqliteRecommendationRow[];

    return rows.map(
      fromSqliteRow,
    );
  }

  getById(
    recommendationId: string,
  ): RecommendationRecord | undefined {
    const statement =
      this.database.prepare(`
        SELECT ${selectColumns}
        FROM recommendations
        WHERE id = ? COLLATE NOCASE
        LIMIT 1;
      `);

    const row =
      statement.get(
        recommendationId.trim(),
      ) as
        | SqliteRecommendationRow
        | undefined;

    return row
      ? fromSqliteRow(row)
      : undefined;
  }

  getBySymbol(
    symbol: string,
  ): RecommendationRecord[] {
    const statement =
      this.database.prepare(`
        SELECT ${selectColumns}
        FROM recommendations
        WHERE symbol = ? COLLATE NOCASE
        ORDER BY
          published_at ASC,
          id ASC;
      `);

    const rows =
      statement.all(
        symbol.trim(),
      ) as SqliteRecommendationRow[];

    return rows.map(
      fromSqliteRow,
    );
  }

  getByCategory(
    category: RecommendationCategory,
  ): RecommendationRecord[] {
    const statement =
      this.database.prepare(`
        SELECT ${selectColumns}
        FROM recommendations
        WHERE category = ?
        ORDER BY
          published_at ASC,
          id ASC;
      `);

    const rows =
      statement.all(
        category,
      ) as SqliteRecommendationRow[];

    return rows.map(
      fromSqliteRow,
    );
  }

  getPending(): RecommendationRecord[] {
    return this.getByStatus(
      "Pending",
    );
  }

  getSuccessful(): RecommendationRecord[] {
    return this.getByStatus(
      "Successful",
    );
  }

  getUnsuccessful(): RecommendationRecord[] {
    return this.getByStatus(
      "Unsuccessful",
    );
  }

  getSuccessRate(): number {
    const statement =
      this.database.prepare(`
        SELECT
          COUNT(*) AS completed_count,
          SUM(
            CASE
              WHEN status = 'Successful'
              THEN 1
              ELSE 0
            END
          ) AS successful_count
        FROM recommendations
        WHERE status <> 'Pending';
      `);

    const row =
      statement.get() as
        SuccessRateRow;

    if (
      row.completed_count === 0
    ) {
      return 0;
    }

    return Math.round(
      (
        (
          row.successful_count ??
          0
        ) /
        row.completed_count
      ) * 100,
    );
  }

  save(
    recommendation:
      RecommendationRecord,
  ): RecommendationRecord {
    const savedRecommendations =
      this.saveMany([
        recommendation,
      ]);

    const savedRecommendation =
      savedRecommendations[0];

    if (!savedRecommendation) {
      throw new Error(
        "Recommendation was not saved.",
      );
    }

    return savedRecommendation;
  }

  saveMany(
    recommendations:
      RecommendationRecord[],
  ): RecommendationRecord[] {
    if (
      recommendations.length === 0
    ) {
      return [];
    }

    let transactionStarted =
      false;

    try {
      this.database.exec(
        "BEGIN IMMEDIATE TRANSACTION;",
      );

      transactionStarted =
        true;

      for (
        const recommendation
        of recommendations
      ) {
        this.insertStatement.run(
          toSqliteParameters(
            recommendation,
          ),
        );
      }

      this.database.exec(
        "COMMIT;",
      );

      transactionStarted =
        false;
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

    return recommendations.map(
      cloneRecommendation,
    );
  }

  update(
    recommendation:
      RecommendationRecord,
  ): RecommendationRecord {
    const [updatedRecommendation] =
      this.updateMany([
        recommendation,
      ]);

    if (!updatedRecommendation) {
      throw new Error(
        "Recommendation was not updated.",
      );
    }

    return updatedRecommendation;
  }

  updateMany(
    recommendations:
      RecommendationRecord[],
  ): RecommendationRecord[] {
    if (
      recommendations.length === 0
    ) {
      return [];
    }

    const normalizedIds =
      new Set<string>();

    for (
      const recommendation
      of recommendations
    ) {
      const normalizedId =
        recommendation.id
          .trim()
          .toUpperCase();

      if (
        normalizedIds.has(
          normalizedId,
        )
      ) {
        throw new Error(
          `Duplicate recommendation ID in update batch: ${recommendation.id}.`,
        );
      }

      normalizedIds.add(
        normalizedId,
      );
    }

    let transactionStarted =
      false;

    try {
      this.database.exec(
        "BEGIN IMMEDIATE TRANSACTION;",
      );

      transactionStarted =
        true;

      for (
        const recommendation
        of recommendations
      ) {
        const result =
          this.updateStatement.run(
            toSqliteParameters(
              recommendation,
            ),
          );

        if (
          Number(
            result.changes,
          ) === 0
        ) {
          throw new Error(
            `Recommendation does not exist: ${recommendation.id}.`,
          );
        }
      }

      this.database.exec(
        "COMMIT;",
      );

      transactionStarted =
        false;
    } catch (error) {
      if (transactionStarted) {
        try {
          this.database.exec(
            "ROLLBACK;",
          );
        } catch {
          // Preserve the original update error.
        }
      }

      throw translateSqliteError(
        error,
      );
    }

    return recommendations.map(
      cloneRecommendation,
    );
  }

  close(): void {
    if (this.database.isOpen) {
      this.database.close();
    }
  }

  private getByStatus(
    status: RecommendationStatus,
  ): RecommendationRecord[] {
    const statement =
      this.database.prepare(`
        SELECT ${selectColumns}
        FROM recommendations
        WHERE status = ?
        ORDER BY
          published_at ASC,
          id ASC;
      `);

    const rows =
      statement.all(
        status,
      ) as SqliteRecommendationRow[];

    return rows.map(
      fromSqliteRow,
    );
  }
}

function translateSqliteError(
  error: unknown,
): Error {
  if (!(error instanceof Error)) {
    return new Error(
      "Unknown SQLite recommendation repository error.",
    );
  }

  const normalizedMessage =
    error.message.toLowerCase();

  const isIdConstraint =
    normalizedMessage.includes(
      "recommendations.id",
    ) ||
    normalizedMessage.includes(
      "unique constraint failed: recommendations.id",
    );

  if (isIdConstraint) {
    return new Error(
      "Recommendation ID already exists.",
      {
        cause: error,
      },
    );
  }

  const isPublicationConstraint =
    normalizedMessage.includes(
      "recommendations.category",
    ) &&
    normalizedMessage.includes(
      "recommendations.symbol",
    ) &&
    normalizedMessage.includes(
      "recommendations.published_at",
    );

  if (isPublicationConstraint) {
    return new Error(
      "Recommendation publication already exists.",
      {
        cause: error,
      },
    );
  }

  return error;
}

function cloneRecommendation(
  recommendation:
    RecommendationRecord,
): RecommendationRecord {
  return {
    ...recommendation,
  };
}
