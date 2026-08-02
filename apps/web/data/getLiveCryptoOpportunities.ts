import {
  cryptoOpportunities,
} from "@/data/opportunities";
import {
  createFallbackMarketDataMetadata,
  createLiveMarketDataMetadata,
} from "@/lib/market/marketDataMetadata";
import {
  assessMarketQuality,
} from "@/lib/marketQuality/marketQualityEngine";
import {
  buildCryptoOpportunity,
  type BuiltCryptoOpportunity,
} from "@/lib/opportunities/cryptoOpportunityBuilder";
import type {
  OpportunityWithMarketMetadata,
} from "@/lib/opportunities/opportunityWithMarketMetadata";
import {
  cryptoProvider,
  type MarketQuote,
} from "@/lib/providers/marketProvider";

type CryptoAsset = {
  asset: string;
  symbol: string;
};

export type LiveCryptoOpportunity =
  OpportunityWithMarketMetadata & {
    currentPriceUsd: number | null;
  };

export type GetLiveCryptoOpportunitiesOptions = {
  currentTime?: Date;
};

const cryptoAssets: CryptoAsset[] = [
  {
    asset: "Bitcoin",
    symbol: "BTC",
  },
  {
    asset: "Ethereum",
    symbol: "ETH",
  },
  {
    asset: "Solana",
    symbol: "SOL",
  },
  {
    asset: "BNB",
    symbol: "BNB",
  },
  {
    asset: "XRP",
    symbol: "XRP",
  },
  {
    asset: "Cardano",
    symbol: "ADA",
  },
  {
    asset: "Avalanche",
    symbol: "AVAX",
  },
  {
    asset: "Chainlink",
    symbol: "LINK",
  },
  {
    asset: "Polkadot",
    symbol: "DOT",
  },
  {
    asset: "Sui",
    symbol: "SUI",
  },
  {
    asset: "Toncoin",
    symbol: "TON",
  },
  {
    asset: "Litecoin",
    symbol: "LTC",
  },
  {
    asset: "Uniswap",
    symbol: "UNI",
  },
  {
    asset: "Aptos",
    symbol: "APT",
  },
  {
    asset: "NEAR Protocol",
    symbol: "NEAR",
  },
  {
    asset: "Internet Computer",
    symbol: "ICP",
  },
  {
    asset: "Render",
    symbol: "RENDER",
  },
  {
    asset: "Sei",
    symbol: "SEI",
  },
  {
    asset: "Hedera",
    symbol: "HBAR",
  },
  {
    asset: "Arbitrum",
    symbol: "ARB",
  },
];

export async function getLiveCryptoOpportunities({
  currentTime = new Date(),
}: GetLiveCryptoOpportunitiesOptions = {}): Promise<
  LiveCryptoOpportunity[]
> {
  try {
    const symbols =
      cryptoAssets.map(
        (asset) => asset.symbol,
      );

    const quotes =
      await cryptoProvider.getQuotes(
        symbols,
      );

    if (quotes.length === 0) {
      return createFallbackOpportunities();
    }

    const quotesBySymbol =
      createQuoteLookup(quotes);

    const liveOpportunities =
      cryptoAssets
        .map(
          (
            asset,
          ): BuiltCryptoOpportunity | null => {
            const quote =
              quotesBySymbol.get(
                asset.symbol.toUpperCase(),
              );

            if (!quote) {
              return null;
            }

            const metadata =
              createLiveMarketDataMetadata({
                source: quote.source,
                lastUpdated:
                  quote.lastUpdated,
                currentTime,
              });

            return buildCryptoOpportunity({
              asset: asset.asset,
              symbol: asset.symbol,
              market: quote,
              metadata,
            });
          },
        )
        .filter(
          (
            opportunity,
          ): opportunity is BuiltCryptoOpportunity =>
            opportunity !== null,
        );

    if (
      liveOpportunities.length === 0
    ) {
      return createFallbackOpportunities();
    }

    return liveOpportunities
      .sort(
        (first, second) =>
          second.score -
          first.score,
      )
      .map(
        (
          opportunity,
          index,
        ): LiveCryptoOpportunity => ({
          ...opportunity,
          rank: index + 1,
        }),
      );
  } catch (error) {
    console.error(
      "Unable to build live crypto opportunities:",
      error,
    );

    return createFallbackOpportunities();
  }
}

function createQuoteLookup(
  quotes: MarketQuote[],
): Map<string, MarketQuote> {
  return new Map(
    quotes.map(
      (
        quote,
      ): [string, MarketQuote] => [
        quote.symbol
          .trim()
          .toUpperCase(),
        quote,
      ],
    ),
  );
}

function createFallbackOpportunities():
  LiveCryptoOpportunity[] {
  const fallbackMetadata =
    createFallbackMarketDataMetadata();

  return cryptoOpportunities.map(
    (
      opportunity,
    ): LiveCryptoOpportunity => {
      const marketQuality =
        assessMarketQuality({
          volume24hUsd:
            opportunity.volume24hUsd ??
            0,
          marketCapUsd: null,
          volatility24h:
            opportunity.volatility24h ??
            0,
          isStale:
            fallbackMetadata.isStale,
        });

      return {
        ...opportunity,
        currentPriceUsd: null,
        ...fallbackMetadata,
        marketQuality,
      };
    },
  );
}


