import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecommendationById } from "@/data/getRecommendation";
import type {
  RecommendationRecord,
  RecommendationStatus,
} from "@/data/recommendations";
import { getMarketQuote } from "@/lib/market-data/marketDataService";
import type {
  MarketDataResult,
  MarketQuote,
} from "@/lib/market-data/types";
import { verifyRecommendation } from "@/lib/recommendationVerification";

type RecommendationDetailsPageProps = {
  params: Promise<{
    recommendationId: string;
  }>;
};

type LiveVerificationPreview = {
  quote: MarketQuote;
  currentReturn: number;
  targetReached: boolean;
  hypotheticalStatus:
    | "Successful"
    | "Unsuccessful";
};

const statusStyles: Record<
  RecommendationStatus,
  string
> = {
  Successful:
    "border-emerald-200 bg-emerald-100 text-emerald-700",
  Unsuccessful:
    "border-red-200 bg-red-100 text-red-700",
  Pending:
    "border-amber-200 bg-amber-100 text-amber-700",
};

export async function generateMetadata({
  params,
}: RecommendationDetailsPageProps): Promise<Metadata> {
  const { recommendationId } = await params;

  const recommendation =
    getRecommendationById(recommendationId);

  if (!recommendation) {
    return {
      title:
        "Recommendation Not Found | MarketPilot AI",
    };
  }

  return {
    title: `${recommendation.id} | MarketPilot AI`,
    description: `Review the complete MarketPilot verification record for ${recommendation.asset}.`,
  };
}

export default async function RecommendationDetailsPage({
  params,
}: RecommendationDetailsPageProps) {
  const { recommendationId } = await params;

  const recommendation =
    getRecommendationById(recommendationId);

  if (!recommendation) {
    notFound();
  }

  const marketDataResult =
    await getMarketQuote({
      symbol: recommendation.symbol,
      category: recommendation.category,
    });

  const livePreview =
    createLiveVerificationPreview(
      recommendation,
      marketDataResult,
    );

  const verificationExplanation =
    createVerificationExplanation(
      recommendation,
    );

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/performance"
            className="inline-flex items-center gap-2 font-bold text-blue-600 transition hover:text-blue-800"
          >
            ← Back to Performance Center
          </Link>

          <Link
            href={`/analysis/${recommendation.symbol}`}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
          >
            Open {recommendation.symbol} Analysis →
          </Link>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <header className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-7 py-8 text-white">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-300">
                  Recommendation audit trail
                </p>

                <h1 className="mt-3 text-4xl font-black md:text-5xl">
                  {recommendation.asset}
                </h1>

                <p className="mt-3 text-slate-300">
                  {recommendation.symbol} ·{" "}
                  {recommendation.category}
                </p>

                <p className="mt-2 font-mono text-sm text-blue-200">
                  {recommendation.id}
                </p>
              </div>

              <span
                className={`inline-flex rounded-full border px-5 py-3 text-sm font-bold ${
                  statusStyles[
                    recommendation.status
                  ]
                }`}
              >
                {getStatusIcon(
                  recommendation.status,
                )}{" "}
                {recommendation.status}
              </span>
            </div>
          </header>

          <div className="p-7">
            <section>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                Original recommendation
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Published Decision
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DataCard
                  label="Published"
                  value={formatDate(
                    recommendation.publishedAt,
                  )}
                />

                <DataCard
                  label="Evaluation deadline"
                  value={formatDate(
                    recommendation.evaluationDate,
                  )}
                />

                <DataCard
                  label="AI score"
                  value={`${recommendation.score}/100`}
                />

                <DataCard
                  label="Confidence"
                  value={`${recommendation.confidence}%`}
                />
              </div>
            </section>

            <section className="mt-10">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                Stored verification inputs
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Historical Price and Target Record
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DataCard
                  label="Entry price"
                  value={formatPrice(
                    recommendation.entryPrice,
                  )}
                />

                <DataCard
                  label="Target return"
                  value={`+${recommendation.targetReturn.toFixed(
                    2,
                  )}%`}
                />

                <DataCard
                  label="Calculated target price"
                  value={formatPrice(
                    recommendation.targetPrice,
                  )}
                />

                <DataCard
                  label="Evaluation price"
                  value={
                    recommendation.evaluationPrice ===
                    null
                      ? "Not available"
                      : formatPrice(
                          recommendation.evaluationPrice,
                        )
                  }
                />
              </div>
            </section>

            <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                  Stored verification result
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Historical Engine Outcome
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This result belongs to the original
                  recommendation record and is not
                  changed by current market prices.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <ResultCard
                    label="Actual return"
                    value={
                      recommendation.actualReturn ===
                      null
                        ? "Pending"
                        : formatReturn(
                            recommendation.actualReturn,
                          )
                    }
                    tone={getReturnTone(
                      recommendation.actualReturn,
                    )}
                  />

                  <ResultCard
                    label="Target reached"
                    value={formatTargetReached(
                      recommendation.targetReached,
                    )}
                    tone={getTargetTone(
                      recommendation.targetReached,
                    )}
                  />

                  <ResultCard
                    label="Final status"
                    value={recommendation.status}
                    tone={getStatusTone(
                      recommendation.status,
                    )}
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Engine explanation
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {verificationExplanation}
                  </p>
                </div>
              </div>

              <aside className="rounded-3xl bg-slate-950 p-6 text-white">
                <p className="text-sm font-bold uppercase tracking-wider text-blue-400">
                  Audit sequence
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Verification Timeline
                </h2>

                <div className="mt-7 space-y-6">
                  <TimelineItem
                    number="01"
                    title="Recommendation published"
                    description={`${formatDate(
                      recommendation.publishedAt,
                    )} at an entry price of ${formatPrice(
                      recommendation.entryPrice,
                    )}.`}
                  />

                  <TimelineItem
                    number="02"
                    title="Target locked"
                    description={`A target return of +${recommendation.targetReturn.toFixed(
                      2,
                    )}% created a target price of ${formatPrice(
                      recommendation.targetPrice,
                    )}.`}
                  />

                  <TimelineItem
                    number="03"
                    title="Evaluation scheduled"
                    description={`The verification deadline was set for ${formatDate(
                      recommendation.evaluationDate,
                    )}.`}
                  />

                  <TimelineItem
                    number="04"
                    title="Outcome calculated"
                    description={getOutcomeDescription(
                      recommendation,
                    )}
                    isLast
                  />
                </div>
              </aside>
            </section>

            <LivePreviewSection
              recommendation={recommendation}
              marketDataResult={marketDataResult}
              livePreview={livePreview}
            />
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
            Demonstration disclosure
          </p>

          <p className="mt-3 text-sm leading-6 text-amber-800">
            The stored audit record currently uses
            demonstration prices. The live preview
            uses the configured market-data provider
            but does not modify the original
            recommendation, its evaluation price or
            its historical result.
          </p>
        </section>
      </div>
    </main>
  );
}

