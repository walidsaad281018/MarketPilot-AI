import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QuoteFreshnessPanel from "@/components/market/QuoteFreshnessPanel";
import { getRecommendationById } from "@/data/getRecommendation";
import type {
  RecommendationRecord,
  RecommendationStatus,
} from "@/data/recommendations";
import { applyFreshnessTestOverride } from "@/lib/market-data/freshnessTestOverride";
import { evaluateLiveVerificationPolicy } from "@/lib/market-data/liveVerificationPolicy";
import { getMarketQuote } from "@/lib/market-data/marketDataService";
import type {
  LiveVerificationDecision,
} from "@/lib/market-data/liveVerificationPolicy";
import type {
  MarketDataResult,
  MarketQuote,
} from "@/lib/market-data/types";
import { verifyRecommendation } from "@/lib/recommendationVerification";

type RecommendationDetailsPageProps = {
  params: Promise<{
    recommendationId: string;
  }>;
  searchParams?: Promise<{
    freshness?: string;
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
  searchParams,
}: RecommendationDetailsPageProps) {
  const { recommendationId } = await params;
  const query = await searchParams;

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

  if (marketDataResult.success) {
    marketDataResult.quote =
      applyFreshnessTestOverride(
        marketDataResult.quote,
        query?.freshness,
      );
  }

  const livePolicy =
    marketDataResult.success
      ? evaluateLiveVerificationPolicy(
          marketDataResult.quote,
        )
      : null;

  const livePreview =
    createLiveVerificationPreview(
      recommendation,
      marketDataResult,
      livePolicy,
    );

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <NavigationLinks
          recommendation={recommendation}
        />

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <RecommendationHeader
            recommendation={recommendation}
          />

          <div className="p-7">
            <PublishedDecision
              recommendation={recommendation}
            />

            <HistoricalInputs
              recommendation={recommendation}
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
              <HistoricalOutcome
                recommendation={recommendation}
              />

              <VerificationTimeline
                recommendation={recommendation}
              />
            </div>

            <LivePreviewSection
              recommendation={recommendation}
              marketDataResult={marketDataResult}
              livePolicy={livePolicy}
              livePreview={livePreview}
            />
          </div>
        </section>

        <Disclosure />
      </div>
    </main>
  );
}

type RecommendationProps = {
  recommendation: RecommendationRecord;
};

function NavigationLinks({
  recommendation,
}: RecommendationProps) {
  return (
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
  );
}

function RecommendationHeader({
  recommendation,
}: RecommendationProps) {
  return (
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
            statusStyles[recommendation.status]
          }`}
        >
          {getStatusIcon(
            recommendation.status,
          )}{" "}
          {recommendation.status}
        </span>
      </div>
    </header>
  );
}

function PublishedDecision({
  recommendation,
}: RecommendationProps) {
  return (
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
  );
}

function HistoricalInputs({
  recommendation,
}: RecommendationProps) {
  return (
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
  );
}

function HistoricalOutcome({
  recommendation,
}: RecommendationProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
        Stored verification result
      </p>

      <h2 className="mt-2 text-2xl font-bold text-slate-900">
        Historical Engine Outcome
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        This stored result is not changed by current
        market prices.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <ResultCard
          label="Actual return"
          value={
            recommendation.actualReturn === null
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
          {createVerificationExplanation(
            recommendation,
          )}
        </p>
      </div>
    </section>
  );
}

function VerificationTimeline({
  recommendation,
}: RecommendationProps) {
  return (
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
  );
}

type LivePreviewSectionProps = {
  recommendation: RecommendationRecord;
  marketDataResult: MarketDataResult;
  livePolicy:
    | LiveVerificationDecision
    | null;
  livePreview:
    | LiveVerificationPreview
    | null;
};

function LivePreviewSection({
  recommendation,
  marketDataResult,
  livePolicy,
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
            Current market data is separated from the
            stored historical audit result.
          </p>
        </div>

        {livePreview && (
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700">
            ● Safe live verification
          </span>
        )}
      </div>

      {!marketDataResult.success ? (
        <MarketDataUnavailable
          message={
            marketDataResult.error.message
          }
        />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DataCard
              label="Current market price"
              value={formatPrice(
                marketDataResult.quote.price,
              )}
            />

            <DataCard
              label="24-hour movement"
              value={
                marketDataResult.quote.change24h ===
                null
                  ? "Not available"
                  : formatReturn(
                      marketDataResult.quote
                        .change24h,
                    )
              }
            />

            <DataCard
              label="Target price"
              value={formatPrice(
                recommendation.targetPrice,
              )}
            />

            <DataCard
              label="Provider"
              value={
                marketDataResult.quote.provider
              }
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <QuoteFreshnessPanel
              freshness={
                marketDataResult.quote.freshness
              }
              providerUpdatedAt={
                marketDataResult.quote
                  .providerUpdatedAt
              }
              fetchedAt={
                marketDataResult.quote.fetchedAt
              }
            />

            {livePolicy && (
              <LiveSafetyPanel
                policy={livePolicy}
              />
            )}
          </div>

          {livePreview ? (
            <AllowedPreview
              recommendation={recommendation}
              preview={livePreview}
            />
          ) : (
            <BlockedPreview
              policy={livePolicy}
            />
          )}
        </>
      )}
    </section>
  );
}

function AllowedPreview({
  recommendation,
  preview,
}: {
  recommendation: RecommendationRecord;
  preview: LiveVerificationPreview;
}) {
  return (
    <section className="mt-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <ResultCard
          label="Return from original entry"
          value={formatReturn(
            preview.currentReturn,
          )}
          tone={
            preview.currentReturn >= 0
              ? "positive"
              : "negative"
          }
        />

        <ResultCard
          label="Target reached today"
          value={
            preview.targetReached
              ? "Yes"
              : "No"
          }
          tone={
            preview.targetReached
              ? "positive"
              : "negative"
          }
        />

        <ResultCard
          label="Live hypothetical status"
          value={
            preview.hypotheticalStatus
          }
          tone={
            preview.hypotheticalStatus ===
            "Successful"
              ? "positive"
              : "negative"
          }
        />
      </div>

      <div className="mt-6 rounded-2xl bg-indigo-950 p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-300">
          Safe live comparison
        </p>

        <p className="mt-4 text-sm leading-7 text-indigo-100">
          The current price of{" "}
          {formatPrice(preview.quote.price)}{" "}
          produces a hypothetical return of{" "}
          {formatReturn(
            preview.currentReturn,
          )}
          . Because the quote is fresh, MarketPilot
          permits a live classification of{" "}
          <strong>
            {preview.hypotheticalStatus}
          </strong>
          {" "}against the original target of +
          {recommendation.targetReturn.toFixed(2)}%.
        </p>
      </div>
    </section>
  );
}

function BlockedPreview({
  policy,
}: {
  policy:
    | LiveVerificationDecision
    | null;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
        Classification protected
      </p>

      <h3 className="mt-2 text-lg font-bold text-amber-900">
        No live success or failure assigned
      </h3>

      <p className="mt-3 text-sm leading-6 text-amber-800">
        {policy?.message ??
          "MarketPilot could not confirm that the quote is safe for live verification."}
      </p>

      <p className="mt-3 text-xs leading-5 text-amber-700">
        The market price remains visible for
        information, but it is not being used to
        classify the recommendation.
      </p>
    </div>
  );
}

function LiveSafetyPanel({
  policy,
}: {
  policy: LiveVerificationDecision;
}) {
  const styles =
    getPolicyStyles(policy.status);

  return (
    <section
      className={`rounded-2xl border p-5 ${styles.panel}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide opacity-70">
            Verification safety
          </p>

          <h3 className="mt-2 text-lg font-bold">
            {policy.title}
          </h3>
        </div>

        <span
          className={`rounded-full border px-4 py-2 text-xs font-bold ${styles.badge}`}
        >
          {policy.allowed
            ? "✓ Allowed"
            : "✕ Blocked"}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6">
        {policy.message}
      </p>
    </section>
  );
}

