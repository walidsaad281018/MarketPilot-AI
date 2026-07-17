import {
  verifyRecommendation,
  type VerificationStatus,
} from "@/lib/recommendationVerification";

export type RecommendationStatus =
  VerificationStatus;

export type RecommendationCategory =
  | "Crypto"
  | "Stock"
  | "ETF";

export type RecommendationSourceRecord = {
  id: string;
  asset: string;
  symbol: string;
  category: RecommendationCategory;
  publishedAt: string;
  evaluationDate: string;
  entryPrice: number;
  evaluationPrice: number | null;
  targetReturn: number;
  score: number;
  confidence: number;
};

export type RecommendationRecord =
  RecommendationSourceRecord & {
    targetPrice: number;
    actualReturn: number | null;
    status: RecommendationStatus;
    targetReached: boolean | null;
  };

const recommendationSourceRecords: RecommendationSourceRecord[] =
  [
    {
      id: "MP-DEMO-0001",
      asset: "Bitcoin",
      symbol: "BTC",
      category: "Crypto",
      publishedAt: "2026-07-01",
      evaluationDate: "2026-07-08",
      entryPrice: 61_200,
      evaluationPrice: 66_340.8,
      targetReturn: 6,
      score: 94,
      confidence: 91,
    },
    {
      id: "MP-DEMO-0002",
      asset: "NVIDIA",
      symbol: "NVDA",
      category: "Stock",
      publishedAt: "2026-07-02",
      evaluationDate: "2026-07-09",
      entryPrice: 153.8,
      evaluationPrice: 163.34,
      targetReturn: 5,
      score: 92,
      confidence: 89,
    },
    {
      id: "MP-DEMO-0003",
      asset: "Solana",
      symbol: "SOL",
      category: "Crypto",
      publishedAt: "2026-07-03",
      evaluationDate: "2026-07-10",
      entryPrice: 72.4,
      evaluationPrice: 70.16,
      targetReturn: 8,
      score: 88,
      confidence: 84,
    },
    {
      id: "MP-DEMO-0004",
      asset: "Vanguard S&P 500 ETF",
      symbol: "VOO",
      category: "ETF",
      publishedAt: "2026-07-04",
      evaluationDate: "2026-07-11",
      entryPrice: 535.2,
      evaluationPrice: 555.54,
      targetReturn: 3,
      score: 89,
      confidence: 90,
    },
    {
      id: "MP-DEMO-0005",
      asset: "Ethereum",
      symbol: "ETH",
      category: "Crypto",
      publishedAt: "2026-07-05",
      evaluationDate: "2026-07-12",
      entryPrice: 1_790,
      evaluationPrice: 1_949.31,
      targetReturn: 7,
      score: 91,
      confidence: 88,
    },
    {
      id: "MP-DEMO-0006",
      asset: "Apple",
      symbol: "AAPL",
      category: "Stock",
      publishedAt: "2026-07-06",
      evaluationDate: "2026-07-13",
      entryPrice: 214.6,
      evaluationPrice: 210.95,
      targetReturn: 4,
      score: 84,
      confidence: 80,
    },
    {
      id: "MP-DEMO-0007",
      asset: "Chainlink",
      symbol: "LINK",
      category: "Crypto",
      publishedAt: "2026-07-15",
      evaluationDate: "2026-07-22",
      entryPrice: 13.4,
      evaluationPrice: null,
      targetReturn: 9,
      score: 87,
      confidence: 85,
    },
    {
      id: "MP-DEMO-0008",
      asset: "Invesco QQQ Trust",
      symbol: "QQQ",
      category: "ETF",
      publishedAt: "2026-07-16",
      evaluationDate: "2026-07-23",
      entryPrice: 561.3,
      evaluationPrice: null,
      targetReturn: 4,
      score: 86,
      confidence: 83,
    },
  ];

export const recommendationRecords: RecommendationRecord[] =
  recommendationSourceRecords.map(
    (record) => {
      const verification =
        verifyRecommendation({
          entryPrice: record.entryPrice,
          evaluationPrice:
            record.evaluationPrice,
          targetReturn:
            record.targetReturn,
        });

      return {
        ...record,
        ...verification,
      };
    },
  );