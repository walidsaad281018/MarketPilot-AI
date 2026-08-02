import type {
  Opportunity,
} from "@/data/opportunities";
import type {
  MarketDataMetadata,
} from "@/lib/market/marketDataMetadata";
import type {
  MarketQualityAssessment,
} from "@/lib/marketQuality/marketQualityEngine";

export type OpportunityWithMarketMetadata =
  Opportunity &
  MarketDataMetadata & {
    marketQuality:
      MarketQualityAssessment;
  };