type LivePreviewSectionProps = {
  recommendation: RecommendationRecord;
  marketDataResult: MarketDataResult;
  livePreview: LiveVerificationPreview | null;
};

function LivePreviewSection({
  recommendation,
  marketDataResult,
  livePreview,
}: LivePreviewSectionProps) {
  return (
    <section className="mt-10 rounded-3xl border border-indigo-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
            Live market comparison
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Live Verification Preview
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This preview compares the original entry
            price and target with the latest available
            market quote. It is informational and
            does not overwrite the stored audit
            result.
          </p>
        </div>

        {livePreview && (
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700">
            ● Live provider connected
          </span>
        )}
      </div>

      {livePreview ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DataCard
              label="Current market price"
              value={formatPrice(
                livePreview.quote.price,
              )}
            />

            <DataCard
              label="Return from original entry"
              value={formatReturn(
                livePreview.currentReturn,
              )}
            />

            <DataCard
              label="Target reached today"
              value={
                livePreview.targetReached
                  ? "Yes"
                  : "No"
              }
            />

            <DataCard
              label="Live hypothetical status"
              value={
                livePreview.hypotheticalStatus
              }
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white bg-white/80 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Provider information
              </p>

              <dl className="mt-4 space-y-3 text-sm">
                <DetailRow
                  label="Provider"
                  value={
                    livePreview.quote.provider
                  }
                />

                <DetailRow
                  label="Currency"
                  value={
                    livePreview.quote.currency
                  }
                />

                <DetailRow
                  label="24-hour movement"
                  value={
                    livePreview.quote
                      .change24h === null
                      ? "Not available"
                      : formatReturn(
                          livePreview.quote
                            .change24h,
                        )
                  }
                />

                <DetailRow
                  label="MarketPilot fetched at"
                  value={formatDateTimeUtc(
                    livePreview.quote.fetchedAt,
                  )}
                />
              </dl>
            </div>

            <div className="rounded-2xl bg-indigo-950 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-300">
                Live comparison explanation
              </p>

              <p className="mt-4 text-sm leading-7 text-indigo-100">
                The original entry price was{" "}
                {formatPrice(
                  recommendation.entryPrice,
                )}
                . The current market price is{" "}
                {formatPrice(
                  livePreview.quote.price,
                )}
                , producing a hypothetical return of{" "}
                {formatReturn(
                  livePreview.currentReturn,
                )}
                . Based only on the original target
                of +
                {recommendation.targetReturn.toFixed(
                  2,
                )}
                %, this would currently be classified
                as{" "}
                <strong>
                  {
                    livePreview.hypotheticalStatus
                  }
                </strong>
                .
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-bold text-amber-800">
            Live preview unavailable
          </p>

          <p className="mt-2 text-sm leading-6 text-amber-700">
            {marketDataResult.success
              ? "The live market quote could not be converted into a verification preview."
              : marketDataResult.error.message}
          </p>

          <p className="mt-3 text-xs text-amber-600">
            The historical audit record remains
            available and unchanged.
          </p>
        </div>
      )}
    </section>
  );
}

