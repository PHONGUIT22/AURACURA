/**
 * Beauty Profile Repository
 * Manages ConsumerBeautyProfile records and AuraCura Dossiers in SQLite via node:sqlite.
 * Replaces legacy vipDossierRepo.
 */

import { randomUUID } from 'node:crypto';
import { getDatabase } from './db.js';
import type { ConsumerBeautyProfile, AuraCuraDossier } from '../types/index.js';

interface BeautyProfileRow {
  id: string;
  full_name: string;
  age: number;
  event_context: string;
  budget_limit_usd: number;
  known_allergies_json: string;
  user_selfie_url: string;
  preferred_style: string;
  created_at: string;
}

export interface AuraCuraDossierRecord {
  id: string;
  profileId: string;
  dossier: AuraCuraDossier;
  isBookmarked: boolean;
  createdAt: string;
}

interface DossierRow {
  id: string;
  vip_id: string;
  dossier_json: string;
  is_bookmarked: number;
  created_at: string;
}

function safeParseJson<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function rowToProfile(row: BeautyProfileRow): ConsumerBeautyProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    age: Number(row.age),
    eventContext: row.event_context,
    budgetLimitUsd: Number(row.budget_limit_usd),
    knownAllergies: safeParseJson<string[]>(row.known_allergies_json, []),
    userSelfieUrl: row.user_selfie_url,
    preferredStyle: row.preferred_style,
  };
}

export const beautyProfileRepo = {
  // -------------------------------------------------------------------------
  // Consumer Beauty Profiles
  // -------------------------------------------------------------------------

  /**
   * Retrieves all registered consumer beauty profiles ordered by creation time.
   */
  listProfiles(): ConsumerBeautyProfile[] {
    const rows = getDatabase()
      .prepare('SELECT * FROM consumer_beauty_profiles ORDER BY created_at ASC, full_name ASC')
      .all() as unknown as BeautyProfileRow[];
    return rows.map(rowToProfile);
  },

  /**
   * Fetches an individual consumer beauty profile by unique ID.
   */
  getProfile(id: string): ConsumerBeautyProfile | null {
    const row = getDatabase()
      .prepare('SELECT * FROM consumer_beauty_profiles WHERE id = ?')
      .get(id) as unknown as BeautyProfileRow | undefined;
    return row ? rowToProfile(row) : null;
  },

  /**
   * Alias for getProfile(id)
   */
  getProfileById(id: string): ConsumerBeautyProfile | null {
    return this.getProfile(id);
  },

  /**
   * Inserts or updates a consumer beauty profile idempotently.
   */
  upsertProfile(input: ConsumerBeautyProfile): ConsumerBeautyProfile {
    const db = getDatabase();
    const id = input.id?.trim() || `profile_${randomUUID().slice(0, 8)}`;
    const existing = this.getProfile(id);
    const createdAt = existing ? new Date().toISOString() : new Date().toISOString();

    db.prepare(
      `INSERT INTO consumer_beauty_profiles
         (id, full_name, age, event_context, budget_limit_usd, known_allergies_json, user_selfie_url, preferred_style, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         full_name = excluded.full_name,
         age = excluded.age,
         event_context = excluded.event_context,
         budget_limit_usd = excluded.budget_limit_usd,
         known_allergies_json = excluded.known_allergies_json,
         user_selfie_url = excluded.user_selfie_url,
         preferred_style = excluded.preferred_style`
    ).run(
      id,
      input.fullName.trim(),
      Math.max(1, Math.min(120, Number(input.age) || 25)),
      input.eventContext.trim(),
      Math.max(0, Number(input.budgetLimitUsd) || 0),
      JSON.stringify(input.knownAllergies || []),
      input.userSelfieUrl.trim(),
      input.preferredStyle.trim(),
      createdAt
    );

    const saved = this.getProfile(id);
    if (!saved) throw new Error(`Failed to persist beauty profile '${id}'.`);
    return saved;
  },

  /**
   * Deletes a profile by ID.
   */
  deleteProfile(id: string): boolean {
    const result = getDatabase().prepare('DELETE FROM consumer_beauty_profiles WHERE id = ?').run(id);
    return Number(result.changes) > 0;
  },

  // -------------------------------------------------------------------------
  // Dossier Storage & History
  // -------------------------------------------------------------------------

  /**
   * Saves a synthesized AuraCura dossier.
   */
  saveDossier(profileId: string, dossier: AuraCuraDossier): AuraCuraDossierRecord {
    const id = `dsr_${randomUUID()}`;
    const createdAt = new Date().toISOString();
    getDatabase()
      .prepare('INSERT INTO consumer_dossiers (id, profile_id, dossier_json, is_bookmarked, created_at) VALUES (?, ?, ?, 0, ?)')
      .run(id, profileId, JSON.stringify(dossier), createdAt);
    return { id, profileId, dossier, isBookmarked: false, createdAt };
  },

  /**
   * Retrieves an AuraCura dossier by record ID.
   */
  getDossier(id: string): AuraCuraDossierRecord | null {
    const row = getDatabase().prepare('SELECT * FROM consumer_dossiers WHERE id = ?').get(id) as unknown as
      | { id: string; profile_id: string; dossier_json: string; is_bookmarked: number; created_at: string }
      | undefined;
    if (!row) return null;
    return {
      id: row.id,
      profileId: row.profile_id,
      dossier: JSON.parse(row.dossier_json) as AuraCuraDossier,
      isBookmarked: row.is_bookmarked === 1,
      createdAt: row.created_at,
    };
  },

  /**
   * Returns recent dossiers for a consumer profile.
   */
  listDossiers(profileId: string, limit = 20): AuraCuraDossierRecord[] {
    const rows = getDatabase()
      .prepare('SELECT * FROM consumer_dossiers WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(profileId, Math.max(1, Math.min(limit, 100))) as unknown as { id: string; profile_id: string; dossier_json: string; is_bookmarked: number; created_at: string }[];
    return rows.map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      dossier: JSON.parse(row.dossier_json) as AuraCuraDossier,
      isBookmarked: row.is_bookmarked === 1,
      createdAt: row.created_at,
    }));
  },

  /**
   * Returns the most recent dossier synthesized for this profile.
   */
  getLatestDossier(profileId: string): AuraCuraDossier | null {
    const list = this.listDossiers(profileId, 1);
    return list[0]?.dossier || null;
  },
};

export type BeautyProfileRepo = typeof beautyProfileRepo;
