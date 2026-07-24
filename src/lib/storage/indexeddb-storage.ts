import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PosterStorage } from "./poster-storage";
import type { NewPosterRecord, PosterRecord } from "./types";

interface GamtooDB extends DBSchema {
  posters: {
    key: string;
    value: PosterRecord;
    indexes: { "by-createdAt": string };
  };
}

const DB_NAME = "gamtoo";
const DB_VERSION = 1;
const STORE_NAME = "posters";

let dbPromise: Promise<IDBPDatabase<GamtooDB>> | null = null;

function getDb(): Promise<IDBPDatabase<GamtooDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GamtooDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

export class IndexedDBPosterStorage implements PosterStorage {
  async save(record: NewPosterRecord): Promise<PosterRecord> {
    const db = await getDb();
    const full: PosterRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await db.put(STORE_NAME, full);
    return full;
  }

  async getAll(): Promise<PosterRecord[]> {
    const db = await getDb();
    const all = await db.getAllFromIndex(STORE_NAME, "by-createdAt");
    return all.reverse();
  }

  async getById(id: string): Promise<PosterRecord | undefined> {
    const db = await getDb();
    return db.get(STORE_NAME, id);
  }

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORE_NAME, id);
  }
}