function createLiveVerificationPreview(
  recommendation: RecommendationRecord,
  marketDataResult: MarketDataResult,
): LiveVerificationPreview | null {
  if (!marketDataResult.success) {
    return null;
  }

  const liveVerification =
    verifyRecommendation({
      entryPrice: recommendation.entryPrice,
      evaluationPrice:
        marketDataResult.quote.price,
      targetReturn:
        recommendation.targetReturn,
    });

  if (
    liveVerification.actualReturn === null ||
    liveVerification.targetReached === null ||
    liveVerification.status === "Pending"
  ) {
    return null;
  }

  return {
    quote: marketDataResult.quote,
    currentReturn:
      liveVerification.actualReturn,
    targetReached:
      liveVerification.targetReached,
    hypotheticalStatus:
      liveVerification.status,
  };
}

type DataCardProps = {
  label: string;
  value: string;
};

function DataCard({
  label,
  value,
}: DataCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-xl font-black text-slate-900">
        {value}
      </p>
    </article>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({
  label,
  value,
}: DetailRowProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
      <dt className="font-medium text-slate-500">
        {label}
      </dt>

      <dd className="font-bold text-slate-900">
        {value}
      </dd>
    </div>
  );
}

type ResultTone =
  | "positive"
  | "negative"
  | "pending"
  | "neutral";

type ResultCardProps = {
  label: string;
  value: string;
  tone: ResultTone;
};

const resultToneStyles: Record<
  ResultTone,
  string
> = {
  positive:
    "border-emerald-200 bg-emerald-50 text-emerald-800",
  negative:
    "border-red-200 bg-red-50 text-red-800",
  pending:
    "border-amber-200 bg-amber-50 text-amber-800",
  neutral:
    "border-slate-200 bg-white text-slate-800",
};

function ResultCard({
  label,
  value,
  tone,
}: ResultCardProps) {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        resultToneStyles[tone]
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">
        {label}
      </p>

      <p className="mt-3 text-xl font-black">
        {value}
      </p>
    </article>
  );
}

type TimelineItemProps = {
  number: string;
  title: string;
  description: string;
  isLast?: boolean;
};

function TimelineItem({
  number,
  title,
  description,
  isLast = false,
}: TimelineItemProps) {
  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div className="absolute left-5 top-10 h-[calc(100%+1.5rem)] w-px bg-slate-700" />
      )}

      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
        {number}
      </div>

      <div className="pb-1">
        <h3 className="font-bold text-white">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function createVerificationExplanation(
  record: RecommendationRecord,
): string {
  if (
    record.evaluationPrice === null ||
    record.actualReturn === null
  ) {
    return "The recommendation remains pending because no evaluation price has been recorded. The engine cannot calculate a final return or verification result until an evaluation price becomes available.";
  }

  if (record.status === "Successful") {
    return `The evaluation price of ${formatPrice(
      record.evaluationPrice,
    )} produced an actual return of ${formatReturn(
      record.actualReturn,
    )}. This met or exceeded the original target of +${record.targetReturn.toFixed(
      2,
    )}%, so the engine classified the recommendation as successful.`;
  }

  return `The evaluation price of ${formatPrice(
    record.evaluationPrice,
  )} produced an actual return of ${formatReturn(
    record.actualReturn,
  )}. This was below the original target of +${record.targetReturn.toFixed(
    2,
  )}%, so the engine classified the recommendation as unsuccessful.`;
}

function getOutcomeDescription(
  record: RecommendationRecord,
): string {
  if (
    record.evaluationPrice === null ||
    record.actualReturn === null
  ) {
    return "No evaluation price is currently available, so the recommendation remains pending.";
  }

  return `${formatPrice(
    record.evaluationPrice,
  )} produced ${formatReturn(
    record.actualReturn,
  )}, resulting in a ${record.status.toLowerCase()} classification.`;
}

function getStatusIcon(
  status: RecommendationStatus,
): string {
  if (status === "Successful") {
    return "✓";
  }

  if (status === "Unsuccessful") {
    return "✕";
  }

  return "◷";
}

function formatTargetReached(
  targetReached: boolean | null,
): string {
  if (targetReached === null) {
    return "Pending";
  }

  return targetReached ? "Yes" : "No";
}

function getReturnTone(
  actualReturn: number | null,
): ResultTone {
  if (actualReturn === null) {
    return "pending";
  }

  return actualReturn >= 0
    ? "positive"
    : "negative";
}

function getTargetTone(
  targetReached: boolean | null,
): ResultTone {
  if (targetReached === null) {
    return "pending";
  }

  return targetReached
    ? "positive"
    : "negative";
}

function getStatusTone(
  status: RecommendationStatus,
): ResultTone {
  if (status === "Successful") {
    return "positive";
  }

  if (status === "Unsuccessful") {
    return "negative";
  }

  return "pending";
}

function formatReturn(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(
    2,
  )}%`;
}

function formatPrice(value: number): string {
  if (value >= 1_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (value >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTimeUtc(
  value: string,
): string {
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}