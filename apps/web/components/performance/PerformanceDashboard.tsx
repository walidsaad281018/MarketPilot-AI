"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type RecommendationCategory,
  type RecommendationRecord,
  type RecommendationStatus,
} from "@/data/recommendations";
import {
  fetchRecommendations,
  RecommendationApiError,
  type RecommendationApiFilters,
  type RecommendationApiPagination,
} from "@/lib/api/recommendationApiClient";
import {
  type RecommendationSortField,
  type RecommendationSortOrder,
} from "@/lib/recommendations/recommendationQueryEngine";
import {
  calculateRecommendationPerformance,
} from "@/lib/services/recommendationPerformanceService";

type FilterFormState = {
  category: "" | RecommendationCategory;
  symbol: string;
  status: "" | RecommendationStatus;
  minScore: string;
  minConfidence: string;
  publishedAfter: string;
  publishedBefore: string;
  sortBy: RecommendationSortField;
  sortOrder: RecommendationSortOrder;
  pageSize: string;
};

const initialFilterForm: FilterFormState = {
  category: "",
  symbol: "",
  status: "",
  minScore: "",
  minConfidence: "",
  publishedAfter: "",
  publishedBefore: "",
  sortBy: "publishedAt",
  sortOrder: "desc",
  pageSize: "10",
};

const initialQuery: RecommendationApiFilters = {
  sortBy: "publishedAt",
  sortOrder: "desc",
  page: 1,
  pageSize: 10,
};

const initialPagination: RecommendationApiPagination = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

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

