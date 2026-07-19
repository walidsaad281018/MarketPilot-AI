import type {
  QuoteFreshness,
  QuoteFreshnessStatus,
} from "@/lib/market-data/types";

const FRESH_LIMIT_SECONDS = 120;
const DELAYED_LIMIT_SECONDS = 600;

export function calculateQuoteFreshness(
  providerUpdatedAt: string | null,
  referenceTime = new Date(),
): QuoteFreshness {
  if (!providerUpdatedAt) {
    return {
      status: "Unknown",
      ageSeconds: null,
    };
  }

  const providerTimestamp =
    new Date(providerUpdatedAt).getTime();

  if (
    !Number.isFinite(
      providerTimestamp,
    )
  ) {
    return {
      status: "Unknown",
      ageSeconds: null,
    };
  }

  const ageMilliseconds =
    referenceTime.getTime() -
    providerTimestamp;

  const ageSeconds = Math.max(
    0,
    Math.floor(
      ageMilliseconds / 1_000,
    ),
  );

  return {
    status:
      determineFreshnessStatus(
        ageSeconds,
      ),
    ageSeconds,
  };
}

function determineFreshnessStatus(
  ageSeconds: number,
): QuoteFreshnessStatus {
  if (
    ageSeconds <
    FRESH_LIMIT_SECONDS
  ) {
    return "Fresh";
  }

  if (
    ageSeconds <
    DELAYED_LIMIT_SECONDS
  ) {
    return "Delayed";
  }

  return "Stale";
}