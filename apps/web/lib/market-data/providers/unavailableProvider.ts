import type {
  MarketAssetCategory,
  MarketDataProvider,
  MarketDataResult,
  MarketQuoteRequest,
} from "@/lib/market-data/types";

export class UnavailableProvider
  implements MarketDataProvider
{
  readonly name: string;

  private readonly supportedCategory:
    MarketAssetCategory;

  constructor(
    providerName: string,
    supportedCategory: MarketAssetCategory,
  ) {
    this.name = providerName;
    this.supportedCategory =
      supportedCategory;
  }

  supports(
    request: MarketQuoteRequest,
  ): boolean {
    return (
      request.category ===
      this.supportedCategory
    );
  }

  async getQuote(
    request: MarketQuoteRequest,
  ): Promise<MarketDataResult> {
    return {
      success: false,
      error: {
        code: "PROVIDER_UNAVAILABLE",
        message: `${this.supportedCategory} live market data has not yet been connected for ${request.symbol.toUpperCase()}.`,
      },
    };
  }
}