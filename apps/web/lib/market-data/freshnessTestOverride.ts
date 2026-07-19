import type {
  MarketQuote,
  QuoteFreshness,
  QuoteFreshnessStatus,
} from "@/lib/market-data/types";

const supportedStatuses:
  QuoteFreshnessStatus[] = [
    "Fresh",
    "Delayed",
    "Stale",
    "Unknown",
  ];

const simulatedAgeSeconds: Record<
  QuoteFreshnessStatus,
  number | null
> = {
  Fresh: 30,
  Delayed: 5 * 60,
  Stale: 15 * 60,
  Unknown: null,
};

export function applyFreshnessTestOverride(
  quote: MarketQuote,
  requestedStatus?: string | null,
): MarketQuote {
  if (
    process.env.NODE_ENV !== "development"
  ) {
    return quote;
  }

  const status =
    parseFreshnessStatus(requestedStatus);

  if (!status) {
    return quote;
  }

  const freshness: QuoteFreshness = {
    status,
    ageSeconds:
      simulatedAgeSeconds[status],
  };

  return {
    ...quote,
    freshness,
    providerUpdatedAt:
      createSimulatedProviderTimestamp(
        quote.fetchedAt,
        freshness,
      ),
  };
}

export function parseFreshnessStatus(
  value?: string | null,
): QuoteFreshnessStatus | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value
    .trim()
    .toLowerCase();

  const matchedStatus =
    supportedStatuses.find(
      (status) =>
        status.toLowerCase() ===
        normalizedValue,
    );

  return matchedStatus ?? null;
}

function createSimulatedProviderTimestamp(
  fetchedAt: string,
  freshness: QuoteFreshness,
): string | null {
  if (
    freshness.status === "Unknown" ||
    freshness.ageSeconds === null
  ) {
    return null;
  }

  const fetchedTimestamp =
    new Date(fetchedAt).getTime();

  if (!Number.isFinite(fetchedTimestamp)) {
    return null;
  }

  return new Date(
    fetchedTimestamp -
      freshness.ageSeconds * 1_000,
  ).toISOString();
}