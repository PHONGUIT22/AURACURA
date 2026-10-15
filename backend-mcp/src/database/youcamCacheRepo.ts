/**
 * YouCam Cache Repository
 * Dual-layer cache (L1 Memory Map + L2 SQLite via node:sqlite) for YouCam API responses.
 * Guarantees zero redundant API consumption for identical selfie scans & VTO requests.
 */

import crypto from 'node:crypto';
import { getDatabase } from './db.js';
import type { SkinMetrics } from '../types/index.js';

interface MemoryCacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface SkinCacheRow {
  image_hash: string;
  image_url: string;
  metrics_json: string;
  created_at: string;
  expires_at: string;
}

interface VtoCacheRow {
  combo_hash: string;
  person_img: string;
  garment_img: string;
  rendered_url: string;
  created_at: string;
  expires_at: string;
}

const memorySkinCache = new Map<string, MemoryCacheEntry<SkinMetrics>>();
const memoryVtoCache = new Map<string, MemoryCacheEntry<string>>();
const DEFAULT_TTL_SECONDS = 7 * 86400; // 7 days retention for dermatological scans

export function hashString(value: string): string {
  return crypto.createHash('sha256').update(value.trim()).digest('hex');
}

export const youcamCacheRepo = {
  /**
   * Generates a unique deterministic SHA-256 hash for an image URL.
   */
  hashImageUrl(imageUrl: string): string {
    return hashString(imageUrl);
  },

  /**
   * Generates a unique deterministic SHA-256 hash for a person + garment VTO pair.
   */
  hashVtoPair(personImg: string, garmentImg: string): string {
    return hashString(`${personImg.trim()}::${garmentImg.trim()}`);
  },

  /**
   * Retrieves cached skin diagnostic metrics from L1 Memory or L2 SQLite.
   */
  getCachedSkinAnalysis(imageUrl: string): SkinMetrics | null {
    const hash = this.hashImageUrl(imageUrl);
    const now = Date.now();

    // 1. Check L1 Memory (< 1ms)
    const mem = memorySkinCache.get(hash);
    if (mem) {
      if (mem.expiresAt > now) {
        return mem.data;
      }
      memorySkinCache.delete(hash);
    }

    // 2. Check L2 SQLite (< 5ms)
    try {
      const db = getDatabase();
      const row = db
        .prepare('SELECT metrics_json, expires_at FROM youcam_skin_cache WHERE image_hash = ?')
        .get(hash) as unknown as SkinCacheRow | undefined;

      if (!row) return null;

      const expiresAtMs = new Date(row.expires_at).getTime();
      if (expiresAtMs <= now) {
        db.prepare('DELETE FROM youcam_skin_cache WHERE image_hash = ?').run(hash);
        return null;
      }

      const metrics = JSON.parse(row.metrics_json) as SkinMetrics;
      memorySkinCache.set(hash, { data: metrics, expiresAt: expiresAtMs });
      return metrics;
    } catch (err) {
      console.warn(`[YouCamCache] Error reading skin cache for hash '${hash}':`, err);
      return null;
    }
  },

  /**
   * Writes skin diagnostic metrics into L1 Memory and L2 SQLite cache.
   */
  cacheSkinAnalysis(imageUrl: string, metrics: SkinMetrics, ttlSeconds: number = DEFAULT_TTL_SECONDS): void {
    const hash = this.hashImageUrl(imageUrl);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    const expiresAtMs = expiresAt.getTime();

    // 1. Write to L1 Memory
    memorySkinCache.set(hash, { data: metrics, expiresAt: expiresAtMs });

    // 2. Write to L2 SQLite
    try {
      const db = getDatabase();
      db.prepare(
        `INSERT INTO youcam_skin_cache (image_hash, image_url, metrics_json, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(image_hash) DO UPDATE SET
           image_url = excluded.image_url,
           metrics_json = excluded.metrics_json,
           created_at = excluded.created_at,
           expires_at = excluded.expires_at`
      ).run(hash, imageUrl, JSON.stringify(metrics), now.toISOString(), expiresAt.toISOString());
    } catch (err) {
      console.warn(`[YouCamCache] Error persisting skin metrics for hash '${hash}':`, err);
    }
  },

  /**
   * Retrieves cached VTO simulation rendered asset URL.
   */
  getCachedVTO(personImg: string, garmentImg: string): string | null {
    const comboHash = this.hashVtoPair(personImg, garmentImg);
    const now = Date.now();

    // 1. L1 Memory
    const mem = memoryVtoCache.get(comboHash);
    if (mem) {
      if (mem.expiresAt > now) {
        return mem.data;
      }
      memoryVtoCache.delete(comboHash);
    }

    // 2. L2 SQLite
    try {
      const db = getDatabase();
      const row = db
        .prepare('SELECT rendered_url, expires_at FROM youcam_vto_cache WHERE combo_hash = ?')
        .get(comboHash) as unknown as VtoCacheRow | undefined;

      if (!row) return null;

      const expiresAtMs = new Date(row.expires_at).getTime();
      if (expiresAtMs <= now) {
        db.prepare('DELETE FROM youcam_vto_cache WHERE combo_hash = ?').run(comboHash);
        return null;
      }

      memoryVtoCache.set(comboHash, { data: row.rendered_url, expiresAt: expiresAtMs });
      return row.rendered_url;
    } catch (err) {
      console.warn(`[YouCamCache] Error reading VTO cache for hash '${comboHash}':`, err);
      return null;
    }
  },

  /**
   * Persists VTO simulation rendered asset URL into L1 and L2 cache.
   */
  cacheVTO(
    personImg: string,
    garmentImg: string,
    renderedUrl: string,
    ttlSeconds: number = DEFAULT_TTL_SECONDS
  ): void {
    const comboHash = this.hashVtoPair(personImg, garmentImg);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    const expiresAtMs = expiresAt.getTime();

    // 1. L1 Memory
    memoryVtoCache.set(comboHash, { data: renderedUrl, expiresAt: expiresAtMs });

    // 2. L2 SQLite
    try {
      const db = getDatabase();
      db.prepare(
        `INSERT INTO youcam_vto_cache (combo_hash, person_img, garment_img, rendered_url, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(combo_hash) DO UPDATE SET
           person_img = excluded.person_img,
           garment_img = excluded.garment_img,
           rendered_url = excluded.rendered_url,
           created_at = excluded.created_at,
           expires_at = excluded.expires_at`
      ).run(comboHash, personImg, garmentImg, renderedUrl, now.toISOString(), expiresAt.toISOString());
    } catch (err) {
      console.warn(`[YouCamCache] Error persisting VTO for hash '${comboHash}':`, err);
    }
  },

  /**
   * Cleans up expired cache entries from SQLite and Memory.
   */
  cleanExpired(): void {
    const nowIso = new Date().toISOString();
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM youcam_skin_cache WHERE expires_at <= ?').run(nowIso);
      db.prepare('DELETE FROM youcam_vto_cache WHERE expires_at <= ?').run(nowIso);
    } catch {
      // Ignored
    }

    const now = Date.now();
    for (const [k, v] of memorySkinCache.entries()) {
      if (v.expiresAt <= now) memorySkinCache.delete(k);
    }
    for (const [k, v] of memoryVtoCache.entries()) {
      if (v.expiresAt <= now) memoryVtoCache.delete(k);
    }
  },

  /**
   * Clears all cache records.
   */
  clear(): void {
    memorySkinCache.clear();
    memoryVtoCache.clear();
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM youcam_skin_cache').run();
      db.prepare('DELETE FROM youcam_vto_cache').run();
    } catch {
      // Ignored
    }
  },

  /**
   * Diagnostic statistics for YouCam cache efficiency.
   */
  stats(): {
    skinMemoryEntries: number;
    vtoMemoryEntries: number;
    skinSqliteEntries: number;
    vtoSqliteEntries: number;
  } {
    let skinSqliteEntries = 0;
    let vtoSqliteEntries = 0;
    try {
      const db = getDatabase();
      const skinCount = db.prepare('SELECT COUNT(*) as count FROM youcam_skin_cache').get() as any;
      const vtoCount = db.prepare('SELECT COUNT(*) as count FROM youcam_vto_cache').get() as any;
      skinSqliteEntries = Number(skinCount?.count || 0);
      vtoSqliteEntries = Number(vtoCount?.count || 0);
    } catch {
      // Ignored
    }

    return {
      skinMemoryEntries: memorySkinCache.size,
      vtoMemoryEntries: memoryVtoCache.size,
      skinSqliteEntries,
      vtoSqliteEntries,
    };
  },
};
