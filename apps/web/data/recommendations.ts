export type RecommendationStatus =
  | "Successful"
  | "Unsuccessful"
  | "Pending";

export type RecommendationCategory =
  | "Crypto"
  | "Stock"
  | "ETF";

export type RecommendationRecord = {
  id: string;
  asset: string;
  symbol: string;
  category: RecommendationCategory;
  publishedAt: string;
  evaluationDate: string;
  entryPrice: number;
  targetReturn: number;
  actualReturn: number | null;
  score: number;
  confidence: number;
  status: RecommendationStatus;
};

export const recommendationRecords: RecommendationRecord[] = [
  {
    id: "MP-DEMO-0001",
    asset: "Bitcoin",
    symbol: "BTC",
    category: "Crypto",
    publishedAt: "2026-07-01",
    evaluationDate: "2026-07-08",
    entryPrice: 61_200,
    targetReturn: 6,
    actualReturn: 8.4,
    score: 94,
    confidence: 91,
    status: "Successful",
  },
  {
    id: "MP-DEMO-0002",
    asset: "NVIDIA",
    symbol: "NVDA",
    category: "Stock",
    publishedAt: "2026-07-02",
    evaluationDate: "2026-07-09",
    entryPrice: 153.8,
    targetReturn: 5,
    actualReturn: 6.2,
    score: 92,
    confidence: 89,
    status: "Successful",
  },
  {
    id: "MP-DEMO-0003",
    asset: "Solana",
    symbol: "SOL",
    category: "Crypto",
    publishedAt: "2026-07-03",
    evaluationDate: "2026-07-10",
    entryPrice: 72.4,
    targetReturn: 8,
    actualReturn: -3.1,
    score: 88,
    confidence: 84,
    status: "Unsuccessful",
  },
  {
    id: "MP-DEMO-0004",
    asset: "Vanguard S&P 500 ETF",
    symbol: "VOO",
    category: "ETF",
    publishedAt: "2026-07-04",
    evaluationDate: "2026-07-11",
    entryPrice: 535.2,
    targetReturn: 3,
    actualReturn: 3.8,
    score: 89,
    confidence: 90,
    status: "Successful",
  },
  {
    id: "MP-DEMO-0005",
    asset: "Ethereum",
    symbol: "ETH",
    category: "Crypto",
    publishedAt: "2026-07-05",
    evaluationDate: "2026-07-12",
    entryPrice: 1_790,
    targetReturn: 7,
    actualReturn: 8.9,
    score: 91,
    confidence: 88,
    status: "Successful",
  },
  {
    id: "MP-DEMO-0006",
    asset: "Apple",
    symbol: "AAPL",
    category: "Stock",
    publishedAt: "2026-07-06",
    evaluationDate: "2026-07-13",
    entryPrice: 214.6,
    targetReturn: 4,
    actualReturn: -1.7,
    score: 84,
    confidence: 80,
    status: "Unsuccessful",
  },
  {
    id: "MP-DEMO-0007",
    asset: "Chainlink",
    symbol: "LINK",
    category: "Crypto",
    publishedAt: "2026-07-15",
    evaluationDate: "2026-07-22",
    entryPrice: 13.4,
    targetReturn: 9,
    actualReturn: null,
    score: 87,
    confidence: 85,
    status: "Pending",
  },
  {
    id: "MP-DEMO-0008",
    asset: "Invesco QQQ Trust",
    symbol: "QQQ",
    category: "ETF",
    publishedAt: "2026-07-16",
    evaluationDate: "2026-07-23",
    entryPrice: 561.3,
    targetReturn: 4,
    actualReturn: null,
    score: 86,
    confidence: 83,
    status: "Pending",
  },
];