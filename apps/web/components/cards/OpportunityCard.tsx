type RiskLevel = "Low" | "Medium" | "High";
type Trend = "Bullish" | "Neutral" | "Bearish";

type OpportunityCardProps = {
  rank: number;
  asset: string;
  symbol: string;
  category: string;
  score: number;
  expectedReturn: string;
  risk: RiskLevel;
  confidence: number;
  trend: Trend;
  historicalAccuracy: number;
};

const riskStyles: Record<RiskLevel, string> = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

const trendStyles: Record<Trend, string> = {
  Bullish: "text-emerald-600",
  Neutral: "text-amber-600",
  Bearish: "text-red-600",
};

const rankMedals = ["🥇", "🥈", "🥉"];

export default function OpportunityCard({
  rank,
  asset,
  symbol,
  category,
  score,
  expectedReturn,
  risk,
  confidence,
  trend,
  historicalAccuracy,
}: OpportunityCardProps) {
  const medal = rankMedals[rank - 1] ?? `#${rank}`;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-blue-600">
            {medal} #{rank}
          </p>

          <h3 className="mt-2 text-xl font-bold text-slate-900">
            {asset}
          </h3>

          <p className="text-sm font-medium text-slate-500">
            {symbol} · {category}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
            AI Score
          </p>
          <p className="text-2xl font-black text-blue-700">
            {score}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <Metric label="Expected return" value={expectedReturn} />
        <Metric label="Confidence" value={`${confidence}%`} />

        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[11px] font-bold uppercase text-slate-500">
            Risk
          </dt>
          <dd
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${riskStyles[risk]}`}
          >
            {risk}
          </dd>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[11px] font-bold uppercase text-slate-500">
            Trend
          </dt>
          <dd className={`mt-2 text-sm font-bold ${trendStyles[trend]}`}>
            {trend === "Bullish" && "↗ "}
            {trend === "Neutral" && "→ "}
            {trend === "Bearish" && "↘ "}
            {trend}
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded-xl border border-slate-200 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">
            Historical accuracy
          </span>
          <span className="font-bold text-slate-900">
            {historicalAccuracy}%
          </span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${historicalAccuracy}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-blue-600"
      >
        Analyze Opportunity →
      </button>
    </article>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-[11px] font-bold uppercase text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-base font-bold text-slate-900">
        {value}
      </dd>
    </div>
  );
}