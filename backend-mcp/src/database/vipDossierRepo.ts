import { randomUUID } from 'node:crypto';
import { getDatabase } from './db.js';
import type {
  CurationHistoryEntry,
  DossierRecord,
  ExecutiveDossier,
  ReservationOrder,
  VIPProfile,
  VIPProfileInput,
  VIPTaboos,
} from '../types/index.js';

interface VipProfileRow {
  id: string;
  full_name: string;
  role: string;
  organization: string;
  city: string;
  budget_limit_usd: number;
  raw_bio: string;
  explicit_interests_json: string;
  taboos_json: string;
  created_at: string;
}

interface DossierRow {
  id: string;
  vip_id: string;
  dossier_json: string;
  is_bookmarked: number;
  created_at: string;
}

interface HistoryRow {
  id: string;
  vip_id: string;
  item_type: 'gift' | 'dining';
  item_name: string;
  awarded_at: string;
}

interface OrderRow {
  order_json: string;
}

const EMPTY_TABOOS: VIPTaboos = { alcohol: false, dietary: [], religiousCultural: [] };

function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function normalizeStringList(values: readonly string[] | undefined): string[] {
  if (!values) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}

function normalizeTaboos(taboos: Partial<VIPTaboos> | undefined): VIPTaboos {
  return {
    alcohol: Boolean(taboos?.alcohol),
    dietary: normalizeStringList(taboos?.dietary).map((d) => d.toLowerCase()),
    religiousCultural: normalizeStringList(taboos?.religiousCultural),
  };
}

function rowToProfile(row: VipProfileRow): VIPProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    organization: row.organization,
    city: row.city,
    budgetLimitUsd: Number(row.budget_limit_usd),
    rawBio: row.raw_bio,
    explicitInterests: safeParse<string[]>(row.explicit_interests_json, []),
    taboos: normalizeTaboos(safeParse<VIPTaboos>(row.taboos_json, EMPTY_TABOOS)),
    createdAt: row.created_at,
  };
}

