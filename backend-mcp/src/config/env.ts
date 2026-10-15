import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Environment loader for the monorepo.
 * Precedence (later wins): repo root `.env` → `backend-mcp/.env` → `$CWD/.env`.
 * Values are never logged; only boolean "configured" states are exposed.
 */
const candidateEnvFiles = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const file of candidateEnvFiles) {
  try {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {
    // Continue gracefully
  }
}

const PLACEHOLDER_PATTERN = /^(PASTE_|YOUR_|your_|changeme|<)/;

/** True when a variable holds a real value rather than an empty string or a template placeholder. */
export function isRealSecret(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && !PLACEHOLDER_PATTERN.test(trimmed) && !trimmed.includes('PASTE_');
}

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const envConfig = {
  get PORT(): number {
    return readNumber(process.env.PORT ?? process.env.MCP_PORT, 3001);
  },
  get AWS_REGION(): string {
    return process.env.AWS_BEDROCK_REGION?.trim() || process.env.AWS_REGION?.trim() || 'us-east-1';
  },
  get BEDROCK_MODEL_ID(): string {
    return process.env.BEDROCK_MODEL_ID?.trim() || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
  },
  get BEDROCK_TIMEOUT_MS(): number {
    return readNumber(process.env.BEDROCK_TIMEOUT_MS, 45000);
  },
  get YOUCAM_API_KEY(): string {
    return process.env.YOUCAM_API_KEY?.trim() || '';
  },
  get YOUCAM_BASE_URL(): string {
    return (process.env.YOUCAM_BASE_URL?.trim() || 'https://yce-api-01.makeupar.com').replace(/\/+$/, '');
  },
  get YOUCAM_TIMEOUT_MS(): number {
    return readNumber(process.env.YOUCAM_TIMEOUT_MS, 10000);
  },
  get QLOO_API_URL(): string {
    return (process.env.QLOO_API_URL?.trim() || 'https://hackathon.api.qloo.com').replace(/\/+$/, '');
  },
  get QLOO_TIMEOUT_MS(): number {
    return readNumber(process.env.QLOO_TIMEOUT_MS, 6000);
  },
  get POLLY_VOICE_ID(): string {
    return process.env.POLLY_VOICE_ID?.trim() || 'Matthew';
  },
  get CORS_ORIGINS(): string[] {
    const raw = process.env.CORS_ORIGINS?.trim();
    if (!raw) return ['*'];
    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  },
  get DB_PATH(): string | undefined {
    return process.env.AURACURA_DB_PATH?.trim() || process.env.CURAVIP_DB_PATH?.trim() || undefined;
  },
  get youcamConfigured(): boolean {
    return isRealSecret(process.env.YOUCAM_API_KEY);
  },
  get qlooConfigured(): boolean {
    return isRealSecret(process.env.QLOO_API_KEY);
  },
  get bedrockConfigured(): boolean {
    return isRealSecret(process.env.AWS_ACCESS_KEY_ID) && isRealSecret(process.env.AWS_SECRET_ACCESS_KEY);
  },
};

/** Shorthand alias for unified configuration access */
export const env = {
  port: envConfig.PORT,
  youcamApiKey: envConfig.YOUCAM_API_KEY,
  youcamBaseUrl: envConfig.YOUCAM_BASE_URL,
  youcamTimeoutMs: envConfig.YOUCAM_TIMEOUT_MS,
  sqliteDbPath: envConfig.DB_PATH,
  bedrockRegion: envConfig.AWS_REGION,
  youcamConfigured: envConfig.youcamConfigured,
};
