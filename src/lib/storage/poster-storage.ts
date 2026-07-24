import type { NewPosterRecord, PosterRecord } from "./types";

/**
 * Storage abstraction the rest of the app codes against. IndexedDB backs it
 * today; swapping in a Supabase-backed implementation later (for account
 * sync) means adding a new class here, not touching call sites.
 */
export interface PosterStorage {
  save(record: NewPosterRecord): Promise<PosterRecord>;
  /** Newest first. */
  getAll(): Promise<PosterRecord[]>;
  getById(id: string): Promise<PosterRecord | undefined>;
  remove(id: string): Promise<void>;
}
