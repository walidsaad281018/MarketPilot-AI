"use client";

import Link from "next/link";
import { useState } from "react";
import AITopPickCard from "@/components/cards/AITopPickCard";
import CryptoPriceChart from "@/components/dashboard/CryptoPriceChart";
import MarketOverview from "@/components/dashboard/MarketOverview";
import OpportunityGrid from "@/components/dashboard/OpportunityGrid";
import PerformanceBreakdown from "@/components/dashboard/PerformanceBreakdown";
import PerformanceCenter from "@/components/dashboard/PerformanceCenter";
import DashboardHero from "@/components/sections/DashboardHero";
import type { LiveCryptoOpportunity } from "@/data/getLiveCryptoOpportunities";
import type { RecommendationRecord } from "@/data/recommendations";
import type {
  CategoryPerformance,
  RecommendationPerformanceMetrics,
} from "@/lib/services/recommendationPerformanceService";

type LiveCryptoData = Record<
  string,
  {
    currentPrice: string;
    change24h: string;
  }
>;

type DashboardClientProps = {
  liveCryptoData: LiveCryptoData;
  cryptoOpportunities: LiveCryptoOpportunity[];
  marketDataAvailable: boolean;
  recommendationRecords: RecommendationRecord[];
  performanceMetrics: RecommendationPerformanceMetrics;
  categoryPerformance: CategoryPerformance[];
};

export default function DashboardClient({
  liveCryptoData,
  cryptoOpportunities,
  marketDataAvailable,
  recommendationRecords,
  performanceMetrics,
  categoryPerformance,
}: DashboardClientProps) {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const topOpportunity =
    cryptoOpportunities[0] ?? null;

  const topOpportunityMarketData =
    topOpportunity
      ? liveCryptoData[
          topOpportunity.symbol
        ]
      : undefined;

  return (
    <>
      <DashboardHero
        searchQuery={searchQuery}
        onSearchChange={
          setSearchQuery
        }
      />

      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <Link
          href="/opportunities"
          className="group rounded-2xl border border-blue-200 bg-blue-50 p-5 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Market opportunities
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Explore Top 100 Opportunities
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Open the full ranked market view
                with search, sorting and expanded
                opportunity coverage.
              </p>
            </div>

            <span className="text-2xl font-black text-blue-600 transition group-hover:translate-x-1">
              {"\u2192"}
            </span>
          </div>
        </Link>

        <Link
          href="/performance"
          className="group rounded-2xl border border-emerald-200 bg-emerald-50 p-5 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Track record
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Open AI Performance Center
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review recommendation history,
                verification status and measured
                performance.
              </p>
            </div>

            <span className="text-2xl font-black text-emerald-700 transition group-hover:translate-x-1">
              {"\u2192"}
            </span>
          </div>
        </Link>
      </section>

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
        cryptoOpportunities={
          cryptoOpportunities
        }
      />

      <CryptoPriceChart
        cryptoOpportunities={
          cryptoOpportunities
        }
      />

      {topOpportunity ? (
        <AITopPickCard
          assetName={
            topOpportunity.asset
          }
          symbol={
            topOpportunity.symbol
          }
          category="Cryptocurrency"
          score={
            topOpportunity.score
          }
          expectedReturn={
            topOpportunity.expectedReturn
          }
          confidence={
            topOpportunity.confidence
          }
          risk={
            topOpportunity.risk
          }
          currentPrice={
            topOpportunityMarketData
              ?.currentPrice ??
            "Unavailable"
          }
          change24h={
            topOpportunityMarketData
              ?.change24h ??
            ""
          }
          trend={
            topOpportunity.trend
          }
          reasons={[
            "Ranked first by the current MarketPilot opportunity engine.",
            "Score reflects current market momentum, volatility and liquidity conditions.",
            "Market quality and live-data signals support its current ranking.",
          ]}
        />
      ) : null}

      <PerformanceCenter
        recommendationRecords={
          recommendationRecords
        }
        metrics={
          performanceMetrics
        }
      />

      <PerformanceBreakdown
        categoryPerformance={
          categoryPerformance
        }
      />

      <OpportunityGrid
        liveCryptoData={
          liveCryptoData
        }
        cryptoOpportunities={
          cryptoOpportunities
        }
        searchQuery={searchQuery}
        onSearchChange={
          setSearchQuery
        }
      />
    </>
  );
}
