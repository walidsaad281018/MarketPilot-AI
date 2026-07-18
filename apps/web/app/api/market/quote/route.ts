import { NextRequest, NextResponse } from "next/server";
import { getMarketQuote } from "@/lib/market-data/marketDataService";
import type {
  MarketAssetCategory,
  MarketQuoteRequest,
} from "@/lib/market-data/types";

const supportedCategories:
  MarketAssetCategory[] = [
    "Crypto",
    "Stock",
    "ETF",
  ];

export async function GET(
  request: NextRequest,
) {
  const searchParams =
    request.nextUrl.searchParams;

  const symbol =
    searchParams.get("symbol")?.trim() ?? "";

  const categoryValue =
    searchParams.get("category")?.trim() ??
    "";

  if (!symbol) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message:
            "The symbol query parameter is required.",
        },
      },
      {
        status: 400,
      },
    );
  }

  const category =
    parseCategory(categoryValue);

  if (!category) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message:
            "The category query parameter must be Crypto, Stock or ETF.",
        },
      },
      {
        status: 400,
      },
    );
  }

  const quoteRequest: MarketQuoteRequest = {
    symbol,
    category,
  };

  const result =
    await getMarketQuote(quoteRequest);

  if (!result.success) {
    const status =
      result.error.code ===
      "UNSUPPORTED_ASSET"
        ? 404
        : 503;

    return NextResponse.json(result, {
      status,
    });
  }

  return NextResponse.json(result, {
    status: 200,
    headers: {
      "Cache-Control":
        "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

function parseCategory(
  value: string,
): MarketAssetCategory | null {
  const matchedCategory =
    supportedCategories.find(
      (category) =>
        category.toLowerCase() ===
        value.toLowerCase(),
    );

  return matchedCategory ?? null;
}