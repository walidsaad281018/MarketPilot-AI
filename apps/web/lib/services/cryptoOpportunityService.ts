import {
  getDynamicCryptoOpportunities,
} from "@/data/getDynamicCryptoOpportunities";

import type {
  LiveCryptoOpportunity,
} from "@/data/getLiveCryptoOpportunities";

export type CryptoOpportunityServiceOptions = {
  limit?: number;
};

const DEFAULT_LIMIT = 20;
const MAXIMUM_LIMIT = 250;
const STANDARD_DISCOVERY_LIMIT = 200;
const EXTENDED_DISCOVERY_LIMIT = 250;

export async function getCryptoOpportunities(
  options: CryptoOpportunityServiceOptions = {},
): Promise<LiveCryptoOpportunity[]> {
  const limit =
    options.limit ??
    DEFAULT_LIMIT;

  validateLimit(limit);

  const discoveryLimit =
    getDiscoveryLimit(limit);

  return getDynamicCryptoOpportunities({
    discoveryLimit,
    resultLimit: limit,
  });
}

export async function getFeaturedCryptoOpportunity(): Promise<LiveCryptoOpportunity | null> {
  const opportunities =
    await getCryptoOpportunities({
      limit: 1,
    });

  return opportunities[0] ?? null;
}

export async function getTopCryptoOpportunities(
  limit = DEFAULT_LIMIT,
): Promise<LiveCryptoOpportunity[]> {
  return getCryptoOpportunities({
    limit,
  });
}

function getDiscoveryLimit(
  resultLimit: number,
): number {
  if (resultLimit > 20) {
    return EXTENDED_DISCOVERY_LIMIT;
  }

  return STANDARD_DISCOVERY_LIMIT;
}

function validateLimit(
  limit: number,
): void {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAXIMUM_LIMIT
  ) {
    throw new Error(
      `Crypto opportunity limit must be an integer between 1 and ${MAXIMUM_LIMIT}.`,
    );
  }
}