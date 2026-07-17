import Link from "next/link";
import { notFound } from "next/navigation";
import { cryptoMarketMap } from "@/data/cryptoMarketMap";
import { getOpportunityBySymbol } from "@/data/getOpportunity";
import { getCryptoPrices } from "@/services/coingecko";
import {
  formatPercentage,
  formatUsdPrice,
} from "@/utils/formatMarketData";

type AnalysisPageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

const riskStyles = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

const trendStyles = {
  Bullish: "text-emerald-600",
  Neutral: "text-amber-600",
  Bearish: "text-red-600",
};

export default async function AnalysisPage({
  params,
}: AnalysisPageProps) {
  const { symbol } = await params;

  const opportunity =
    getOpportunityBySymbol(symbol);

  if (!opportunity) {
    notFound();
  }

  let currentPrice: string | null = null;
  let change24h: string | null = null;
  let marketDataAvailable = false;

  const cryptoMapping = cryptoMarketMap.find(
    (crypto) =>
      crypto.symbol.toUpperCase() ===
      opportunity.symbol.toUpperCase(),
  );

  if (cryptoMapping) {
    try {
      const prices = await getCryptoPrices([
        cryptoMapping.id,
      ]);

      const marketData =
        prices[cryptoMapping.id];

      if (
        marketData &&
        typeof marketData.usd === "number" &&
        typeof marketData.usd_24h_change ===
          "number"
      ) {
        currentPrice = formatUsdPrice(
          marketData.usd,
        );

        change24h = formatPercentage(
          marketData.usd_24h_change,
        );

        marketDataAvailable = true;
      }
    } catch (error) {
      console.error(
        `Unable to load live market data for ${opportunity.symbol}:`,
        error,
      );
    }
  }

  const isNegativeChange =
    change24h?.startsWith("-") ?? false;

  const reasons = [
    `${opportunity.asset} currently ranks #${opportunity.rank} in the ${opportunity.category} opportunity list.`,
    `The demonstration scoring model reports ${opportunity.confidence}% confidence with an AI score of ${opportunity.score}/100.`,
    `The current model classifies the trend as ${opportunity.trend} and the risk level as ${opportunity.risk}.`,
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 font-bold text-blue-600 transition hover:text-blue-800"
        >
          ← Back to dashboard
        </Link>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-7 py-7 text-white">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">
                  Transparent analysis
                </p>

                <h1 className="mt-3 text-4xl font-black md:text-5xl">
                  {opportunity.asset}
                </h1>

                <p className="mt-2 text-blue-100">
                  {opportunity.symbol} ·{" "}
                  {opportunity.category}
                </p>
              </div>

              <div className="rounded-2xl bg-white/15 px-5 py-4 text-center backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-100">
                  Category rank
                </p>

                <p className="mt-1 text-3xl font-black">
                  #{opportunity.rank}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-7 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <section>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                      Market data
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-slate-900">
                      Current Market Snapshot
                    </h2>
                  </div>

                  {marketDataAvailable && (
                    <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700">
                      ● Live data
                    </span>
                  )}
                </div>

                {marketDataAvailable &&
                currentPrice &&
                change24h ? (
                  <div className="mt-5 flex flex-wrap items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Current price
                      </p>

                      <p className="mt-2 text-3xl font-black text-slate-900">
                        {currentPrice}
                      </p>
                    </div>

                    <div className="h-12 w-px bg-slate-300" />

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        24-hour movement
                      </p>

                      <span
                        className={
                          isNegativeChange
                            ? "mt-2 inline-flex rounded-full bg-red-100 px-4 py-2 font-bold text-red-700"
                            : "mt-2 inline-flex rounded-full bg-emerald-100 px-4 py-2 font-bold text-emerald-700"
                        }
                      >
                        {isNegativeChange
                          ? "↘"
                          : "↗"}{" "}
                        {change24h}
                      </span>
                    </div>
                  </div>
                ) : cryptoMapping ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="font-bold text-amber-800">
                      Live market data is temporarily
                      unavailable.
                    </p>

                    <p className="mt-2 text-sm text-amber-700">
                      The analysis remains available
                      using the stored demonstration
                      scoring data.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <p className="font-bold text-blue-800">
                      Live {opportunity.category} data
                      integration is coming next.
                    </p>

                    <p className="mt-2 text-sm text-blue-700">
                      The values below are currently
                      demonstration data and are not
                      live market recommendations.
                    </p>
                  </div>
                )}
              </section>

              <section className="mt-8">
                <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                  MarketPilot scoring
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Opportunity Assessment
                </h2>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Metric
                    label="AI score"
                    value={`${opportunity.score}/100`}
                  />

                  <Metric
                    label="Confidence"
                    value={`${opportunity.confidence}%`}
                  />

                  <Metric
                    label="Expected return"
                    value={
                      opportunity.expectedReturn
                    }
                  />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Risk level
                    </p>

                    <span
                      className={`mt-3 inline-flex rounded-full px-4 py-2 text-sm font-bold ${
                        riskStyles[
                          opportunity.risk
                        ]
                      }`}
                    >
                      {opportunity.risk}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Market trend
                    </p>

                    <p
                      className={`mt-3 text-lg font-bold ${
                        trendStyles[
                          opportunity.trend
                        ]
                      }`}
                    >
                      {opportunity.trend ===
                        "Bullish" && "↗ "}

                      {opportunity.trend ===
                        "Neutral" && "→ "}

                      {opportunity.trend ===
                        "Bearish" && "↘ "}

                      {opportunity.trend}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-600">
                      Demonstration historical
                      accuracy
                    </p>

                    <p className="font-black text-slate-900">
                      {
                        opportunity.historicalAccuracy
                      }
                      %
                    </p>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                      style={{
                        width: `${opportunity.historicalAccuracy}%`,
                      }}
                    />
                  </div>
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-2xl bg-slate-950 p-6 text-white">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-400">
                Why it was selected
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Transparent reasoning
              </h2>

              <ul className="mt-6 space-y-5">
                {reasons.map((reason) => (
                  <li
                    key={reason}
                    className="flex gap-3 text-sm leading-6 text-slate-300"
                  >
                    <span className="text-emerald-400">
                      ✓
                    </span>

                    <span>{reason}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 rounded-xl border border-slate-700 bg-slate-900 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-400">
                  Important disclosure
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  AI score, confidence, expected
                  return, trend and historical
                  accuracy are currently
                  demonstration values. They are not
                  financial advice and do not
                  guarantee future performance.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-bold text-blue-900">
            Recommendation record
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <RecordMetric
              label="Record ID"
              value={`MP-DEMO-${opportunity.symbol}`}
            />

            <RecordMetric
              label="Current status"
              value="Demo · Pending"
            />

            <RecordMetric
              label="Evaluation state"
              value="Not yet verified"
            />
          </div>

          <p className="mt-5 text-sm leading-6 text-blue-700">
            This section is the foundation of the
            future MarketPilot Recommendation
            Ledger, where every real recommendation
            will be permanently recorded and later
            evaluated as successful, unsuccessful or
            pending.
          </p>
        </section>
      </div>
    </main>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({
  label,
  value,
}: MetricProps) {
  return (
    <div className="rounded-2xl bg-blue-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

type RecordMetricProps = {
  label: string;
  value: string;
};

function RecordMetric({
  label,
  value,
}: RecordMetricProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
        {label}
      </p>

      <p className="mt-2 font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}