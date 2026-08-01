import {
  getLiveCryptoRecommendationCandidates,
  type GetLiveCryptoRecommendationCandidatesOptions,
} from "@/data/getLiveCryptoRecommendationCandidates";
import {
  recommendationPublisher,
  type PublishRecommendationsResult,
  type RecommendationPublisher,
} from "@/lib/recommendations/recommendationPublisher";

type CandidateGenerator =
  typeof getLiveCryptoRecommendationCandidates;

type Publisher = Pick<
  RecommendationPublisher,
  "publish"
>;

type LiveCryptoRecommendationPublicationDependencies = {
  candidateGenerator?: CandidateGenerator;
  publisher?: Publisher;
};

export class LiveCryptoRecommendationPublicationService {
  private readonly candidateGenerator:
    CandidateGenerator;

  private readonly publisher: Publisher;

  constructor({
    candidateGenerator =
      getLiveCryptoRecommendationCandidates,
    publisher = recommendationPublisher,
  }: LiveCryptoRecommendationPublicationDependencies = {}) {
    this.candidateGenerator =
      candidateGenerator;

    this.publisher = publisher;
  }

  async publish(
    options: GetLiveCryptoRecommendationCandidatesOptions = {},
  ): Promise<PublishRecommendationsResult> {
    const candidates =
      await this.candidateGenerator(
        options,
      );

    if (candidates.length === 0) {
      return {
        publishedRecords: [],
        publishedCount: 0,
      };
    }

    return this.publisher.publish(
      candidates,
    );
  }
}

type ProductionPublicationService = Pick<
  LiveCryptoRecommendationPublicationService,
  "publish"
>;

export const liveCryptoRecommendationPublicationService:
  ProductionPublicationService = {
    async publish(
      options: GetLiveCryptoRecommendationCandidatesOptions = {},
    ): Promise<PublishRecommendationsResult> {
      const {
        productionApplication,
      } = await import(
        "@/lib/application/productionApplication"
      );

      return productionApplication
        .liveCryptoRecommendationPublicationService
        .publish(options);
    },
  };
