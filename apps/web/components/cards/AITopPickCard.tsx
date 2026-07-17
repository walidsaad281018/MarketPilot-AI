import Link from "next/link";

type AITopPickCardProps = {
  assetName: string;
  symbol: string;
  category: string;
  score: number;
  expectedReturn: string;
  confidence: number;
  risk: "Low" | "Medium" | "High";
  currentPrice: string;
  change24h: string;
  trend: "Bullish" | "Neutral" | "Bearish";
  reasons: string[];
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

export default function AITopPickCard({
  assetName,
  symbol,
  category,
  score,
  expectedReturn,
  confidence,
  risk,
  currentPrice,
  change24h,
  trend,
  reasons,
}: AITopPickCardProps) {
  const isNegativeChange =
    change24h.startsWith("-");

  return (
    <section className="mb-12 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">
          🏆 AI Top Pick Today
        </p>
      </div>

      <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <div>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                {category}
              </p>

              <h2 className="text-3xl font-bold text-slate-900">
                {assetName}

                <span className="ml-2 text-lg font-semibold text-slate-500">
                  {symbol}
                </span>
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <p className="text-slate-500">
                  Current price:{" "}
                  <span className="font-semibold text-slate-800">
                    {currentPrice}
                  </span>
                </p>

                <span
                  className={
                    isNegativeChange
                      ? "rounded-full bg-red-100 px-3 py-1 font-bold text-red-700"
                      : "rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700"
                  }
                >
                  24h {change24h}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50 px-5 py-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                AI Score
              </p>

              <p className="mt-1 text-4xl font-black text-blue-700">
                {score}
              </p>

              <p className="text-xs text-blue-500">
                out of 100
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-slate-600">
                Score strength
              </span>

              <span className="font-semibold text-blue-700">
                {score}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric
              label="Expected return"
              value={expectedReturn}
            />

            <Metric
              label="Confidence"
              value={`${confidence}%`}
            />

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Risk
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${riskStyles[risk]}`}
              >
                {risk}
              </span>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Trend
              </p>

              <p
                className={`mt-2 font-bold ${trendStyles[trend]}`}
              >
                {trend === "Bullish" && "↗ "}
                {trend === "Bearish" && "↘ "}
                {trend === "Neutral" && "→ "}
                {trend}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 p-6 text-white">
          <h3 className="text-lg font-bold">
            Why MarketPilot selected this asset
          </h3>

          <ul className="mt-5 space-y-4">
            {reasons.map((reason) => (
              <li
                key={reason}
                className="flex gap-3 text-sm text-slate-300"
              >
                <span className="mt-0.5 text-emerald-400">
                  ✓
                </span>

                <span>{reason}</span>
              </li>
            ))}
          </ul>

          <Link
            href={`/analysis/${symbol}`}
            className="mt-7 block w-full rounded-xl bg-blue-600 px-5 py-3 text-center font-bold text-white transition hover:bg-blue-500"
          >
            View Transparent Analysis →
          </Link>

          <p className="mt-3 text-center text-xs text-slate-500">
            Research insight only. Returns are not guaranteed.
          </p>
        </div>
      </div>
    </section>
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
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}