import DashboardClient from "@/components/dashboard/DashboardClient";
import { cryptoMarketMap } from "@/data/cryptoMarketMap";
import { getCryptoPrices } from "@/services/coingecko";
import {
  formatPercentage,
  formatUsdPrice,
} from "@/utils/formatMarketData";

type LiveCryptoData = Record<
  string,
  {
    currentPrice: string;
    change24h: string;
  }
>;

export default async function DashboardPage() {
  let bitcoinPrice = "Unavailable";
  let bitcoinChange24h = "0.00%";
  let marketDataAvailable = false;

  const liveCryptoData: LiveCryptoData = {};

  try {
    const coinIds = cryptoMarketMap.map((crypto) => crypto.id);
    const prices = await getCryptoPrices(coinIds);

    for (const crypto of cryptoMarketMap) {
      const marketData = prices[crypto.id];

      if (
        marketData &&
        typeof marketData.usd === "number" &&
        typeof marketData.usd_24h_change === "number"
      ) {
        liveCryptoData[crypto.symbol] = {
          currentPrice: formatUsdPrice(marketData.usd),
          change24h: formatPercentage(
            marketData.usd_24h_change,
          ),
        };
      }
    }

    const bitcoin = liveCryptoData.BTC;

    if (bitcoin) {
      bitcoinPrice = bitcoin.currentPrice;
      bitcoinChange24h = bitcoin.change24h;
      marketDataAvailable = true;
    }
  } catch (error) {
    console.error("Unable to load crypto market data:", error);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <DashboardClient
          liveCryptoData={liveCryptoData}
          bitcoinPrice={bitcoinPrice}
          bitcoinChange24h={bitcoinChange24h}
          marketDataAvailable={marketDataAvailable}
        />
      </div>
    </main>
  );
}