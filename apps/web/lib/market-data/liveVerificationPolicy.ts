import type {
  MarketQuote,
  QuoteFreshnessStatus,
} from "@/lib/market-data/types";

export type LiveVerificationDecision = {
  allowed: boolean;
  status: QuoteFreshnessStatus;
  title: string;
  message: string;
};

export function evaluateLiveVerificationPolicy(
  quote: MarketQuote,
): LiveVerificationDecision {
  switch (quote.freshness.status) {
    case "Fresh":
      return {
        allowed: true,
        status: "Fresh",
        title: "Live verification available",
        message:
          "The market quote is fresh enough to calculate a live verification preview.",
      };

    case "Delayed":
      return {
        allowed: false,
        status: "Delayed",
        title: "Live verification paused",
        message:
          "The quote is delayed. MarketPilot can display the market price, but it will not classify the recommendation using delayed data.",
      };

    case "Stale":
      return {
        allowed: false,
        status: "Stale",
        title: "Live verification blocked",
        message:
          "The quote is stale and cannot be used to calculate a current recommendation result.",
      };

    case "Unknown":
      return {
        allowed: false,
        status: "Unknown",
        title: "Quote freshness unavailable",
        message:
          "The provider timestamp is unavailable, so MarketPilot cannot safely use this quote for live verification.",
      };
  }
}