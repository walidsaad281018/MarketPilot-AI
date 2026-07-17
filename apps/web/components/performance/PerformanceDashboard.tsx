"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  recommendationRecords,
  type RecommendationCategory,
  type RecommendationRecord,
  type RecommendationStatus,
} from "@/data/recommendations";

type CategoryFilter =
  | "All"
  | RecommendationCategory;

type StatusFilter =
  | "All"
  | RecommendationStatus;

const categoryOptions: CategoryFilter[] = [
  "All",
  "Crypto",
  "Stock",
  "ETF",
];

const statusOptions: StatusFilter[] = [
  "All",
  "Successful",
  "Unsuccessful",
  "Pending",
];

const statusStyles: Record<
  RecommendationStatus,
  string
> = {
  Successful:
    "bg-emerald-100 text-emerald-700",
  Unsuccessful: "bg-red-100 text-red-700",
  Pending: "bg-amber-100 text-amber-700",
};

export default function PerformanceDashboard() {
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("All");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const filteredRecords = useMemo(() => {
    return [...recommendationRecords]
      .filter((record) => {
        const matchesCategory =
          categoryFilter === "All" ||
          record.category === categoryFilter;

        const matchesStatus =
          statusFilter === "All" ||
          record.status === statusFilter;

        return matchesCategory && matchesStatus;
      })
      .sort(
        (firstRecord, secondRecord) =>
          new Date(
            secondRecord.publishedAt,
          ).getTime() -
          new Date(
            firstRecord.publishedAt,
          ).getTime(),
      );
  }, [categoryFilter, statusFilter]);

  const metrics = useMemo(
    () => calculateMetrics(filteredRecords),
    [filteredRecords],
  );

  function resetFilters() {
    setCategoryFilter("All");
    setStatusFilter("All");
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
                Review how every recommendation was
                created, evaluated and automatically
                classified by the MarketPilot
                verification engine.
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
                MarketPilot calculates the target
                price and actual return from the
                stored entry and evaluation prices.
                The result is then classified
                automatically as successful,
                unsuccessful or pending.
              </p>
            </div>

            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm">
              Engine active
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <RuleCard
              number="01"
              title="Calculate target"
              description="Target price is calculated from the entry price and target-return percentage."
            />

            <RuleCard
              number="02"
              title="Calculate outcome"
              description="Actual return is calculated from the entry price and final evaluation price."
            />

            <RuleCard
              number="03"
              title="Assign status"
              description="The engine compares actual return with the original target and assigns the result."
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                Filters
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

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <FilterGroup
              label="Investment category"
              options={categoryOptions}
              selectedValue={categoryFilter}
              onSelect={(value) =>
                setCategoryFilter(
                  value as CategoryFilter,
                )
              }
            />

            <FilterGroup
              label="Verification status"
              options={statusOptions}
              selectedValue={statusFilter}
              onSelect={(value) =>
                setStatusFilter(
                  value as StatusFilter,
                )
              }
            />
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Displayed records"
            value={String(metrics.total)}
            description={`${metrics.verified} verified records`}
          />

          <MetricCard
            label="Success rate"
            value={`${metrics.successRate.toFixed(
              1,
            )}%`}
            description={`${metrics.successful} successful`}
          />

          <MetricCard
            label="Average return"
            value={formatReturn(
              metrics.averageReturn,
            )}
            description="All verified results included"
          />

          <MetricCard
            label="Pending"
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
                Detailed calculations from newest
                recommendation to oldest.
              </p>
            </div>

            <p className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              {filteredRecords.length} result
              {filteredRecords.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          {filteredRecords.length > 0 ? (
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
                      Target
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
                      Target reached
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Analysis
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.map(
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
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-xl font-bold text-slate-900">
                No matching recommendations
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Change or reset the selected filters.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                Show all records
              </button>
            </div>
          )}

          <div className="border-t border-slate-200 bg-blue-50 px-6 py-4">
            <p className="text-xs leading-5 text-blue-700">
              These records currently use
              demonstration market prices. In
              production, entry and evaluation prices
              will be captured from market-data
              providers and stored with permanent
              timestamps.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

type RuleCardProps = {
  number: string;
  title: string;
  description: string;
};

function RuleCard({
  number,
  title,
  description,
}: RuleCardProps) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-black text-blue-600">
        {number}
      </p>

      <h3 className="mt-2 font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  );
}

type FilterGroupProps = {
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
};

function FilterGroup({
  label,
  options,
  selectedValue,
  onSelect,
}: FilterGroupProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected =
            selectedValue === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={
                isSelected
                  ? "rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm"
                  : "rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
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
        {formatDate(record.publishedAt)}
      </TableCell>

      <TableCell>
        {formatDate(record.evaluationDate)}
      </TableCell>

      <TableCell>
        {formatPrice(record.entryPrice)}
      </TableCell>

      <TableCell>
        <span className="font-bold text-blue-700">
          +{record.targetReturn.toFixed(1)}%
        </span>
      </TableCell>

      <TableCell>
        {formatPrice(record.targetPrice)}
      </TableCell>

      <TableCell>
        {record.evaluationPrice === null ? (
          <span className="text-slate-400">
            Not available
          </span>
        ) : (
          formatPrice(record.evaluationPrice)
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
            {formatReturn(record.actualReturn)}
          </span>
        )}
      </TableCell>

      <TableCell>
        <TargetReachedBadge
          targetReached={record.targetReached}
        />
      </TableCell>

      <TableCell>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
            statusStyles[record.status]
          }`}
        >
          {record.status}
        </span>
      </TableCell>

      <TableCell>
        <Link
          href={`/analysis/${record.symbol}`}
          className="font-bold text-blue-600 transition hover:text-blue-800"
        >
          View →
        </Link>
      </TableCell>
    </tr>
  );
}

type TargetReachedBadgeProps = {
  targetReached: boolean | null;
};

function TargetReachedBadge({
  targetReached,
}: TargetReachedBadgeProps) {
  if (targetReached === null) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
        Pending
      </span>
    );
  }

  if (targetReached) {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
        ✓ Yes
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
      ✕ No
    </span>
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

function calculateMetrics(
  records: RecommendationRecord[],
) {
  const successful = records.filter(
    (record) => record.status === "Successful",
  );

  const unsuccessful = records.filter(
    (record) =>
      record.status === "Unsuccessful",
  );

  const pending = records.filter(
    (record) => record.status === "Pending",
  );

  const verified = records.filter(
    (record) => record.status !== "Pending",
  );

  const verifiedReturns = verified
    .map((record) => record.actualReturn)
    .filter(
      (value): value is number =>
        typeof value === "number",
    );

  const successRate =
    verified.length > 0
      ? (successful.length / verified.length) *
        100
      : 0;

  const averageReturn =
    verifiedReturns.length > 0
      ? verifiedReturns.reduce(
          (total, value) => total + value,
          0,
        ) / verifiedReturns.length
      : 0;

  return {
    total: records.length,
    successful: successful.length,
    unsuccessful: unsuccessful.length,
    pending: pending.length,
    verified: verified.length,
    successRate,
    averageReturn,
  };
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