export default function PerformanceDashboard() {
  const [
    filterForm,
    setFilterForm,
  ] = useState<FilterFormState>(
    initialFilterForm,
  );

  const [
    appliedQuery,
    setAppliedQuery,
  ] = useState<RecommendationApiFilters>(
    initialQuery,
  );

  const [
    recommendationRecords,
    setRecommendationRecords,
  ] = useState<RecommendationRecord[]>([]);

  const [
    pagination,
    setPagination,
  ] = useState<RecommendationApiPagination>(
    initialPagination,
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  const latestRequestId =
    useRef(0);

  useEffect(() => {
    const requestId =
      latestRequestId.current + 1;

    latestRequestId.current =
      requestId;

    async function loadRecommendations() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response =
          await fetchRecommendations(
            appliedQuery,
          );

        if (
          requestId !==
          latestRequestId.current
        ) {
          return;
        }

        setRecommendationRecords(
          response.data,
        );

        setPagination(
          response.pagination,
        );
      } catch (error) {
        if (
          requestId !==
          latestRequestId.current
        ) {
          return;
        }

        setRecommendationRecords([]);
        setPagination(
          initialPagination,
        );

        if (
          error instanceof
          RecommendationApiError
        ) {
          setErrorMessage(
            error.message,
          );
        } else {
          setErrorMessage(
            "Unable to load recommendation records.",
          );
        }
      } finally {
        if (
          requestId ===
          latestRequestId.current
        ) {
          setIsLoading(false);
        }
      }
    }

    void loadRecommendations();
  }, [appliedQuery]);

  const metrics =
    calculateRecommendationPerformance(
      recommendationRecords,
    );

  function updateFilter<
    TKey extends keyof FilterFormState,
  >(
    key: TKey,
    value: FilterFormState[TKey],
  ): void {
    setFilterForm(
      (currentFilters) => ({
        ...currentFilters,
        [key]: value,
      }),
    );
  }

  function applyFilters(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();

    setAppliedQuery(
      buildRecommendationQuery(
        filterForm,
        1,
      ),
    );
  }

  function resetFilters(): void {
    setFilterForm(
      initialFilterForm,
    );

    setAppliedQuery(
      initialQuery,
    );
  }

  function changePage(
    nextPage: number,
  ): void {
    if (
      nextPage < 1 ||
      (
        pagination.totalPages > 0 &&
        nextPage >
          pagination.totalPages
      )
    ) {
      return;
    }

    setAppliedQuery(
      (currentQuery) => ({
        ...currentQuery,
        page: nextPage,
      }),
    );
  }

  function retryRequest(): void {
    setAppliedQuery(
      (currentQuery) => ({
        ...currentQuery,
      }),
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 font-bold text-blue-600 transition hover:text-blue-800"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Transparent analytics
              </p>

              <h1 className="mt-2 text-4xl font-black text-slate-900 md:text-5xl">
                AI Performance Center
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                Review, filter and inspect every
                MarketPilot recommendation through the
                typed recommendation API.
              </p>
            </div>

            <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-700">
              Demonstration records
            </span>
          </div>
        </header>

        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                Verification engine
              </p>

              <h2 className="mt-2 text-2xl font-bold text-blue-950">
                Automatic Recommendation Evaluation
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-6 text-blue-800">
                MarketPilot retains successful,
                unsuccessful and pending records so that
                performance remains transparent.
              </p>
            </div>

            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm">
              API connected
            </span>
          </div>
        </section>

        <form
          onSubmit={applyFilters}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                Advanced filters
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Explore Recommendation Results
              </h2>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
            >
              Reset filters
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              id="recommendation-category"
              label="Category"
              value={filterForm.category}
              onChange={(value) =>
                updateFilter(
                  "category",
                  value as
                    | ""
                    | RecommendationCategory,
                )
              }
            >
              <option value="">
                All categories
              </option>
              <option value="Crypto">
                Crypto
              </option>
              <option value="Stock">
                Stock
              </option>
              <option value="ETF">
                ETF
              </option>
            </FilterSelect>

            <FilterSelect
              id="recommendation-status"
              label="Status"
              value={filterForm.status}
              onChange={(value) =>
                updateFilter(
                  "status",
                  value as
                    | ""
                    | RecommendationStatus,
                )
              }
            >
              <option value="">
                All statuses
              </option>
              <option value="Successful">
                Successful
              </option>
              <option value="Unsuccessful">
                Unsuccessful
              </option>
              <option value="Pending">
                Pending
              </option>
            </FilterSelect>

            <FilterInput
              id="recommendation-symbol"
              label="Symbol"
              type="search"
              value={filterForm.symbol}
              placeholder="BTC, NVDA, SPY..."
              onChange={(value) =>
                updateFilter(
                  "symbol",
                  value,
                )
              }
            />

            <FilterSelect
              id="recommendation-page-size"
              label="Results per page"
              value={filterForm.pageSize}
              onChange={(value) =>
                updateFilter(
                  "pageSize",
                  value,
                )
              }
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </FilterSelect>

            <FilterInput
              id="recommendation-min-score"
              label="Minimum score"
              type="number"
              value={filterForm.minScore}
              placeholder="0–100"
              min="0"
              max="100"
              onChange={(value) =>
                updateFilter(
                  "minScore",
                  value,
                )
              }
            />

            <FilterInput
              id="recommendation-min-confidence"
              label="Minimum confidence"
              type="number"
              value={filterForm.minConfidence}
              placeholder="0–100"
              min="0"
              max="100"
              onChange={(value) =>
                updateFilter(
                  "minConfidence",
                  value,
                )
              }
            />

            <FilterInput
              id="recommendation-published-after"
              label="Published after"
              type="date"
              value={
                filterForm.publishedAfter
              }
              onChange={(value) =>
                updateFilter(
                  "publishedAfter",
                  value,
                )
              }
            />

            <FilterInput
              id="recommendation-published-before"
              label="Published before"
              type="date"
              value={
                filterForm.publishedBefore
              }
              onChange={(value) =>
                updateFilter(
                  "publishedBefore",
                  value,
                )
              }
            />

            <FilterSelect
              id="recommendation-sort-field"
              label="Sort by"
              value={filterForm.sortBy}
              onChange={(value) =>
                updateFilter(
                  "sortBy",
                  value as
                    RecommendationSortField,
                )
              }
            >
              <option value="publishedAt">
                Publication date
              </option>
              <option value="score">
                AI score
              </option>
              <option value="confidence">
                Confidence
              </option>
            </FilterSelect>

            <FilterSelect
              id="recommendation-sort-order"
              label="Sort direction"
              value={filterForm.sortOrder}
              onChange={(value) =>
                updateFilter(
                  "sortOrder",
                  value as
                    RecommendationSortOrder,
                )
              }
            >
              <option value="desc">
                Descending
              </option>
              <option value="asc">
                Ascending
              </option>
            </FilterSelect>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
            <p className="text-sm text-slate-500">
              Filters are applied through the typed
              recommendation API.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? "Loading..."
                : "Apply filters"}
            </button>
          </div>
        </form>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Matching records"
            value={String(
              pagination.totalItems,
            )}
            description={`${recommendationRecords.length} displayed on this page`}
          />

          <MetricCard
            label="Page success rate"
            value={`${metrics.successRate.toFixed(
              1,
            )}%`}
            description={`${metrics.successful} successful on this page`}
          />

          <MetricCard
            label="Page average return"
            value={formatReturn(
              metrics.averageReturn,
            )}
            description="Verified page results included"
          />

          <MetricCard
            label="Pending on page"
            value={String(metrics.pending)}
            description="Awaiting evaluation price"
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Verification Ledger
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select any record to open its complete
                recommendation audit trail.
              </p>
            </div>

            <p className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              Page {pagination.page}
              {pagination.totalPages > 0
                ? ` of ${pagination.totalPages}`
                : ""}
            </p>
          </div>

          {errorMessage ? (
            <ErrorState
              message={errorMessage}
              onRetry={retryRequest}
            />
          ) : isLoading ? (
            <LoadingState />
          ) : recommendationRecords.length >
            0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <TableHeading>
                        Record
                      </TableHeading>
                      <TableHeading>
                        Asset
                      </TableHeading>
                      <TableHeading>
                        Published
                      </TableHeading>
                      <TableHeading>
                        Deadline
                      </TableHeading>
                      <TableHeading>
                        Entry price
                      </TableHeading>
                      <TableHeading>
                        Target price
                      </TableHeading>
                      <TableHeading>
                        Evaluation price
                      </TableHeading>
                      <TableHeading>
                        Actual return
                      </TableHeading>
                      <TableHeading>
                        Status
                      </TableHeading>
                      <TableHeading>
                        Audit trail
                      </TableHeading>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {recommendationRecords.map(
                      (record) => (
                        <RecommendationRow
                          key={record.id}
                          record={record}
                        />
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                pagination={pagination}
                isLoading={isLoading}
                onPageChange={changePage}
              />
            </>
          ) : (
            <EmptyState
              onReset={resetFilters}
            />
          )}

          <div className="border-t border-slate-200 bg-blue-50 px-6 py-4">
            <p className="text-xs leading-5 text-blue-700">
              These records currently use demonstration
              prices. Production records will use
              database-backed market data and permanent
              timestamps.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function buildRecommendationQuery(
  form: FilterFormState,
  page: number,
): RecommendationApiFilters {
  return {
    category:
      form.category || undefined,
    symbol:
      form.symbol.trim() ||
      undefined,
    status:
      form.status || undefined,
    minScore:
      parseOptionalNumber(
        form.minScore,
      ),
    minConfidence:
      parseOptionalNumber(
        form.minConfidence,
      ),
    publishedAfter:
      form.publishedAfter ||
      undefined,
    publishedBefore:
      form.publishedBefore ||
      undefined,
    sortBy: form.sortBy,
    sortOrder: form.sortOrder,
    page,
    pageSize:
      Number(form.pageSize),
  };
}

function parseOptionalNumber(
  value: string,
): number | undefined {
  const normalizedValue =
    value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  return Number(
    normalizedValue,
  );
}

type FilterInputProps = {
  id: string;
  label: string;
  type: "search" | "number" | "date";
  value: string;
  placeholder?: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
};

function FilterInput({
  id,
  label,
  type,
  value,
  placeholder,
  min,
  max,
  onChange,
}: FilterInputProps) {
  return (
    <label
      htmlFor={id}
      className="block"
    >
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  children: React.ReactNode;
  onChange: (value: string) => void;
};

function FilterSelect({
  id,
  label,
  value,
  children,
  onChange,
}: FilterSelectProps) {
  return (
    <label
      htmlFor={id}
      className="block"
    >
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
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

type RecommendationRowProps = {
  record: RecommendationRecord;
};

function RecommendationRow({
  record,
}: RecommendationRowProps) {
  return (
    <tr className="transition hover:bg-slate-50">
      <TableCell>
        <p className="font-bold text-blue-600">
          {record.id}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Score {record.score}/100
        </p>
      </TableCell>

      <TableCell>
        <p className="font-bold text-slate-900">
          {record.asset}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {record.symbol} · {record.category}
        </p>
      </TableCell>

      <TableCell>
        {formatDate(
          record.publishedAt,
        )}
      </TableCell>

      <TableCell>
        {formatDate(
          record.evaluationDate,
        )}
      </TableCell>

      <TableCell>
        {formatPrice(
          record.entryPrice,
        )}
      </TableCell>

      <TableCell>
        {formatPrice(
          record.targetPrice,
        )}
      </TableCell>

      <TableCell>
        {record.evaluationPrice === null
          ? "Not available"
          : formatPrice(
              record.evaluationPrice,
            )}
      </TableCell>

      <TableCell>
        {record.actualReturn === null ? (
          <span className="text-slate-400">
            Pending
          </span>
        ) : (
          <span
            className={
              record.actualReturn >= 0
                ? "font-bold text-emerald-600"
                : "font-bold text-red-600"
            }
          >
            {formatReturn(
              record.actualReturn,
            )}
          </span>
        )}
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

      <TableCell>
        <Link
          href={`/performance/${record.id}`}
          className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-600"
        >
          Open record →
        </Link>
      </TableCell>
    </tr>
  );
}

type PaginationControlsProps = {
  pagination: RecommendationApiPagination;
  isLoading: boolean;
  onPageChange: (
    page: number,
  ) => void;
};

function PaginationControls({
  pagination,
  isLoading,
  onPageChange,
}: PaginationControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-6 py-5">
      <p className="text-sm text-slate-500">
        Showing page {pagination.page} of{" "}
        {pagination.totalPages}.
        {" "}
        {pagination.totalItems} matching records.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={
            isLoading ||
            !pagination.hasPreviousPage
          }
          onClick={() =>
            onPageChange(
              pagination.page - 1,
            )
          }
          className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={
            isLoading ||
            !pagination.hasNextPage
          }
          onClick={() =>
            onPageChange(
              pagination.page + 1,
            )
          }
          className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="px-6 py-20 text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

      <p className="mt-4 font-bold text-slate-900">
        Loading recommendations
      </p>

      <p className="mt-2 text-sm text-slate-500">
        Applying the selected query filters.
      </p>
    </div>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function ErrorState({
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-xl font-bold text-red-700">
        Unable to load recommendations
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}

type EmptyStateProps = {
  onReset: () => void;
};

function EmptyState({
  onReset,
}: EmptyStateProps) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-xl font-bold text-slate-900">
        No matching recommendations
      </p>

      <p className="mt-2 text-sm text-slate-500">
        Change or reset the selected filters.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
      >
        Show all records
      </button>
    </div>
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
  if (value >= 1_000) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(value);
  }

  if (value >= 1) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      },
    ).format(value);
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 8,
    },
  ).format(value);
}

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(
      `${value}T00:00:00`,
    ),
  );
}
