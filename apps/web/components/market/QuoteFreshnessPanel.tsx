import type {
  QuoteFreshness,
  QuoteFreshnessStatus,
} from "@/lib/market-data/types";

type QuoteFreshnessPanelProps = {
  freshness?: QuoteFreshness | null;
  providerUpdatedAt: string | null;
  fetchedAt: string;
};

type StatusStyle = {
  badge: string;
  panel: string;
  title: string;
  description: string;
  icon: string;
};

const statusStyles: Record<
  QuoteFreshnessStatus,
  StatusStyle
> = {
  Fresh: {
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700",
    panel:
      "border-emerald-200 bg-emerald-50",
    title: "text-emerald-900",
    description: "text-emerald-700",
    icon: "●",
  },

  Delayed: {
    badge:
      "border-amber-200 bg-amber-100 text-amber-700",
    panel:
      "border-amber-200 bg-amber-50",
    title: "text-amber-900",
    description: "text-amber-700",
    icon: "◷",
  },

  Stale: {
    badge:
      "border-red-200 bg-red-100 text-red-700",
    panel:
      "border-red-200 bg-red-50",
    title: "text-red-900",
    description: "text-red-700",
    icon: "!",
  },

  Unknown: {
    badge:
      "border-slate-200 bg-slate-100 text-slate-600",
    panel:
      "border-slate-200 bg-slate-50",
    title: "text-slate-900",
    description: "text-slate-600",
    icon: "?",
  },
};

const unknownFreshness: QuoteFreshness = {
  status: "Unknown",
  ageSeconds: null,
};

export default function QuoteFreshnessPanel({
  freshness,
  providerUpdatedAt,
  fetchedAt,
}: QuoteFreshnessPanelProps) {
  const safeFreshness =
    normalizeFreshness(freshness);

  const styles =
    statusStyles[safeFreshness.status];

  return (
    <section
      className={`rounded-2xl border p-5 ${styles.panel}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Quote freshness
          </p>

          <h3
            className={`mt-2 text-lg font-bold ${styles.title}`}
          >
            Market-data freshness check
          </h3>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${styles.badge}`}
        >
          <span>{styles.icon}</span>

          {safeFreshness.status}
        </span>
      </div>

      <p
        className={`mt-4 text-sm leading-6 ${styles.description}`}
      >
        {getFreshnessDescription(
          safeFreshness.status,
        )}
      </p>

      <dl className="mt-5 space-y-3 rounded-xl bg-white/80 p-4 text-sm">
        <DetailRow
          label="Provider updated"
          value={
            providerUpdatedAt
              ? formatDateTime(providerUpdatedAt)
              : "Not supplied"
          }
        />

        <DetailRow
          label="MarketPilot fetched"
          value={formatDateTime(fetchedAt)}
        />

        <DetailRow
          label="Quote age"
          value={formatQuoteAge(
            safeFreshness.ageSeconds,
          )}
        />
      </dl>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Provider update time indicates when the
        external provider last refreshed the price.
        MarketPilot fetch time indicates when the
        application received the response.
      </p>
    </section>
  );
}

function normalizeFreshness(
  freshness?: QuoteFreshness | null,
): QuoteFreshness {
  if (!freshness) {
    return unknownFreshness;
  }

  if (
    !isFreshnessStatus(freshness.status)
  ) {
    return unknownFreshness;
  }

  const ageSeconds =
    typeof freshness.ageSeconds === "number" &&
    Number.isFinite(freshness.ageSeconds) &&
    freshness.ageSeconds >= 0
      ? freshness.ageSeconds
      : null;

  return {
    status: freshness.status,
    ageSeconds,
  };
}

function isFreshnessStatus(
  value: unknown,
): value is QuoteFreshnessStatus {
  return (
    value === "Fresh" ||
    value === "Delayed" ||
    value === "Stale" ||
    value === "Unknown"
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

      <dd className="text-right font-bold text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function getFreshnessDescription(
  status: QuoteFreshnessStatus,
): string {
  switch (status) {
    case "Fresh":
      return "The provider price was updated recently and is suitable for the live verification preview.";

    case "Delayed":
      return "The provider price is slightly delayed. It can still be displayed, but users should consider the quote age.";

    case "Stale":
      return "The provider price is old and should not be treated as a current market value.";

    case "Unknown":
      return "The provider did not supply a valid update timestamp, so MarketPilot cannot determine the quote age.";
  }
}

function formatQuoteAge(
  ageSeconds: number | null,
): string {
  if (ageSeconds === null) {
    return "Unknown";
  }

  if (ageSeconds < 60) {
    return `${ageSeconds} second${
      ageSeconds === 1 ? "" : "s"
    }`;
  }

  const totalMinutes = Math.floor(
    ageSeconds / 60,
  );

  if (totalMinutes < 60) {
    return `${totalMinutes} minute${
      totalMinutes === 1 ? "" : "s"
    }`;
  }

  const hours = Math.floor(
    totalMinutes / 60,
  );

  const remainingMinutes =
    totalMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    }`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatDateTime(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid timestamp";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}