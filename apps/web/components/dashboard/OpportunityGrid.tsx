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

export default function OpportunityGrid() {
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>("Crypto");

  const opportunities = categoryData[activeCategory];

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
            Showing 20 of 60 demonstration opportunities.
          </p>
        </div>

        <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-700">
          Demo data
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

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {opportunities.map((opportunity) => (
          <OpportunityCard
            key={`${opportunity.category}-${opportunity.symbol}`}
            {...opportunity}
          />
        ))}
      </div>
    </section>
  );
}