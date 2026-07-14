import AITopPickCard from "@/components/cards/AITopPickCard";
import OpportunityGrid from "@/components/dashboard/OpportunityGrid";
import DashboardHero from "@/components/sections/DashboardHero";
import { getCryptoPrices } from "@/services/coingecko";
import {
  formatPercentage,
  formatUsdPrice,
} from "@/utils/formatMarketData";

export default async function DashboardPage() {
  let bitcoinPrice = "$0";
  let bitcoinChange24h = "0.00%";
  let marketDataAvailable = false;

  try {
    const prices = await getCryptoPrices(["bitcoin"]);
    const bitcoin = prices.bitcoin;

    if (bitcoin) {
      bitcoinPrice = formatUsdPrice(bitcoin.usd);
      bitcoinChange24h = formatPercentage(
        bitcoin.usd_24h_change,
      );
      marketDataAvailable = true;
    }
  } catch (error) {
    console.error("Unable to load Bitcoin data:", error);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <DashboardHero />

        {!marketDataAvailable && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Live market data is temporarily unavailable. Some values may
            not be displayed.
          </div>
        )}

        <AITopPickCard
          assetName="Bitcoin"
          symbol="BTC"
          category="Cryptocurrency"
          score={97}
          expectedReturn="+18%"
          confidence={95}
          risk="Medium"
          currentPrice={bitcoinPrice}
          change24h={bitcoinChange24h}
          trend="Bullish"
          reasons={[
            "Strong momentum across short- and medium-term indicators.",
            "Trading volume is above its recent average.",
            "Market sentiment currently supports the broader trend.",
          ]}
        />

        <OpportunityGrid />
      </div>
    </main>
  );
}