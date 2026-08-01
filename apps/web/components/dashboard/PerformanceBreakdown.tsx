import Link from "next/link";
import { recommendationHistoryService } from "@/lib/services/recommendationHistoryService";
import { calculateAllCategoryPerformance } from "@/lib/services/recommendationPerformanceService";

export default function PerformanceBreakdown() {
  const recommendationRecords =
    recommendationHistoryService.getAllRecommendations();

  const categoryPerformance =
    calculateAllCategoryPerformance(
      recommendationRecords,
    );

  return (
    <section className="mb-12 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Analytics
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900">
            Performance Breakdown
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Recommendation performance grouped by
            investment category.
          </p>
        </div>

        <Link
          href="/performance"
          className="inline-flex rounded-xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-blue-600"
        >
          Open Full Performance Center â†’
        </Link>
      </div>

      <div className="space-y-6">
        {categoryPerformance.map(
          ({
            category,
            successful,
            verified,
            successRate,
          }) => (
            <div key={category}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-900">
                    {category}
                  </span>

                  <p className="mt-1 text-xs text-slate-500">
                    {successful} successful from{" "}
                    {verified} verified
                  </p>
                </div>

                <span className="font-bold text-blue-700">
                  {successRate.toFixed(0)}%
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                  style={{
                    width: `${successRate}%`,
                  }}
                />
              </div>
            </div>
          ),
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm leading-6 text-blue-700">
          Open the full Performance Center to filter
          records by category and result, inspect
          recommendation history and view
          recalculated performance metrics.
        </p>
      </div>
    </section>
  );
}
