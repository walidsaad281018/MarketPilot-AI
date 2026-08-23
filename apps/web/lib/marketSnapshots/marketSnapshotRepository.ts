import type {
  MarketSnapshot,
  MarketSnapshotCategory,
} from "@/lib/marketSnapshots/marketSnapshot";
import type {
  Awaitable,
} from "@/lib/types/awaitable";

export interface MarketSnapshotRepository {
  getAll():
    Awaitable<MarketSnapshot[]>;

  getById(
    snapshotId: string,
  ):
    Awaitable<
      MarketSnapshot | undefined
    >;

  getBySymbol(
    symbol: string,
  ):
    Awaitable<MarketSnapshot[]>;

  getByCategory(
    category: MarketSnapshotCategory,
  ):
    Awaitable<MarketSnapshot[]>;

  getLatestBySymbol(
    symbol: string,
  ):
    Awaitable<
      MarketSnapshot | undefined
    >;

  save(
    snapshot: MarketSnapshot,
  ):
    Awaitable<MarketSnapshot>;

  saveMany(
    snapshots: MarketSnapshot[],
  ):
    Awaitable<MarketSnapshot[]>;
}
