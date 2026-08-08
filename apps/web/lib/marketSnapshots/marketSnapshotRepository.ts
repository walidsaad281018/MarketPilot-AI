import type {
  MarketSnapshot,
  MarketSnapshotCategory,
} from "@/lib/marketSnapshots/marketSnapshot";

export interface MarketSnapshotRepository {
  getAll(): MarketSnapshot[];

  getById(
    snapshotId: string,
  ): MarketSnapshot | undefined;

  getBySymbol(
    symbol: string,
  ): MarketSnapshot[];

  getByCategory(
    category: MarketSnapshotCategory,
  ): MarketSnapshot[];

  getLatestBySymbol(
    symbol: string,
  ): MarketSnapshot | undefined;

  save(
    snapshot: MarketSnapshot,
  ): MarketSnapshot;

  saveMany(
    snapshots: MarketSnapshot[],
  ): MarketSnapshot[];
}
