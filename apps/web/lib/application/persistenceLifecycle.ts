import type {
  Awaitable,
} from "@/lib/types/awaitable";

export interface PersistenceLifecycle {
  close(): Awaitable<void>;
}
