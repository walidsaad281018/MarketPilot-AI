import {
  cryptoOpportunities,
  etfOpportunities,
  stockOpportunities,
  type Opportunity,
} from "@/data/opportunities";

const allOpportunities: Opportunity[] = [
  ...cryptoOpportunities,
  ...stockOpportunities,
  ...etfOpportunities,
];

export function getOpportunityBySymbol(
  symbol: string,
): Opportunity | undefined {
  const normalizedSymbol = symbol
    .trim()
    .toUpperCase();

  return allOpportunities.find(
    (opportunity) =>
      opportunity.symbol.toUpperCase() ===
      normalizedSymbol,
  );
}