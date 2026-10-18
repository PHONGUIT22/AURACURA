import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { envConfig } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DB_DIR = path.resolve(__dirname, '../../data');
const DEFAULT_DB_PATH = path.join(DEFAULT_DB_DIR, 'auracura.db');

let dbInstance: DatabaseSync | null = null;
let resolvedPath: string | null = null;

function resolveDatabasePath(): string {
  if (envConfig.DB_PATH) return envConfig.DB_PATH;
  if (process.env.VITEST || process.env.NODE_ENV === 'test') return ':memory:';
  return DEFAULT_DB_PATH;
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS vip_profiles (
    id TEXT PRIMARY KEY NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    organization TEXT NOT NULL,
    city TEXT NOT NULL,
    budget_limit_usd REAL NOT NULL CHECK (budget_limit_usd >= 0),
    raw_bio TEXT NOT NULL DEFAULT '',
    explicit_interests_json TEXT NOT NULL DEFAULT '[]',
    taboos_json TEXT NOT NULL DEFAULT '{"alcohol":false,"dietary":[],"religiousCultural":[]}',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dossier_records (
    id TEXT PRIMARY KEY NOT NULL,
    vip_id TEXT NOT NULL,
    dossier_json TEXT NOT NULL,
    is_bookmarked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (vip_id) REFERENCES vip_profiles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS curation_history (
    id TEXT PRIMARY KEY NOT NULL,
    vip_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('gift', 'dining')),
    item_name TEXT NOT NULL,
    awarded_at TEXT NOT NULL,
    FOREIGN KEY (vip_id) REFERENCES vip_profiles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reservation_orders (
    id TEXT PRIMARY KEY NOT NULL,
    vip_id TEXT NOT NULL,
    order_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (vip_id) REFERENCES vip_profiles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS qloo_cache (
    cache_key TEXT PRIMARY KEY NOT NULL,
    response_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS consumer_beauty_profiles (
    id TEXT PRIMARY KEY NOT NULL,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    event_context TEXT NOT NULL,
    budget_limit_usd REAL NOT NULL CHECK (budget_limit_usd >= 0),
    known_allergies_json TEXT NOT NULL DEFAULT '[]',
    user_selfie_url TEXT NOT NULL,
    preferred_style TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS youcam_skin_cache (
    image_hash TEXT PRIMARY KEY NOT NULL,
    image_url TEXT NOT NULL,
    metrics_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS youcam_vto_cache (
    combo_hash TEXT PRIMARY KEY NOT NULL,
    person_img TEXT NOT NULL,
    garment_img TEXT NOT NULL,
    rendered_url TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS consumer_dossiers (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    dossier_json TEXT NOT NULL,
    is_bookmarked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES consumer_beauty_profiles(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_dossier_vip_created ON dossier_records(vip_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_consumer_dossiers_profile ON consumer_dossiers(profile_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_history_vip ON curation_history(vip_id, awarded_at DESC);
  CREATE INDEX IF NOT EXISTS idx_orders_vip ON reservation_orders(vip_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_qloo_cache_expires ON qloo_cache(expires_at);
  CREATE INDEX IF NOT EXISTS idx_youcam_skin_expires ON youcam_skin_cache(expires_at);
  CREATE INDEX IF NOT EXISTS idx_youcam_vto_expires ON youcam_vto_cache(expires_at);
`;

/**
 * Opens the SQLite database (file-backed in runtime, in-memory under Vitest/read-only environments) and applies schema.
 */
export function initDB(): DatabaseSync {
  if (dbInstance) return dbInstance;

  let dbPath = resolveDatabasePath();
  let isMemory = dbPath === ':memory:';

  if (!isMemory) {
    try {
      const dbDir = path.dirname(dbPath);
      fs.mkdirSync(dbDir, { recursive: true });

      // Probe write permissions to avoid crashing on read-only cloud filesystems
      const testProbe = path.join(dbDir, `.probe_${Date.now()}`);
      fs.writeFileSync(testProbe, 'ok');
      fs.unlinkSync(testProbe);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[SQLite] Notice: Persistent directory for '${dbPath}' is unwritable (${msg}). Falling back to ephemeral in-memory vault.`
      );
      dbPath = ':memory:';
      isMemory = true;
    }
  }

  let db: DatabaseSync;
  try {
    db = new DatabaseSync(dbPath);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[SQLite] DatabaseSync failed at '${dbPath}' (${msg}). Initializing in-memory fallback.`);
    dbPath = ':memory:';
    isMemory = true;
    db = new DatabaseSync(':memory:');
  }

  if (!isMemory) {
    try {
      db.exec('PRAGMA journal_mode = WAL;');
      db.exec('PRAGMA synchronous = NORMAL;');
    } catch {
      // Ignore pragma failures on non-standard cloud environments
    }
  }

  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA_SQL);

  dbInstance = db;
  resolvedPath = dbPath;
  if (!process.env.VITEST) {
    console.log(`[SQLite] AuraCura vault ready at ${isMemory ? 'in-memory' : dbPath}`);
  }
  return db;
}

export function getDatabase(): DatabaseSync {
  return dbInstance ?? initDB();
}

export function getDatabasePath(): string | null {
  return resolvedPath;
}

/**
 * Runs `work` inside a transaction, rolling back on any thrown error.
 */
export function withTransaction<T>(work: (db: DatabaseSync) => T): T {
  const db = getDatabase();
  db.exec('BEGIN');
  try {
    const result = work(db);
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    resolvedPath = null;
  }
}

process.once('exit', () => closeDB());