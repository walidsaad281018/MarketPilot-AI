import type {
  Sql,
} from "postgres";

import type {
  RecommendationRecord,
} from "@/data/recommendations";
import {
  fromPostgresRow,
  toPostgresParameters,
  type PostgresRecommendationRow,
} from "@/lib/database/postgres/postgresRecommendationMapper";
import type {
  RecommendationCategory,
  RecommendationWriteDataSource,
} from "@/lib/recommendations/recommendationDataSource";

type RecommendationStatus =
  | "Pending"
  | "Successful"
  | "Unsuccessful";

type SuccessRateRow = {
  completed_count:
    number | string;
  successful_count:
    number | string | null;
};

type UpdatedRow = {
  id: string;
};

export class PostgresRecommendationRepository
  implements RecommendationWriteDataSource
{
  constructor(
    private readonly sql: Sql,
  ) {}

  async getAll():
    Promise<RecommendationRecord[]> {
    const rows =
      await this.sql<PostgresRecommendationRow[]>`
        SELECT
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
        FROM recommendations
        ORDER BY
          published_at ASC,
          id ASC
      `;

    return rows.map(
      fromPostgresRow,
    );
  }

  async getById(
    recommendationId: string,
  ):
    Promise<
      RecommendationRecord | undefined
    > {
    const rows =
      await this.sql<PostgresRecommendationRow[]>`
        SELECT
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
        FROM recommendations
        WHERE
          upper(id) =
          upper(${recommendationId.trim()})
        LIMIT 1
      `;

    const row =
      rows[0];

    return row
      ? fromPostgresRow(row)
      : undefined;
  }

  async getBySymbol(
    symbol: string,
  ): Promise<RecommendationRecord[]> {
    const rows =
      await this.sql<PostgresRecommendationRow[]>`
        SELECT
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
        FROM recommendations
        WHERE
          upper(symbol) =
          upper(${symbol.trim()})
        ORDER BY
          published_at ASC,
          id ASC
      `;

    return rows.map(
      fromPostgresRow,
    );
  }

  async getByCategory(
    category: RecommendationCategory,
  ): Promise<RecommendationRecord[]> {
    const rows =
      await this.sql<PostgresRecommendationRow[]>`
        SELECT
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
        FROM recommendations
        WHERE category = ${category}
        ORDER BY
          published_at ASC,
          id ASC
      `;

    return rows.map(
      fromPostgresRow,
    );
  }

  async getPending():
    Promise<RecommendationRecord[]> {
    return this.getByStatus(
      "Pending",
    );
  }

  async getSuccessful():
    Promise<RecommendationRecord[]> {
    return this.getByStatus(
      "Successful",
    );
  }

  async getUnsuccessful():
    Promise<RecommendationRecord[]> {
    return this.getByStatus(
      "Unsuccessful",
    );
  }

  async getSuccessRate():
    Promise<number> {
    const rows =
      await this.sql<SuccessRateRow[]>`
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
        WHERE status <> 'Pending'
      `;

    const row =
      rows[0];

    const completedCount =
      Number(
        row?.completed_count ??
        0,
      );

    if (completedCount === 0) {
      return 0;
    }

    const successfulCount =
      Number(
        row?.successful_count ??
        0,
      );

    return Math.round(
      (
        successfulCount /
        completedCount
      ) * 100,
    );
  }

  async save(
    recommendation:
      RecommendationRecord,
  ): Promise<RecommendationRecord> {
    const saved =
      await this.saveMany([
        recommendation,
      ]);

    const result =
      saved[0];

    if (!result) {
      throw new Error(
        "Recommendation was not saved.",
      );
    }

    return result;
  }

  async saveMany(
    recommendations:
      RecommendationRecord[],
  ): Promise<RecommendationRecord[]> {
    if (
      recommendations.length === 0
    ) {
      return [];
    }

    validateBatchIds(
      recommendations,
      "save",
    );

    validateBatchPublicationKeys(
      recommendations,
    );

    try {
      await this.sql.begin(
        async (transaction) => {
          for (
            const recommendation
            of recommendations
          ) {
            const parameters =
              toPostgresParameters(
                recommendation,
              );

            const existingIds =
              await transaction<
                { id: string }[]
              >`
                SELECT id
                FROM recommendations
                WHERE
                  upper(id) =
                  upper(${parameters.id.trim()})
                LIMIT 1
              `;

            if (
              existingIds.length > 0
            ) {
              throw new Error(
                `Recommendation ID already exists: ${recommendation.id}.`,
              );
            }

            await transaction`
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
              )
              VALUES (
                ${parameters.id},
                ${parameters.asset},
                ${parameters.symbol},
                ${parameters.category},
                ${parameters.publishedAt},
                ${parameters.evaluationDate},
                ${parameters.entryPrice},
                ${parameters.evaluationPrice},
                ${parameters.targetReturn},
                ${parameters.score},
                ${parameters.confidence},
                ${parameters.targetPrice},
                ${parameters.actualReturn},
                ${parameters.status},
                ${parameters.targetReached}
              )
            `;
          }
        },
      );
    }
    catch (error) {
      throw translatePostgresError(
        error,
      );
    }

    return recommendations.map(
      cloneRecommendation,
    );
  }

  async update(
    recommendation:
      RecommendationRecord,
  ): Promise<RecommendationRecord> {
    const updated =
      await this.updateMany([
        recommendation,
      ]);

    const result =
      updated[0];

    if (!result) {
      throw new Error(
        "Recommendation was not updated.",
      );
    }

    return result;
  }

  async updateMany(
    recommendations:
      RecommendationRecord[],
  ): Promise<RecommendationRecord[]> {
    if (
      recommendations.length === 0
    ) {
      return [];
    }

    validateBatchIds(
      recommendations,
      "update",
    );

    try {
      await this.sql.begin(
        async (transaction) => {
          for (
            const recommendation
            of recommendations
          ) {
            const parameters =
              toPostgresParameters(
                recommendation,
              );

            const rows =
              await transaction<
                UpdatedRow[]
              >`
                UPDATE recommendations
                SET
                  asset =
                    ${parameters.asset},
                  symbol =
                    ${parameters.symbol},
                  category =
                    ${parameters.category},
                  published_at =
                    ${parameters.publishedAt},
                  evaluation_date =
                    ${parameters.evaluationDate},
                  entry_price =
                    ${parameters.entryPrice},
                  evaluation_price =
                    ${parameters.evaluationPrice},
                  target_return =
                    ${parameters.targetReturn},
                  score =
                    ${parameters.score},
                  confidence =
                    ${parameters.confidence},
                  target_price =
                    ${parameters.targetPrice},
                  actual_return =
                    ${parameters.actualReturn},
                  status =
                    ${parameters.status},
                  target_reached =
                    ${parameters.targetReached}
                WHERE
                  upper(id) =
                  upper(${parameters.id.trim()})
                RETURNING id
              `;

            if (
              rows.length === 0
            ) {
              throw new Error(
                `Recommendation does not exist: ${recommendation.id}.`,
              );
            }
          }
        },
      );
    }
    catch (error) {
      throw translatePostgresError(
        error,
      );
    }

    return recommendations.map(
      cloneRecommendation,
    );
  }

  async close(): Promise<void> {
    await this.sql.end();
  }

  private async getByStatus(
    status: RecommendationStatus,
  ): Promise<RecommendationRecord[]> {
    const rows =
      await this.sql<PostgresRecommendationRow[]>`
        SELECT
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
        FROM recommendations
        WHERE status = ${status}
        ORDER BY
          published_at ASC,
          id ASC
      `;

    return rows.map(
      fromPostgresRow,
    );
  }
}

