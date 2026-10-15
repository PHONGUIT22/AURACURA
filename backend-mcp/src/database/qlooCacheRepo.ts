import { getDatabase } from './db.js';

interface MemoryCacheEntry {
  data: any;
  expiresAt: number;
}

interface CacheRow {
  cache_key: string;
  response_json: string;
  created_at: string;
  expires_at: string;
}

const memoryCache = new Map<string, MemoryCacheEntry>();
const DEFAULT_TTL_SECONDS = 86400; // 24 hours

export const qlooCacheRepo = {
  /**
   * Retrieves cached Qloo response from L1 in-memory map or L2 SQLite table.
   * Target latency: < 1ms in memory, < 5ms SQLite.
   */
  get<T>(key: string): T | null {
    const now = Date.now();

    // 1. Check L1 Memory Cache (< 1ms)
    const memEntry = memoryCache.get(key);
    if (memEntry) {
      if (memEntry.expiresAt > now) {
        return memEntry.data as T;
      }
      memoryCache.delete(key);
    }

    // 2. Check L2 SQLite Cache (< 5ms)
    try {
      const db = getDatabase();
      const row = db
        .prepare('SELECT response_json, expires_at FROM qloo_cache WHERE cache_key = ?')
        .get(key) as unknown as CacheRow | undefined;

      if (!row) return null;

      const expiresAtMs = new Date(row.expires_at).getTime();
      if (expiresAtMs <= now) {
        // Expired in SQLite
        db.prepare('DELETE FROM qloo_cache WHERE cache_key = ?').run(key);
        return null;
      }

      const parsed = JSON.parse(row.response_json) as T;
      // Populate L1 cache for subsequent fast hits
      memoryCache.set(key, { data: parsed, expiresAt: expiresAtMs });
      return parsed;
    } catch (err) {
      console.warn(`[QlooCache] Error reading cache key '${key}':`, err);
      return null;
    }
  },

  /**
   * Writes Qloo response into both L1 Memory and L2 SQLite cache.
   */
  set<T>(key: string, data: T, ttlSeconds: number = DEFAULT_TTL_SECONDS): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    const expiresAtMs = expiresAt.getTime();

    // 1. Write to L1 Memory
    memoryCache.set(key, { data, expiresAt: expiresAtMs });

    // 2. Write to L2 SQLite
    try {
      const db = getDatabase();
      db.prepare(
        `INSERT INTO qloo_cache (cache_key, response_json, created_at, expires_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(cache_key) DO UPDATE SET
           response_json = excluded.response_json,
           created_at = excluded.created_at,
           expires_at = excluded.expires_at`
      ).run(key, JSON.stringify(data), now.toISOString(), expiresAt.toISOString());
    } catch (err) {
      console.warn(`[QlooCache] Error writing cache key '${key}':`, err);
    }
  },

  /**
   * Prunes expired cache records from SQLite and Memory.
   */
  cleanExpired(): void {
    const nowIso = new Date().toISOString();
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM qloo_cache WHERE expires_at <= ?').run(nowIso);
    } catch {
      // Ignored
    }

    const now = Date.now();
    for (const [k, v] of memoryCache.entries()) {
      if (v.expiresAt <= now) {
        memoryCache.delete(k);
      }
    }
  },

  /**
   * Clears all cache entries from memory and SQLite.
   */
  clear(): void {
    memoryCache.clear();
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM qloo_cache').run();
    } catch {
      // Ignored
    }
  },

  /**
   * Diagnostic statistics for Qloo telemetry.
   */
  stats(): { memoryEntries: number; sqliteEntries: number } {
    let sqliteEntries = 0;
    try {
      const db = getDatabase();
      const countRow = db.prepare('SELECT COUNT(*) as count FROM qloo_cache').get() as any;
      sqliteEntries = Number(countRow?.count || 0);
    } catch {
      sqliteEntries = 0;
    }
    return {
      memoryEntries: memoryCache.size,
      sqliteEntries,
    };
  },
};
