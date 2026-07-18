import { marketDataProviders } from "@/lib/market-data/providers";
import type {
  MarketDataResult,
  MarketQuoteRequest,
} from "@/lib/market-data/types";

export async function getMarketQuote(
  request: MarketQuoteRequest,
): Promise<MarketDataResult> {
  const normalizedRequest: MarketQuoteRequest =
    {
      symbol: request.symbol
        .trim()
        .toUpperCase(),
      category: request.category,
    };

  if (!normalizedRequest.symbol) {
    return {
      success: false,
      error: {
        code: "UNSUPPORTED_ASSET",
        message:
          "A market symbol is required.",
      },
    };
  }

  const provider =
    marketDataProviders.find(
      (candidate) =>
        candidate.supports(
          normalizedRequest,
        ),
    );

  if (!provider) {
    return {
      success: false,
      error: {
        code: "UNSUPPORTED_ASSET",
        message: `No market-data provider supports ${normalizedRequest.symbol} in the ${normalizedRequest.category} category.`,
      },
    };
  }

  try {
    return await provider.getQuote(
      normalizedRequest,
    );
  } catch (error) {
    console.error(
      `Unexpected market-data error for ${normalizedRequest.symbol}:`,
      error,
    );

    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message:
          "An unexpected market-data error occurred.",
      },
    };
  }
}