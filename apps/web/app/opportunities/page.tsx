import OpportunityGrid from "@/components/dashboard/OpportunityGrid";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import type {
  LiveCryptoOpportunity,
} from "@/data/getLiveCryptoOpportunities";
import {
  getTopCryptoOpportunities,
} from "@/lib/services/cryptoOpportunityService";

type LiveCryptoOpportunityWithPrice =
  LiveCryptoOpportunity & {
    currentPriceUsd: number;
  };

const CRYPTO_OPPORTUNITY_LIMIT = 100;

export default async function OpportunitiesPage() {
  const liveCryptoOpportunities =
    await getTopCryptoOpportunities(
      CRYPTO_OPPORTUNITY_LIMIT,
    );

  const liveCryptoData =
    Object.fromEntries(
      liveCryptoOpportunities
        .filter(hasCurrentPrice)
        .map((opportunity) => [
          opportunity.symbol,
          {
            currentPrice:
              formatCurrentPrice(
                opportunity.currentPriceUsd,
              ),
            change24h:
              formatPriceChange(
                opportunity.priceChange24h,
              ),
          },
        ]),
    );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6">
        <Navbar />

        <div className="py-12">
          <div className="mb-10">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              MarketPilot AI
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              Top Market Opportunities
            </h1>

            <p className="mt-4 max-w-3xl text-slate-500">
              Explore up to 100 dynamically ranked
              cryptocurrency opportunities alongside
              selected stock and ETF opportunities using
              MarketPilot&apos;s scoring engine.
            </p>
          </div>

          <OpportunityGrid
            cryptoOpportunities={
              liveCryptoOpportunities
            }
            liveCryptoData={
              liveCryptoData
            }
          />
        </div>

        <Footer />
      </div>
    </main>
  );
}

function hasCurrentPrice(
  opportunity: LiveCryptoOpportunity,
): opportunity is LiveCryptoOpportunityWithPrice {
  return (
    opportunity.currentPriceUsd !==
    null
  );
}

function formatCurrentPrice(
  price: number,
): string {
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
  change:
    | number
    | null
    | undefined,
): string {
  if (change == null) {
    return "";
  }

  const sign =
    change > 0 ? "+" : "";

  return `${sign}${change.toFixed(
    2,
  )}%`;
}