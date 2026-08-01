import {
  getLiveCryptoOpportunities,
  type LiveCryptoOpportunity,
} from "@/data/getLiveCryptoOpportunities";
import type {
  RecommendationSourceRecord,
} from "@/data/recommendations";
import {
  buildRecommendation,
} from "@/lib/recommendations/recommendationBuilder";

const DEFAULT_RECOMMENDATION_LIMIT = 3;
const DEFAULT_EVALUATION_DAYS = 7;

export type GetLiveCryptoRecommendationCandidatesOptions = {
  limit?: number;
  evaluationDays?: number;
};

export async function getLiveCryptoRecommendationCandidates({
  limit = DEFAULT_RECOMMENDATION_LIMIT,
  evaluationDays = DEFAULT_EVALUATION_DAYS,
}: GetLiveCryptoRecommendationCandidatesOptions = {}): Promise<
  RecommendationSourceRecord[]
> {
  validatePositiveInteger(
    limit,
    "Recommendation limit",
  );

  validatePositiveInteger(
    evaluationDays,
    "Evaluation days",
  );

  const opportunities =
    await getLiveCryptoOpportunities();

  return opportunities
    .filter(
      hasVerifiedMarketPrice,
    )
    .slice(
      0,
      limit,
    )
    .map(
      (opportunity) =>
        buildRecommendation({
          opportunity,
          entryPrice:
            opportunity.currentPriceUsd,
          evaluationDays,
        }),
    );
}

function hasVerifiedMarketPrice(
  opportunity: LiveCryptoOpportunity,
): opportunity is LiveCryptoOpportunity & {
  currentPriceUsd: number;
} {
  return (
    opportunity.currentPriceUsd !== null &&
    Number.isFinite(
      opportunity.currentPriceUsd,
    ) &&
    opportunity.currentPriceUsd > 0
  );
}

function validatePositiveInteger(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `${fieldName} must be a positive integer.`,
    );
  }
}