"use client";

type DashboardHeroProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

export default function DashboardHero({
  searchQuery,
  onSearchChange,
}: DashboardHeroProps) {
  return (
    <section className="mb-10">
      <h1 className="mb-4 text-5xl font-extrabold tracking-tight md:text-6xl">
        <span className="text-blue-600">Market</span>
        <span className="text-slate-900">Pilot</span>
        <span className="text-emerald-500"> AI</span>
      </h1>

      <p className="max-w-3xl text-lg leading-8 text-slate-500">
        Discover the highest-potential Crypto, Stock and ETF investment
        opportunities using transparent AI analysis and real-time market data.
      </p>

      <div className="relative mt-6">
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
          🔍
        </span>

        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search Bitcoin, BTC, NVIDIA, VOO..."
          aria-label="Search investment opportunities"
          className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-12 pr-12 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-lg font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        )}
      </div>
    </section>
  );
}