import { cryptoMarketMap } from "@/data/cryptoMarketMap";
import { calculateQuoteFreshness } from "@/lib/market-data/quoteFreshness";
import type {
  MarketDataProvider,
  MarketDataResult,
  MarketQuoteRequest,
} from "@/lib/market-data/types";
import { getCoinGeckoQuote } from "@/services/coingeckoQuote";

export class CoinGeckoProvider
  implements MarketDataProvider
{
  readonly name = "CoinGecko";

  supports(
    request: MarketQuoteRequest,
  ): boolean {
    if (request.category !== "Crypto") {
      return false;
    }

    return Boolean(
      findCryptoMapping(request.symbol),
    );
  }

  async getQuote(
    request: MarketQuoteRequest,
  ): Promise<MarketDataResult> {
    const normalizedSymbol =
      normalizeSymbol(request.symbol);

    const mapping =
      findCryptoMapping(normalizedSymbol);

    if (
      request.category !== "Crypto" ||
      !mapping
    ) {
      return {
        success: false,
        error: {
          code: "UNSUPPORTED_ASSET",
          message: `${normalizedSymbol} is not supported by the CoinGecko provider.`,
        },
      };
    }

    try {
      const providerQuote =
        await getCoinGeckoQuote(mapping.id);

      const fetchedAt =
        new Date().toISOString();

      return {
        success: true,
        quote: {
          symbol: normalizedSymbol,
          category: "Crypto",
          provider: this.name,
          currency: "USD",
          price: providerQuote.price,
          change24h:
            providerQuote.change24h,
          providerUpdatedAt:
            providerQuote.providerUpdatedAt,
          fetchedAt,
          freshness:
            calculateQuoteFreshness(
              providerQuote.providerUpdatedAt,
              new Date(fetchedAt),
            ),
        },
      };
    } catch (error) {
      console.error(
        `CoinGecko provider failed for ${normalizedSymbol}:`,
        error,
      );

      return {
        success: false,
        error: {
          code: "PROVIDER_UNAVAILABLE",
          message:
            "CoinGecko market data is temporarily unavailable.",
        },
      };
    }
  }
}

function findCryptoMapping(
  symbol: string,
) {
  const normalizedSymbol =
    normalizeSymbol(symbol);

  return cryptoMarketMap.find(
    (crypto) =>
      crypto.symbol.toUpperCase() ===
      normalizedSymbol,
  );
}

function normalizeSymbol(
  symbol: string,
): string {
  return symbol.trim().toUpperCase();
}