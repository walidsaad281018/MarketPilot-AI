import { CoinGeckoProvider } from "@/lib/market-data/providers/coingeckoProvider";
import { UnavailableProvider } from "@/lib/market-data/providers/unavailableProvider";
import type { MarketDataProvider } from "@/lib/market-data/types";

export const marketDataProviders: MarketDataProvider[] =
  [
    new CoinGeckoProvider(),

    new UnavailableProvider(
      "Stock Provider",
      "Stock",
    ),

    new UnavailableProvider(
      "ETF Provider",
      "ETF",
    ),
  ];