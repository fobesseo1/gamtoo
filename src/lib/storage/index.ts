import { IndexedDBPosterStorage } from "./indexeddb-storage";
import type { PosterStorage } from "./poster-storage";

export type { PosterStorage } from "./poster-storage";
export type { PosterRecord, NewPosterRecord } from "./types";

let instance: PosterStorage | null = null;

export function getPosterStorage(): PosterStorage {
  if (!instance) instance = new IndexedDBPosterStorage();
  return instance;
}
