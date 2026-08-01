"use client";

import { useState } from "react";
import AITopPickCard from "@/components/cards/AITopPickCard";
import CryptoPriceChart from "@/components/dashboard/CryptoPriceChart";
import MarketOverview from "@/components/dashboard/MarketOverview";
import OpportunityGrid from "@/components/dashboard/OpportunityGrid";
import PerformanceBreakdown from "@/components/dashboard/PerformanceBreakdown";
import PerformanceCenter from "@/components/dashboard/PerformanceCenter";
import DashboardHero from "@/components/sections/DashboardHero";

type LiveCryptoData = Record<
  string,
  {
    currentPrice: string;
    change24h: string;
  }
>;

type DashboardClientProps = {
  liveCryptoData: LiveCryptoData;
  bitcoinPrice: string;
  bitcoinChange24h: string;
  marketDataAvailable: boolean;
};

export default function DashboardClient({
  liveCryptoData,
  bitcoinPrice,
  bitcoinChange24h,
  marketDataAvailable,
}: DashboardClientProps) {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  return (
    <>
      <DashboardHero
        searchQuery={searchQuery}
        onSearchChange={
          setSearchQuery
        }
      />

      {!marketDataAvailable ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Live cryptocurrency prices
          are temporarily unavailable.
        </div>
      ) : null}

      <MarketOverview
        liveCryptoData={
          liveCryptoData
        }
      />

      <CryptoPriceChart />

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

      <PerformanceCenter />

      <PerformanceBreakdown />

      <OpportunityGrid
        liveCryptoData={
          liveCryptoData
        }
        searchQuery={searchQuery}
        onSearchChange={
          setSearchQuery
        }
      />
    </>
  );
}