import { cryptoMarketMap } from "@/data/cryptoMarketMap";
import { getCryptoPrices } from "@/services/coingecko";
import type {
  MarketDataProvider,
  MarketDataResult,
  MarketQuoteRequest,
} from "@/lib/market-data/types";

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
    const normalizedSymbol = normalizeSymbol(
      request.symbol,
    );

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
      const prices = await getCryptoPrices([
        mapping.id,
      ]);

      const providerQuote =
        prices[mapping.id];

      if (
        !providerQuote ||
        typeof providerQuote.usd !== "number" ||
        !Number.isFinite(providerQuote.usd)
      ) {
        return {
          success: false,
          error: {
            code: "INVALID_PROVIDER_RESPONSE",
            message:
              "CoinGecko returned an invalid market-price response.",
          },
        };
      }

      const change24h =
        typeof providerQuote.usd_24h_change ===
          "number" &&
        Number.isFinite(
          providerQuote.usd_24h_change,
        )
          ? providerQuote.usd_24h_change
          : null;

      return {
        success: true,
        quote: {
          symbol: normalizedSymbol,
          category: "Crypto",
          provider: this.name,
          currency: "USD",
          price: providerQuote.usd,
          change24h,
          fetchedAt: new Date().toISOString(),
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

function findCryptoMapping(symbol: string) {
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