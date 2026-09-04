import type {
  RecommendationRecord,
  RecommendationStatus,
} from "@/data/recommendations";
import type {
  RecommendationPerformanceMetrics,
} from "@/lib/services/recommendationPerformanceService";

const statusStyles: Record<
  RecommendationStatus,
  string
> = {
  Successful:
    "bg-emerald-100 text-emerald-700",
  Unsuccessful:
    "bg-red-100 text-red-700",
  Pending:
    "bg-amber-100 text-amber-700",
};

type PerformanceCenterProps = {
  recommendationRecords: RecommendationRecord[];
  metrics: RecommendationPerformanceMetrics;
};

export default function PerformanceCenter({
  recommendationRecords,
  metrics,
}: PerformanceCenterProps) {
  return (
    <section className="mb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Transparent performance
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900">
            AI Performance Center
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            MarketPilot records successful,
            unsuccessful and pending recommendations
            instead of displaying only positive
            results.
          </p>
        </div>

        <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700">
          Recommendation history
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total recommendations"
          value={String(metrics.total)}
          description={`${metrics.verified} verified`}
        />

        <MetricCard
          label="Success rate"
          value={`${metrics.successRate.toFixed(1)}%`}
          description={`${metrics.successful} successful`}
        />

        <MetricCard
          label="Average verified return"
          value={`${
            metrics.averageReturn >= 0 ? "+" : ""
          }${metrics.averageReturn.toFixed(2)}%`}
          description="Successful and failed included"
        />

        <MetricCard
          label="Pending evaluation"
          value={String(metrics.pending)}
          description="Awaiting evaluation date"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="text-xl font-bold text-slate-900">
            Recommendation Ledger
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Every recommendation remains visible,
            regardless of its final result.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <TableHeading>Record</TableHeading>
                <TableHeading>Asset</TableHeading>
                <TableHeading>Published</TableHeading>
                <TableHeading>Target</TableHeading>
                <TableHeading>
                  Actual return
                </TableHeading>
                <TableHeading>Status</TableHeading>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {recommendationRecords.map(
                (record) => (
                  <tr
                    key={record.id}
                    className="transition hover:bg-slate-50"
                  >
                    <TableCell>
                      <p className="font-bold text-blue-600">
                        {record.id}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Score {record.score}
                      </p>
                    </TableCell>

                    <TableCell>
                      <p className="font-bold text-slate-900">
                        {record.asset}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {record.symbol} ·{" "}
                        {record.category}
                      </p>
                    </TableCell>

                    <TableCell>
                      {formatDate(
                        record.publishedAt,
                      )}
                    </TableCell>

                    <TableCell>
                      +{record.targetReturn.toFixed(
                        1,
                      )}
                      %
                    </TableCell>

                    <TableCell>
                      {record.actualReturn === null
                        ? "Pending"
                        : `${
                            record.actualReturn >= 0
                              ? "+"
                              : ""
                          }${record.actualReturn.toFixed(
                            1,
                          )}%`}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          statusStyles[
                            record.status
                          ]
                        }`}
                      >
                        {record.status}
                      </span>
                    </TableCell>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-blue-50 px-6 py-4">
          <p className="text-xs leading-5 text-blue-700">
            Recommendation records are retained with
            identifiers, timestamps and evaluation
            rules so performance can be tracked
            transparently over time.
          </p>
        </div>
      </div>
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
};

function MetricCard({
  label,
  value,
  description,
}: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>
    </article>
  );
}

type TableContentProps = {
  children: React.ReactNode;
};

function TableHeading({
  children,
}: TableContentProps) {
  return (
    <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: TableContentProps) {
  return (
    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
      {children}
    </td>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
