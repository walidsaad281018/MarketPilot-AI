"use client";

import { useState } from "react";
import OpportunityCard from "@/components/cards/OpportunityCard";
import {
  cryptoOpportunities as staticCryptoOpportunities,
  etfOpportunities,
  stockOpportunities,
  type Opportunity,
  type RiskLevel,
} from "@/data/opportunities";

type CategoryFilter =
  | "Crypto"
  | "Stocks"
  | "ETFs";

type SortOption =
  | "rank"
  | "score"
  | "confidence"
  | "momentum"
  | "risk";

type LiveCryptoData = Record<
  string,
  {
    currentPrice: string;
    change24h: string;
  }
>;

type OpportunityGridProps = {
  liveCryptoData: LiveCryptoData;
  cryptoOpportunities?: Opportunity[];
  searchQuery?: string;
  onSearchChange?: (
    value: string,
  ) => void;
};

const INITIAL_VISIBLE_COUNT = 20;
const LOAD_MORE_COUNT = 20;

const categoryIcons: Record<
  CategoryFilter,
  string
> = {
  Crypto: "🪙",
  Stocks: "📈",
  ETFs: "📊",
};

const riskOrder: Record<
  RiskLevel,
  number
> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

export default function OpportunityGrid({
  liveCryptoData,
  cryptoOpportunities:
    dynamicCryptoOpportunities,
  searchQuery:
    controlledSearchQuery,
  onSearchChange,
}: OpportunityGridProps) {
  const [
    activeCategory,
    setActiveCategory,
  ] = useState<CategoryFilter>(
    "Crypto",
  );

  const [
    internalSearchQuery,
    setInternalSearchQuery,
  ] = useState("");

  const [
    sortOption,
    setSortOption,
  ] = useState<SortOption>(
    "rank",
  );

  const [
    visibleCount,
    setVisibleCount,
  ] = useState(
    INITIAL_VISIBLE_COUNT,
  );

  const searchQuery =
    controlledSearchQuery ??
    internalSearchQuery;

  const categoryData: Record<
    CategoryFilter,
    Opportunity[]
  > = {
    Crypto:
      dynamicCryptoOpportunities ??
      staticCryptoOpportunities,
    Stocks: stockOpportunities,
    ETFs: etfOpportunities,
  };

  const normalizedSearch =
    searchQuery
      .trim()
      .toLowerCase();

  const activeOpportunities =
    categoryData[activeCategory];

  const filteredOpportunities =
    activeOpportunities.filter(
      (opportunity) =>
        opportunity.asset
          .toLowerCase()
          .includes(
            normalizedSearch,
          ) ||
        opportunity.symbol
          .toLowerCase()
          .includes(
            normalizedSearch,
          ),
    );

  const sortedOpportunities =
    [...filteredOpportunities].sort(
      (first, second) =>
        compareOpportunities(
          first,
          second,
          sortOption,
        ),
    );

  const visibleOpportunities =
    sortedOpportunities.slice(
      0,
      visibleCount,
    );

  const totalOpportunities =
    activeOpportunities.length;

  const filteredTotal =
    sortedOpportunities.length;

  const hasMoreOpportunities =
    visibleOpportunities.length <
    filteredTotal;

  const dataStatusLabel =
    activeCategory === "Crypto"
      ? "Live market data"
      : "Demo market data";

  const dataStatusStyles =
    activeCategory === "Crypto"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";

  function handleCategoryChange(
    category: CategoryFilter,
  ): void {
    setActiveCategory(category);
    setVisibleCount(
      INITIAL_VISIBLE_COUNT,
    );
  }

  function handleSearchChange(
    value: string,
  ): void {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchQuery(value);
    }

    setVisibleCount(
      INITIAL_VISIBLE_COUNT,
    );
  }

  function handleSortChange(
    value: string,
  ): void {
    setSortOption(
      value as SortOption,
    );

    setVisibleCount(
      INITIAL_VISIBLE_COUNT,
    );
  }

  function handleClearSearch(): void {
    handleSearchChange("");
  }

  function handleLoadMore(): void {
    setVisibleCount(
      (currentCount) =>
        Math.min(
          currentCount +
            LOAD_MORE_COUNT,
          filteredTotal,
        ),
    );
  }

  return (
    <section className="pb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Ranked by MarketPilot
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900">
            Top{" "}
            {totalOpportunities}{" "}
            {activeCategory}{" "}
            Opportunities
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Showing{" "}
            {
              visibleOpportunities.length
            }{" "}
            of{" "}
            {filteredTotal}{" "}
            opportunities.
          </p>
        </div>

        <div
          className={`rounded-full px-4 py-2 text-xs font-bold ${dataStatusStyles}`}
        >
          {dataStatusLabel}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {Object.keys(
          categoryData,
        ).map(
          (category) => {
            const typedCategory =
              category as CategoryFilter;

            const isActive =
              activeCategory ===
              typedCategory;

            const categoryCount =
              categoryData[
                typedCategory
              ].length;

            return (
              <button
                key={typedCategory}
                type="button"
                onClick={() =>
                  handleCategoryChange(
                    typedCategory,
                  )
                }
                className={
                  isActive
                    ? "rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-md transition"
                    : "rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
                }
              >
                {
                  categoryIcons[
                    typedCategory
                  ]
                }{" "}
                {typedCategory}

                <span
                  className={
                    isActive
                      ? "ml-2 rounded-full bg-white/20 px-2 py-1 text-xs"
                      : "ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs"
                  }
                >
                  {categoryCount}
                </span>
              </button>
            );
          },
        )}
      </div>

      <div className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_280px]">
        <div>
          <label
            htmlFor="opportunity-search"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Search opportunities
          </label>

          <div className="flex gap-2">
            <input
              id="opportunity-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                handleSearchChange(
                  event.target.value,
                )
              }
              placeholder="Search Bitcoin, BTC, NVIDIA..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {searchQuery.length > 0 ? (
              <button
                type="button"
                onClick={
                  handleClearSearch
                }
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div>
          <label
            htmlFor="opportunity-sort"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Sort opportunities
          </label>

          <select
            id="opportunity-sort"
            value={sortOption}
            onChange={(event) =>
              handleSortChange(
                event.target.value,
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="rank">
              MarketPilot ranking
            </option>

            <option value="score">
              Highest AI score
            </option>

            <option value="confidence">
              Highest confidence
            </option>

            <option value="momentum">
              Strongest 24h momentum
            </option>

            <option value="risk">
              Lowest risk
            </option>
          </select>
        </div>
      </div>

      {visibleOpportunities.length >
      0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleOpportunities.map(
              (opportunity) => {
                const liveData =
                  activeCategory ===
                  "Crypto"
                    ? liveCryptoData[
                        opportunity
                          .symbol
                      ]
                    : undefined;

                return (
                  <OpportunityCard
                    key={`${opportunity.category}-${opportunity.symbol}`}
                    {...opportunity}
                    currentPrice={
                      liveData?.currentPrice
                    }
                    change24h={
                      liveData?.change24h
                    }
                  />
                );
              },
            )}
          </div>

          {hasMoreOpportunities ? (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={
                  handleLoadMore
                }
                className="rounded-xl bg-slate-900 px-8 py-4 font-bold text-white shadow-md transition hover:bg-blue-600"
              >
                Load 20 more
              </button>

              <p className="mt-3 text-sm text-slate-500">
                {
                  filteredTotal -
                  visibleOpportunities.length
                }{" "}
                opportunities remaining
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h3 className="text-2xl font-bold text-slate-900">
            No opportunities found
          </h3>

          <p className="mt-3 text-slate-500">
            No result matches
            &quot;{searchQuery}&quot; in
            the {activeCategory} category.
          </p>

          <button
            type="button"
            onClick={
              handleClearSearch
            }
            className="mt-6 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
          >
            Clear search
          </button>
        </div>
      )}
    </section>
  );
}

function compareOpportunities(
  first: Opportunity,
  second: Opportunity,
  sortOption: SortOption,
): number {
  if (sortOption === "score") {
    return (
      second.score -
      first.score
    );
  }

  if (
    sortOption === "confidence"
  ) {
    return (
      second.confidence -
      first.confidence
    );
  }

  if (
    sortOption === "momentum"
  ) {
    return (
      (second.priceChange24h ??
        Number.NEGATIVE_INFINITY) -
      (first.priceChange24h ??
        Number.NEGATIVE_INFINITY)
    );
  }

  if (sortOption === "risk") {
    const riskDifference =
      riskOrder[first.risk] -
      riskOrder[second.risk];

    if (riskDifference !== 0) {
      return riskDifference;
    }

    return (
      second.score -
      first.score
    );
  }

  return first.rank - second.rank;
}