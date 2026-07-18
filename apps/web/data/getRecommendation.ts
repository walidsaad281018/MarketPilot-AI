import {
  recommendationRecords,
  type RecommendationRecord,
} from "@/data/recommendations";

export function getRecommendationById(
  recommendationId: string,
): RecommendationRecord | undefined {
  const normalizedId = decodeURIComponent(
    recommendationId,
  )
    .trim()
    .toUpperCase();

  return recommendationRecords.find(
    (record) =>
      record.id.toUpperCase() === normalizedId,
  );
}