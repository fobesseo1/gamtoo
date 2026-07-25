import type { NewPosterRecord, PosterRecord } from "./types";

/**
 * Storage abstraction the rest of the app codes against. Supabase (Postgres
 * `posts` + Storage) backs it, scoped per-user via RLS -- see
 * supabase-storage.ts and docs/gamtoo-item-system.md 4.0.
 */
export interface PosterStorage {
  save(record: NewPosterRecord): Promise<PosterRecord>;
  /** Newest first. */
  getAll(): Promise<PosterRecord[]>;
  getById(id: string): Promise<PosterRecord | undefined>;
  remove(id: string): Promise<void>;
}
