import type {
  LiveCryptoOpportunity,
} from "@/data/getLiveCryptoOpportunities";
import {
  etfOpportunities,
  stockOpportunities,
  type Opportunity,
} from "@/data/opportunities";
import {
  getTopCryptoOpportunities,
} from "@/lib/services/cryptoOpportunityService";

export type ResolvedOpportunity =
  Opportunity & {
    currentPriceUsd?: number | null;
  };

const CRYPTO_LOOKUP_LIMIT = 100;

export async function getOpportunityBySymbol(
  symbol: string,
): Promise<ResolvedOpportunity | null> {
  const normalizedSymbol =
    normalizeSymbol(symbol);

  if (normalizedSymbol.length === 0) {
    return null;
  }

  const cryptoOpportunity =
    await findCryptoOpportunity(
      normalizedSymbol,
    );

  if (cryptoOpportunity) {
    return cryptoOpportunity;
  }

  const stockOpportunity =
    findStaticOpportunity(
      stockOpportunities,
      normalizedSymbol,
    );

  if (stockOpportunity) {
    return stockOpportunity;
  }

  const etfOpportunity =
    findStaticOpportunity(
      etfOpportunities,
      normalizedSymbol,
    );

  return etfOpportunity;
}

async function findCryptoOpportunity(
  symbol: string,
): Promise<LiveCryptoOpportunity | null> {
  const cryptoOpportunities =
    await getTopCryptoOpportunities(
      CRYPTO_LOOKUP_LIMIT,
    );

  return (
    cryptoOpportunities.find(
      (opportunity) =>
        normalizeSymbol(
          opportunity.symbol,
        ) === symbol,
    ) ?? null
  );
}

function findStaticOpportunity(
  opportunities: Opportunity[],
  symbol: string,
): Opportunity | null {
  return (
    opportunities.find(
      (opportunity) =>
        normalizeSymbol(
          opportunity.symbol,
        ) === symbol,
    ) ?? null
  );
}

function normalizeSymbol(
  symbol: string,
): string {
  return decodeURIComponent(symbol)
    .trim()
    .toUpperCase();
}