function rowToDossierRecord(row: DossierRow): DossierRecord {
  return {
    id: row.id,
    vipId: row.vip_id,
    dossier: JSON.parse(row.dossier_json) as ExecutiveDossier,
    isBookmarked: row.is_bookmarked === 1,
    createdAt: row.created_at,
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

/**
 * Repository for principals (VIP profiles), generated dossiers, gifting precedent and fulfilment orders.
 */
export const vipDossierRepo = {
  // -------------------------------------------------------------------------
  // VIP profiles
  // -------------------------------------------------------------------------

  listProfiles(): VIPProfile[] {
    const rows = getDatabase()
      .prepare('SELECT * FROM vip_profiles ORDER BY created_at ASC, full_name ASC')
      .all() as unknown as VipProfileRow[];
    return rows.map(rowToProfile);
  },

  getProfile(id: string): VIPProfile | null {
    const row = getDatabase().prepare('SELECT * FROM vip_profiles WHERE id = ?').get(id) as unknown as
      | VipProfileRow
      | undefined;
    return row ? rowToProfile(row) : null;
  },

  upsertProfile(input: VIPProfileInput): VIPProfile {
    const db = getDatabase();
    const id = input.id?.trim() || `vip_${slugify(input.fullName) || 'principal'}_${randomUUID().slice(0, 6)}`;
    const existing = this.getProfile(id);
    const createdAt = existing?.createdAt ?? new Date().toISOString();

    db.prepare(
      `INSERT INTO vip_profiles
         (id, full_name, role, organization, city, budget_limit_usd, raw_bio, explicit_interests_json, taboos_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         full_name = excluded.full_name,
         role = excluded.role,
         organization = excluded.organization,
         city = excluded.city,
         budget_limit_usd = excluded.budget_limit_usd,
         raw_bio = excluded.raw_bio,
         explicit_interests_json = excluded.explicit_interests_json,
         taboos_json = excluded.taboos_json`
    ).run(
      id,
      input.fullName.trim(),
      input.role.trim(),
      input.organization.trim(),
      input.city.trim(),
      Math.max(0, Number(input.budgetLimitUsd) || 0),
      input.rawBio.trim(),
      JSON.stringify(normalizeStringList(input.explicitInterests)),
      JSON.stringify(normalizeTaboos(input.taboos)),
      createdAt
    );

    const saved = this.getProfile(id);
    if (!saved) throw new Error(`Failed to persist VIP profile '${id}'.`);
    return saved;
  },

  deleteProfile(id: string): boolean {
    const result = getDatabase().prepare('DELETE FROM vip_profiles WHERE id = ?').run(id);
    return Number(result.changes) > 0;
  },

  // -------------------------------------------------------------------------
  // Dossier records
  // -------------------------------------------------------------------------

  saveDossier(vipId: string, dossier: ExecutiveDossier): DossierRecord {
    const id = `dsr_${randomUUID()}`;
    const createdAt = new Date().toISOString();
    getDatabase()
      .prepare('INSERT INTO dossier_records (id, vip_id, dossier_json, is_bookmarked, created_at) VALUES (?, ?, ?, 0, ?)')
      .run(id, vipId, JSON.stringify(dossier), createdAt);
    return { id, vipId, dossier, isBookmarked: false, createdAt };
  },

  getDossier(id: string): DossierRecord | null {
    const row = getDatabase().prepare('SELECT * FROM dossier_records WHERE id = ?').get(id) as unknown as
      | DossierRow
      | undefined;
    return row ? rowToDossierRecord(row) : null;
  },

  listDossiers(vipId: string, limit = 20): DossierRecord[] {
    const rows = getDatabase()
      .prepare('SELECT * FROM dossier_records WHERE vip_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(vipId, Math.max(1, Math.min(limit, 100))) as unknown as DossierRow[];
    return rows.map(rowToDossierRecord);
  },

  getLatestDossier(vipId: string): ExecutiveDossier | null {
    const list = this.listDossiers(vipId, 1);
    return list[0]?.dossier || null;
  },

  listRecentDossiers(limit = 10): DossierRecord[] {
    const rows = getDatabase()
      .prepare('SELECT * FROM dossier_records ORDER BY created_at DESC LIMIT ?')
      .all(Math.max(1, Math.min(limit, 100))) as unknown as DossierRow[];
    return rows.map(rowToDossierRecord);
  },

  setBookmark(id: string, isBookmarked: boolean): DossierRecord | null {
    getDatabase()
      .prepare('UPDATE dossier_records SET is_bookmarked = ? WHERE id = ?')
      .run(isBookmarked ? 1 : 0, id);
    return this.getDossier(id);
  },

  // -------------------------------------------------------------------------
  // Curation precedent (prevents gifting the same item twice)
  // -------------------------------------------------------------------------

  recordCuration(vipId: string, itemType: 'gift' | 'dining', itemName: string): CurationHistoryEntry {
    const entry: CurationHistoryEntry = {
      id: `cur_${randomUUID()}`,
      vipId,
      itemType,
      itemName: itemName.trim(),
      awardedAt: new Date().toISOString(),
    };
    getDatabase()
      .prepare('INSERT INTO curation_history (id, vip_id, item_type, item_name, awarded_at) VALUES (?, ?, ?, ?, ?)')
      .run(entry.id, entry.vipId, entry.itemType, entry.itemName, entry.awardedAt);
    return entry;
  },

  listCurationHistory(vipId: string): CurationHistoryEntry[] {
    const rows = getDatabase()
      .prepare('SELECT * FROM curation_history WHERE vip_id = ? ORDER BY awarded_at DESC')
      .all(vipId) as unknown as HistoryRow[];
    return rows.map((row) => ({
      id: row.id,
      vipId: row.vip_id,
      itemType: row.item_type,
      itemName: row.item_name,
      awardedAt: row.awarded_at,
    }));
  },

  // -------------------------------------------------------------------------
  // Reservation / fulfilment orders
  // -------------------------------------------------------------------------

  saveReservationOrder(order: ReservationOrder): ReservationOrder {
    getDatabase()
      .prepare('INSERT INTO reservation_orders (id, vip_id, order_json, created_at) VALUES (?, ?, ?, ?)')
      .run(order.id, order.vipId, JSON.stringify(order), order.createdAt);
    return order;
  },

  listReservationOrders(vipId: string): ReservationOrder[] {
    const rows = getDatabase()
      .prepare('SELECT order_json FROM reservation_orders WHERE vip_id = ? ORDER BY created_at DESC')
      .all(vipId) as unknown as OrderRow[];
    return rows.map((row) => JSON.parse(row.order_json) as ReservationOrder);
  },
};

export type VipDossierRepo = typeof vipDossierRepo;
