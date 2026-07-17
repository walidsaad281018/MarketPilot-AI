"use client";

import { useState } from "react";
import OpportunityCard from "@/components/cards/OpportunityCard";
import {
  cryptoOpportunities,
  etfOpportunities,
  stockOpportunities,
  type Opportunity,
} from "@/data/opportunities";

type CategoryFilter = "Crypto" | "Stocks" | "ETFs";

type LiveCryptoData = Record<
  string,
  {
    currentPrice: string;
    change24h: string;
  }
>;

type OpportunityGridProps = {
  liveCryptoData: LiveCryptoData;
  searchQuery: string;
};

const categoryData: Record<CategoryFilter, Opportunity[]> = {
  Crypto: cryptoOpportunities,
  Stocks: stockOpportunities,
  ETFs: etfOpportunities,
};

const categoryIcons: Record<CategoryFilter, string> = {
  Crypto: "🪙",
  Stocks: "📈",
  ETFs: "📊",
};

export default function OpportunityGrid({
  liveCryptoData,
  searchQuery,
}: OpportunityGridProps) {
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>("Crypto");

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const opportunities = categoryData[activeCategory].filter(
    (opportunity) =>
      opportunity.asset.toLowerCase().includes(normalizedSearch) ||
      opportunity.symbol.toLowerCase().includes(normalizedSearch)
  );

  return (
    <section className="pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Ranked by MarketPilot
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900">
            Top 20 {activeCategory} Opportunities
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Showing {opportunities.length} of 20 opportunities.
          </p>
        </div>

        <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-700">
          Scores are demo data
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {Object.keys(categoryData).map((category) => {
          const typedCategory = category as CategoryFilter;
          const isActive = activeCategory === typedCategory;

          return (
            <button
              key={typedCategory}
              type="button"
              onClick={() => setActiveCategory(typedCategory)}
              className={
                isActive
                  ? "rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-md transition"
                  : "rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
              }
            >
              {categoryIcons[typedCategory]} {typedCategory}

              <span
                className={
                  isActive
                    ? "ml-2 rounded-full bg-white/20 px-2 py-1 text-xs"
                    : "ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs"
                }
              >
                20
              </span>
            </button>
          );
        })}
      </div>

      {opportunities.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {opportunities.map((opportunity) => {
            const liveData =
              activeCategory === "Crypto"
                ? liveCryptoData[opportunity.symbol]
                : undefined;

            return (
              <OpportunityCard
                key={`${opportunity.category}-${opportunity.symbol}`}
                {...opportunity}
                currentPrice={liveData?.currentPrice}
                change24h={liveData?.change24h}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h3 className="text-2xl font-bold text-slate-900">
            No opportunities found
          </h3>

          <p className="mt-3 text-slate-500">
            Try another asset name or ticker symbol.
          </p>
        </div>
      )}
    </section>
  );
}