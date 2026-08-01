import {
  productionApplication,
} from "@/lib/application/productionApplication";

export type {
  RecommendationFilters,
  RecommendationQuery,
  RecommendationServiceDependencies,
} from "@/lib/services/api/recommendationServiceCore";

export {
  RecommendationService,
} from "@/lib/services/api/recommendationServiceCore";

export const recommendationService =
  productionApplication
    .recommendationService;