function MarketDataUnavailable({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="font-bold text-amber-800">
        Live preview unavailable
      </p>

      <p className="mt-2 text-sm leading-6 text-amber-700">
        {message}
      </p>

      <p className="mt-3 text-xs text-amber-600">
        The historical audit record remains
        available and unchanged.
      </p>
    </div>
  );
}

function createLiveVerificationPreview(
  recommendation: RecommendationRecord,
  marketDataResult: MarketDataResult,
  policy:
    | LiveVerificationDecision
    | null,
): LiveVerificationPreview | null {
  if (
    !marketDataResult.success ||
    !policy?.allowed
  ) {
    return null;
  }

  const verification =
    verifyRecommendation({
      entryPrice: recommendation.entryPrice,
      evaluationPrice:
        marketDataResult.quote.price,
      targetReturn:
        recommendation.targetReturn,
    });

  if (
    verification.actualReturn === null ||
    verification.targetReached === null ||
    verification.status === "Pending"
  ) {
    return null;
  }

  return {
    quote: marketDataResult.quote,
    currentReturn:
      verification.actualReturn,
    targetReached:
      verification.targetReached,
    hypotheticalStatus:
      verification.status,
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

function getPolicyStyles(
  status:
    LiveVerificationDecision["status"],
) {
  if (status === "Fresh") {
    return {
      panel:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
      badge:
        "border-emerald-200 bg-emerald-100 text-emerald-700",
    };
  }

  if (status === "Stale") {
    return {
      panel:
        "border-red-200 bg-red-50 text-red-800",
      badge:
        "border-red-200 bg-red-100 text-red-700",
    };
  }

  return {
    panel:
      "border-amber-200 bg-amber-50 text-amber-800",
    badge:
      "border-amber-200 bg-amber-100 text-amber-700",
  };
}

function createVerificationExplanation(
  record: RecommendationRecord,
): string {
  if (
    record.evaluationPrice === null ||
    record.actualReturn === null
  ) {
    return "The recommendation remains pending because no evaluation price has been recorded.";
  }

  if (record.status === "Successful") {
    return `The evaluation price of ${formatPrice(
      record.evaluationPrice,
    )} produced an actual return of ${formatReturn(
      record.actualReturn,
    )}. This met or exceeded the original target of +${record.targetReturn.toFixed(
      2,
    )}%.`;
  }

  return `The evaluation price of ${formatPrice(
    record.evaluationPrice,
  )} produced an actual return of ${formatReturn(
    record.actualReturn,
  )}. This was below the original target of +${record.targetReturn.toFixed(
    2,
  )}%.`;
}

function getOutcomeDescription(
  record: RecommendationRecord,
): string {
  if (
    record.evaluationPrice === null ||
    record.actualReturn === null
  ) {
    return "No evaluation price is available, so the recommendation remains pending.";
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

function formatReturn(
  value: number,
): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(
    2,
  )}%`;
}

function formatPrice(
  value: number,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits:
      value < 1 ? 4 : 2,
    maximumFractionDigits:
      value < 1 ? 8 : 4,
  }).format(value);
}

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(
    new Date(`${value}T00:00:00`),
  );
}

function Disclosure() {
  return (
    <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
        Demonstration disclosure
      </p>

      <p className="mt-3 text-sm leading-6 text-amber-800">
        Live prices are informational. Only quotes
        that satisfy MarketPilot’s freshness policy
        may generate a live hypothetical result.
        Stored historical results remain unchanged.
      </p>
    </section>
  );
}