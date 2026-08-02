import type {
  Opportunity,
} from "@/data/opportunities";
import type {
  MarketDataMetadata,
} from "@/lib/market/marketDataMetadata";

export type OpportunityWithMarketMetadata =
  Opportunity &
  MarketDataMetadata;
