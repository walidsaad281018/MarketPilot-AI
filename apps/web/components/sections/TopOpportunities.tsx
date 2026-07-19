import OpportunityCard from "@/components/cards/OpportunityCard";

const featuredOpportunities = [
  {
    rank: 1,
    asset: "Bitcoin",
    symbol: "BTC",
    category: "Crypto",
    score: 97,
    expectedReturn: "+18%",
    risk: "Medium" as const,
    confidence: 95,
    trend: "Bullish" as const,
    historicalAccuracy: 84,
  },
  {
    rank: 2,
    asset: "NVIDIA",
    symbol: "NVDA",
    category: "Stock",
    score: 93,
    expectedReturn: "+12%",
    risk: "Medium" as const,
    confidence: 89,
    trend: "Bullish" as const,
    historicalAccuracy: 79,
  },
  {
    rank: 3,
    asset: "Vanguard S&P 500 ETF",
    symbol: "VOO",
    category: "ETF",
    score: 90,
    expectedReturn: "+7%",
    risk: "Low" as const,
    confidence: 91,
    trend: "Bullish" as const,
    historicalAccuracy: 87,
  },
];

export default function TopOpportunities() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Featured opportunities
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            MarketPilot Top Picks
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Demonstration opportunities selected
            across cryptocurrency, stocks and ETFs.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredOpportunities.map(
            (opportunity) => (
              <OpportunityCard
                key={opportunity.symbol}
                {...opportunity}
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}