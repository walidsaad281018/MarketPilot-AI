import OpportunityCard from "@/components/cards/OpportunityCard";
import type {
  LiveCryptoOpportunity,
} from "@/data/getLiveCryptoOpportunities";
import {
  etfOpportunities,
  stockOpportunities,
  type Opportunity,
} from "@/data/opportunities";
import {
  getFeaturedCryptoOpportunity,
} from "@/lib/services/cryptoOpportunityService";

type FeaturedOpportunity =
  Opportunity & {
    currentPrice?: string;
    change24h?: string;
  };

export default async function TopOpportunities() {
  const featuredCryptoOpportunity =
    await getFeaturedCryptoOpportunity();

  const featuredOpportunities =
    selectFeaturedOpportunities(
      featuredCryptoOpportunity,
      stockOpportunities,
      etfOpportunities,
    );

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Featured opportunities
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            MarketPilot Top Picks
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Top-ranked opportunities selected across
            cryptocurrency, stocks and ETFs using
            MarketPilot&apos;s scoring engine.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredOpportunities.map(
            (opportunity) => (
              <OpportunityCard
                key={`${opportunity.category}-${opportunity.symbol}`}
                {...opportunity}
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function selectFeaturedOpportunities(
  cryptoOpportunity:
    | LiveCryptoOpportunity
    | null,
  stocks: Opportunity[],
  etfs: Opportunity[],
): FeaturedOpportunity[] {
  const topStock =
    getHighestScoringOpportunity(stocks);

  const topEtf =
    getHighestScoringOpportunity(etfs);

  const featuredOpportunities: FeaturedOpportunity[] =
    [];

  if (cryptoOpportunity) {
    featuredOpportunities.push({
      ...cryptoOpportunity,
      currentPrice:
        formatCurrentPrice(
          cryptoOpportunity.currentPriceUsd,
        ),
      change24h:
        formatPriceChange(
          cryptoOpportunity.currentPriceUsd,
          cryptoOpportunity.priceChange24h,
        ),
    });
  }

  if (topStock) {
    featuredOpportunities.push(
      topStock,
    );
  }

  if (topEtf) {
    featuredOpportunities.push(
      topEtf,
    );
  }

  return featuredOpportunities
    .sort(
      (first, second) =>
        second.score - first.score,
    )
    .map((opportunity, index) => ({
      ...opportunity,
      rank: index + 1,
    }));
}

function getHighestScoringOpportunity<
  T extends Opportunity,
>(
  opportunities: T[],
): T | null {
  if (opportunities.length === 0) {
    return null;
  }

  return opportunities.reduce(
    (highest, opportunity) =>
      opportunity.score > highest.score
        ? opportunity
        : highest,
  );
}

function formatCurrentPrice(
  price: number | null,
): string | undefined {
  if (price === null) {
    return undefined;
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits:
        price >= 1 ? 2 : 4,
      maximumFractionDigits:
        price >= 1 ? 2 : 8,
    },
  ).format(price);
}

function formatPriceChange(
  price: number | null,
  priceChange24h:
    | number
    | null
    | undefined,
): string | undefined {
  if (
    price === null ||
    priceChange24h == null
  ) {
    return undefined;
  }

  const sign =
    priceChange24h > 0 ? "+" : "";

  return `${sign}${priceChange24h.toFixed(
    2,
  )}%`;
}