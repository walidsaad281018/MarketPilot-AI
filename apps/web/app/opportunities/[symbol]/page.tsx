import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import type {
  RiskLevel,
  Trend,
} from "@/data/opportunities";
import {
  analyzeOpportunity,
  type AnalysisTone,
  type RecommendationLabel,
} from "@/lib/services/opportunityAnalysisService";
import {
  getOpportunityBySymbol,
} from "@/lib/services/opportunityService";

type OpportunityAnalysisPageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

const riskStyles: Record<
  RiskLevel,
  string
> = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

const trendStyles: Record<
  Trend,
  string
> = {
  Bullish: "text-emerald-600",
  Neutral: "text-amber-600",
  Bearish: "text-red-600",
};

const recommendationStyles: Record<
  RecommendationLabel,
  string
> = {
  BUY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  WATCH:
    "bg-amber-100 text-amber-700 border-amber-200",
  AVOID:
    "bg-red-100 text-red-700 border-red-200",
};

const toneIcon: Record<
  AnalysisTone,
  string
> = {
  positive: "✓",
  neutral: "•",
  negative: "!",
};

const toneStyles: Record<
  AnalysisTone,
  string
> = {
  positive:
    "bg-emerald-100 text-emerald-700",
  neutral:
    "bg-slate-100 text-slate-700",
  negative:
    "bg-red-100 text-red-700",
};

export default async function OpportunityAnalysisPage({
  params,
}: OpportunityAnalysisPageProps) {
  const { symbol } = await params;

  const opportunity =
    await getOpportunityBySymbol(
      symbol,
    );

  if (!opportunity) {
    notFound();
  }

  const analysis =
    analyzeOpportunity(
      opportunity,
    );

  const formattedPrice =
    formatCurrentPrice(
      opportunity.currentPriceUsd,
    );

  const formattedChange =
    formatPriceChange(
      opportunity.priceChange24h,
    );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-6">
        <Navbar />

        <div className="py-12">
          <Link
            href="/opportunities"
            className="inline-flex items-center text-sm font-bold text-blue-600 transition hover:text-blue-800"
          >
            ← Back to opportunities
          </Link>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                  MarketPilot opportunity
                </p>

                <h1 className="mt-3 text-4xl font-black text-slate-900 md:text-5xl">
                  {opportunity.asset}
                </h1>

                <p className="mt-3 text-lg font-medium text-slate-500">
                  {opportunity.symbol} ·{" "}
                  {opportunity.category}
                </p>

                {formattedPrice ? (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span className="text-3xl font-black text-slate-900">
                      {formattedPrice}
                    </span>

                    {formattedChange ? (
                      <span
                        className={
                          opportunity.priceChange24h !=
                            null &&
                          opportunity.priceChange24h <
                            0
                            ? "rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700"
                            : "rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700"
                        }
                      >
                        24h {formattedChange}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 md:items-end">
                <div className="min-w-40 rounded-2xl bg-blue-50 px-8 py-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    AI Score
                  </p>

                  <p className="mt-2 text-5xl font-black text-blue-700">
                    {opportunity.score}
                  </p>

                  <p className="mt-2 text-sm font-medium text-blue-700">
                    Rank #{opportunity.rank}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border px-8 py-4 text-center ${recommendationStyles[analysis.recommendation]}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Recommendation
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {analysis.recommendation}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                style={{
                  width: `${opportunity.score}%`,
                }}
              />
            </div>
          </section>

          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <AnalysisMetric
              label="Expected return"
              value={
                opportunity.expectedReturn
              }
            />

            <AnalysisMetric
              label="Confidence"
              value={`${opportunity.confidence}%`}
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Risk
              </p>

              <span
                className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-bold ${riskStyles[opportunity.risk]}`}
              >
                {opportunity.risk}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Trend
              </p>

              <p
                className={`mt-4 text-xl font-bold ${trendStyles[opportunity.trend]}`}
              >
                {getTrendArrow(
                  opportunity.trend,
                )}{" "}
                {opportunity.trend}
              </p>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              MarketPilot summary
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Recommendation analysis
            </h2>

            <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600">
              {
                analysis.recommendationSummary
              }
            </p>

            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
              This assessment explains
              MarketPilot&apos;s current
              quantitative signals. It is not
              financial advice and does not
              guarantee future performance.
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <AnalysisList
              title="Why MarketPilot selected it"
              eyebrow="Strengths"
              items={analysis.strengths}
            />

            <AnalysisList
              title="Potential risk factors"
              eyebrow="Risks"
              items={analysis.risks}
            />
          </section>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Transparent scoring
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Score breakdown
            </h2>

            <p className="mt-4 max-w-3xl leading-7 text-slate-600">
              The overall MarketPilot score
              combines trend, momentum, risk,
              volatility and liquidity.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {analysis.scoreBreakdown.map(
                (component) => (
                  <div
                    key={component.label}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-bold text-slate-900">
                        {component.label}
                      </h3>

                      <span className="text-xl font-black text-blue-700">
                        {component.score}
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                        style={{
                          width: `${component.score}%`,
                        }}
                      />
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {
                        component.description
                      }
                    </p>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Market statistics
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AnalysisMetric
                label="Historical accuracy"
                value={`${opportunity.historicalAccuracy}%`}
              />

              <AnalysisMetric
                label="24h movement"
                value={
                  formattedChange ??
                  "Not available"
                }
              />

              <AnalysisMetric
                label="24h volatility"
                value={formatPercentage(
                  opportunity.volatility24h,
                )}
              />

              <AnalysisMetric
                label="24h volume"
                value={formatCompactCurrency(
                  opportunity.volume24hUsd,
                )}
              />
            </dl>
          </section>
        </div>

        <Footer />
      </div>
    </main>
  );
}

type AnalysisListProps = {
  title: string;
  eyebrow: string;
  items: {
    title: string;
    description: string;
    tone: AnalysisTone;
  }[];
};

function AnalysisList({
  title,
  eyebrow,
  items,
}: AnalysisListProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-bold text-slate-900">
        {title}
      </h2>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <article
            key={`${item.title}-${item.description}`}
            className="flex gap-4 rounded-2xl bg-slate-50 p-4"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${toneStyles[item.tone]}`}
            >
              {toneIcon[item.tone]}
            </span>

            <div>
              <h3 className="font-bold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

type AnalysisMetricProps = {
  label: string;
  value: string;
};

function AnalysisMetric({
  label,
  value,
}: AnalysisMetricProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </dt>

      <dd className="mt-4 text-xl font-black text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function getTrendArrow(
  trend: Trend,
): string {
  if (trend === "Bullish") {
    return "↗";
  }

  if (trend === "Bearish") {
    return "↘";
  }

  return "→";
}

function formatCurrentPrice(
  price: number | null | undefined,
): string | null {
  if (price == null) {
    return null;
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits:
        price >= 1 ? 2 : 4,
      maximumFractionDigits:
        price >= 1 ? 2 : 8,
    },
  ).format(price);
}

function formatPriceChange(
  change: number | null,
): string | null {
  if (change == null) {
    return null;
  }

  const sign =
    change > 0 ? "+" : "";

  return `${sign}${change.toFixed(
    2,
  )}%`;
}

function formatPercentage(
  value: number | null,
): string {
  if (value == null) {
    return "Not available";
  }

  return `${value.toFixed(2)}%`;
}

function formatCompactCurrency(
  value: number | null,
): string {
  if (value == null) {
    return "Not available";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    },
  ).format(value);
}