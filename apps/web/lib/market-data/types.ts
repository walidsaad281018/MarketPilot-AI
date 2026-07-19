export type MarketAssetCategory =
  | "Crypto"
  | "Stock"
  | "ETF";

export type MarketQuoteRequest = {
  symbol: string;
  category: MarketAssetCategory;
};

export type QuoteFreshnessStatus =
  | "Fresh"
  | "Delayed"
  | "Stale"
  | "Unknown";

export type QuoteFreshness = {
  status: QuoteFreshnessStatus;
  ageSeconds: number | null;
};

export type MarketQuote = {
  symbol: string;
  category: MarketAssetCategory;
  provider: string;
  currency: "USD";
  price: number;
  change24h: number | null;
  providerUpdatedAt: string | null;
  fetchedAt: string;
  freshness: QuoteFreshness;
};

export type MarketDataErrorCode =
  | "UNSUPPORTED_ASSET"
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_PROVIDER_RESPONSE"
  | "UNKNOWN_ERROR";

export type MarketDataSuccessResult = {
  success: true;
  quote: MarketQuote;
};

export type MarketDataFailureResult = {
  success: false;
  error: {
    code: MarketDataErrorCode;
    message: string;
  };
};

export type MarketDataResult =
  | MarketDataSuccessResult
  | MarketDataFailureResult;

export interface MarketDataProvider {
  readonly name: string;

  supports(
    request: MarketQuoteRequest,
  ): boolean;

  getQuote(
    request: MarketQuoteRequest,
  ): Promise<MarketDataResult>;
}