function validateBatchIds(
  recommendations:
    RecommendationRecord[],
  operation: "save" | "update",
): void {
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
      const message =
        operation === "save"
          ? `Duplicate recommendation ID in save batch: ${recommendation.id}.`
          : `Duplicate recommendation ID in update batch: ${recommendation.id}.`;

      throw new Error(
        message,
      );
    }

    normalizedIds.add(
      normalizedId,
    );
  }
}

function validateBatchPublicationKeys(
  recommendations:
    RecommendationRecord[],
): void {
  const keys =
    new Set<string>();

  for (
    const recommendation
    of recommendations
  ) {
    const key = [
      recommendation.category,
      recommendation.symbol
        .trim()
        .toUpperCase(),
      recommendation.publishedAt,
    ].join(":");

    if (keys.has(key)) {
      throw new Error(
        `Duplicate recommendation publication in save batch for ${recommendation.symbol} on ${recommendation.publishedAt}.`,
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
      "Unknown PostgreSQL recommendation repository error.",
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
        "recommendations_publication_unique",
      )
    ) {
      return new Error(
        "Recommendation publication already exists.",
        {
          cause: error,
        },
      );
    }

    if (
      constraint.includes(
        "recommendations_pkey",
      ) ||
      constraint.includes(
        "recommendations_id_upper",
      )
    ) {
      return new Error(
        "Recommendation ID already exists.",
        {
          cause: error,
        },
      );
    }
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
