import DashboardClient from "@/components/dashboard/DashboardClient";
import type { LiveCryptoOpportunity } from "@/data/getLiveCryptoOpportunities";
import { getTopCryptoOpportunities } from "@/lib/services/cryptoOpportunityService";
import { recommendationHistoryService } from "@/lib/services/recommendationHistoryService";
import {
  calculateAllCategoryPerformance,
  calculateRecommendationPerformance,
} from "@/lib/services/recommendationPerformanceService";

type LiveCryptoData = Record<
  string,
  {
    currentPrice: string;
    change24h: string;
  }
>;

type LiveCryptoOpportunityWithPrice =
  LiveCryptoOpportunity & {
    currentPriceUsd: number;
  };

const CRYPTO_OPPORTUNITY_LIMIT = 100;

export default async function DashboardPage() {
  const [
    liveCryptoOpportunities,
    recommendationRecords,
  ] = await Promise.all([
    getTopCryptoOpportunities(
      CRYPTO_OPPORTUNITY_LIMIT,
    ),
    recommendationHistoryService
      .getAllRecommendations(),
  ]);

  const performanceMetrics =
    calculateRecommendationPerformance(
      recommendationRecords,
    );

  const categoryPerformance =
    calculateAllCategoryPerformance(
      recommendationRecords,
    );

  const liveCryptoData: LiveCryptoData =
    Object.fromEntries(
      liveCryptoOpportunities
        .filter(hasCurrentPrice)
        .map((opportunity) => [
          opportunity.symbol,
          {
            currentPrice: formatCurrentPrice(
              opportunity.currentPriceUsd,
            ),
            change24h: formatPriceChange(
              opportunity.priceChange24h,
            ),
          },
        ]),
    );

  const marketDataAvailable =
    liveCryptoOpportunities.some(
      hasCurrentPrice,
    );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <DashboardClient
          liveCryptoData={liveCryptoData}
          cryptoOpportunities={
            liveCryptoOpportunities
          }
          marketDataAvailable={
            marketDataAvailable
          }
          recommendationRecords={
            recommendationRecords
          }
          performanceMetrics={
            performanceMetrics
          }
          categoryPerformance={
            categoryPerformance
          }
        />
      </div>
    </main>
  );
}

function hasCurrentPrice(
  opportunity: LiveCryptoOpportunity,
): opportunity is LiveCryptoOpportunityWithPrice {
  return opportunity.currentPriceUsd !== null;
}

function formatCurrentPrice(
  price: number,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits:
      price >= 1 ? 2 : 4,
    maximumFractionDigits:
      price >= 1 ? 2 : 8,
  }).format(price);
}

function formatPriceChange(
  change: number | null | undefined,
): string {
  if (change == null) {
    return "";
  }

  const sign = change > 0 ? "+" : "";

  return `${sign}${change.toFixed(2)}%`;
}
