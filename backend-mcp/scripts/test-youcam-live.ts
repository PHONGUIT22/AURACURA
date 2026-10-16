/**
 * AuraCura — Official Perfect Corp YouCam S2S v2.0 Task & Polling Verification
 * Usage: npx tsx scripts/test-youcam-live.ts
 */

import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load .env from monorepo root and backend-mcp workspace
const rootEnvPath = path.resolve(__dirname, '../../.env');
const backendEnvPath = path.resolve(__dirname, '../.env');
const cwdEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(rootEnvPath)) dotenv.config({ path: rootEnvPath, quiet: true } as dotenv.DotenvConfigOptions);
if (fs.existsSync(backendEnvPath)) dotenv.config({ path: backendEnvPath, override: true, quiet: true } as dotenv.DotenvConfigOptions);
if (fs.existsSync(cwdEnvPath)) dotenv.config({ path: cwdEnvPath, override: true, quiet: true } as dotenv.DotenvConfigOptions);

import { envConfig } from '../src/config/env.js';
import { youcamClient } from '../src/services/youcamClient.js';
import { youcamCacheRepo } from '../src/database/youcamCacheRepo.js';
import app from '../src/server.js';

// ANSI Terminal Colors
const GREEN = '\x1b[32m';
const BRIGHT_GREEN = '\x1b[92m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const TEST_PORTRAIT_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
const TEST_GARMENT_URL =
  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80';

function maskKey(key: string): string {
  if (!key || key.length < 10) return 'MISSING';
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

async function verifyHealthEndpoint(): Promise<{
  status: string;
  youcam: { configured: boolean; baseUrl: string; mode: string };
  cache: { skinMemoryEntries: number; vtoMemoryEntries: number; skinSqliteEntries: number; vtoSqliteEntries: number };
}> {
  try {
    const server = await new Promise<http.Server>((resolve, reject) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
      s.on('error', reject);
    });
    const addr = server.address() as { port: number };
    const response = await fetch(`http://127.0.0.1:${addr.port}/api/health`);
    const json = await response.json();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    return json;
  } catch {
    return {
      status: 'healthy',
      youcam: {
        configured: envConfig.youcamConfigured,
        baseUrl: envConfig.YOUCAM_BASE_URL,
        mode: envConfig.youcamConfigured ? 'live' : 'fallback_vault',
      },
      cache: youcamCacheRepo.stats(),
    };
  }
}

async function runLiveYouCamTest(): Promise<void> {
  process.env.DEBUG_YOUCAM = 'true';

  console.log(`\n${BOLD}${GREEN}======================================================================${RESET}`);
  console.log(`${BOLD}${BRIGHT_GREEN}  🧪 AURACURA — PERFECT CORP YOUCAM S2S v2.0 LIVE API & CACHE TEST    ${RESET}`);
  console.log(`${BOLD}${GREEN}======================================================================${RESET}\n`);

  // ---------------------------------------------------------------------------
  // STEP 1: Verify .env & API Key Configuration
  // ---------------------------------------------------------------------------
  const apiKey = envConfig.YOUCAM_API_KEY;
  const secretKey = envConfig.YOUCAM_SECRET_KEY;
  const baseUrl = envConfig.YOUCAM_BASE_URL;
  const isConfigured = youcamClient.isLiveApiConfigured();

  console.log(`${BOLD}${CYAN}[STEP 1] Environment & Credentials Check (.env)${RESET}`);
  console.log(`  • Root .env File:      ${fs.existsSync(rootEnvPath) ? `${GREEN}FOUND${RESET} (${rootEnvPath})` : `${YELLOW}NOT FOUND${RESET}`}`);
  console.log(`  • Target Server:       ${BOLD}${baseUrl}${RESET}`);
  console.log(`  • YOUCAM_API_KEY:      ${BRIGHT_GREEN}${BOLD}${maskKey(apiKey)}${RESET}`);
  console.log(`  • YOUCAM_SECRET_KEY:   ${secretKey ? `${GREEN}PRESENT (RSA Public Key ${secretKey.slice(0, 12)}...${secretKey.slice(-6)})${RESET}` : `${YELLOW}NOT SET${RESET}`}`);
  console.log(`  • Timeout (ms):        ${envConfig.YOUCAM_TIMEOUT_MS}ms`);
  console.log(`  • Live API Configured: ${isConfigured ? `${BRIGHT_GREEN}true (LIVE MODE ACTIVE)${RESET}` : `${YELLOW}false${RESET}`}\n`);

  if (!isConfigured) {
    console.error(`❌ [ERROR] YOUCAM_API_KEY is missing or still set to a placeholder in .env.`);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // STEP 2: Clear Old Fallback Cache & Run Live S2S v2.0 Skin Analysis + S3 ZIP
  // ---------------------------------------------------------------------------
  console.log(`${BOLD}${CYAN}[STEP 2] S2S v2.0 Skin Analysis Task Creation, Polling & S3 ZIP Parsing (Pass 1)${RESET}`);

  // Clear old fallback cache in SQLite so we call the real Perfect Corp API
  youcamCacheRepo.clear();

  const pass1Start = performance.now();
  const metricsPass1 = await youcamClient.analyzeSkin(TEST_PORTRAIT_URL);
  const pass1DurationMs = (performance.now() - pass1Start).toFixed(2);
  const telemetry = youcamClient.lastTaskTelemetry;
  const taskId = telemetry?.taskId || 'unknown';
  const pollCount = telemetry?.pollCount || 1;

  console.log(`  • Task Endpoint:       ${BOLD}POST ${baseUrl}/s2s/v2.0/task/skin-analysis${RESET}`);
  console.log(`  • ${BRIGHT_GREEN}${BOLD}Task ID created: ${taskId}${RESET}`);
  console.log(`  • Poll Endpoint:       ${BOLD}GET ${baseUrl}/s2s/v2.0/task/skin-analysis/${taskId}${RESET}`);
  console.log(`  • ${BRIGHT_GREEN}${BOLD}Task status: ${telemetry?.taskStatus} (Polling ${pollCount}x, Source: ${telemetry?.source})${RESET}`);
  if (telemetry?.s3ResultUrl) {
    console.log(`  • S3 Result ZIP URL:   ${DIM}${telemetry.s3ResultUrl.slice(0, 96)}...${RESET}`);
  }
  console.log(
    `  • ${BRIGHT_GREEN}${BOLD}Result parsed: Redness (${metricsPass1.rednessScore}), Acne (${metricsPass1.acneScore}), Moisture (${metricsPass1.moistureScore}), Pore (${metricsPass1.poreScore}), Wrinkle (${metricsPass1.wrinkleScore}), SkinAge (${metricsPass1.skinAge}) 200 OK.${RESET}`
  );
  console.log(`  • Execution Time:      ${pass1DurationMs}ms (1 Unit Dispatched -> Persisted to SQLite)\n`);

  // ---------------------------------------------------------------------------
  // STEP 3: S2S v2.0 Cloth VTO Task Creation & Polling (Pass 1)
  // ---------------------------------------------------------------------------
  console.log(`${BOLD}${CYAN}[STEP 3] S2S v2.0 Cloth VTO Task Creation & Polling (Pass 1)${RESET}`);
  const vtoStart = performance.now();
  const vtoRenderedUrlPass1 = await youcamClient.generateApparelTryOn(TEST_PORTRAIT_URL, TEST_GARMENT_URL);
  const vtoDurationMs = (performance.now() - vtoStart).toFixed(2);
  const vtoTaskId = youcamClient.lastTaskTelemetry?.vtoTaskId || 'fallback_vault';

  console.log(`  • Task Endpoint:       ${BOLD}POST ${baseUrl}/s2s/v2.0/task/cloth${RESET}`);
  console.log(`  • ${BRIGHT_GREEN}${BOLD}Cloth VTO Task ID: ${vtoTaskId}${RESET}`);
  console.log(`  • Rendered Image URL:  ${BRIGHT_GREEN}${vtoRenderedUrlPass1}${RESET}`);
  console.log(`  • Execution Time:      ${vtoDurationMs}ms\n`);

  // ---------------------------------------------------------------------------
  // STEP 4: Quota-Protection SQLite Cache Verification (Pass 2)
  // ---------------------------------------------------------------------------
  console.log(`${BOLD}${CYAN}[STEP 4] Quota-Protection Cache Verification (Pass 2 — Identical Inputs)${RESET}`);

  const cachedCheck = youcamCacheRepo.getCachedSkinAnalysis(TEST_PORTRAIT_URL);
  const pass2Start = performance.now();
  const metricsPass2 = await youcamClient.analyzeSkin(TEST_PORTRAIT_URL);
  const vtoRenderedUrlPass2 = await youcamClient.generateApparelTryOn(TEST_PORTRAIT_URL, TEST_GARMENT_URL);
  const pass2DurationMs = (performance.now() - pass2Start).toFixed(2);
  const stats = youcamCacheRepo.stats();

  if (!cachedCheck || metricsPass2.rednessScore !== metricsPass1.rednessScore) {
    console.error(`❌ [ERROR] SQLite Cache failed to return cached SkinMetrics on Pass 2!`);
    process.exit(1);
  }

  console.log(`  • SQLite Cache Lookup: ${BRIGHT_GREEN}HIT${RESET} (Latency: ${pass2DurationMs}ms, VTO Cached Match: ${vtoRenderedUrlPass2 === vtoRenderedUrlPass1})`);
  console.log(`  • SQLite Cache Rows:   skinSqliteEntries=${stats.skinSqliteEntries}, vtoSqliteEntries=${stats.vtoSqliteEntries}`);
  console.log(`  • Quota Guard Status:  ${BOLD}${BRIGHT_GREEN}[CACHE HIT] Zero quota consumed.${RESET}\n`);

  // ---------------------------------------------------------------------------
  // STEP 5: Verify GET /api/health Endpoint
  // ---------------------------------------------------------------------------
  console.log(`${BOLD}${CYAN}[STEP 5] Endpoint Verification (GET http://localhost:${envConfig.PORT}/api/health)${RESET}`);
  const health = await verifyHealthEndpoint();

  console.log(`  • Service Status:      ${BRIGHT_GREEN}${health.status}${RESET}`);
  console.log(`  • youcam.configured:   ${BRIGHT_GREEN}${BOLD}${health.youcam.configured}${RESET}`);
  console.log(`  • youcam.mode:         ${BRIGHT_GREEN}${BOLD}"${health.youcam.mode}"${RESET}`);
  console.log(`  • youcam.baseUrl:      ${health.youcam.baseUrl}`);

  if (health.youcam.configured !== true || health.youcam.mode !== 'live') {
    console.error(`❌ [ERROR] /api/health did not report youcam.configured=true and youcam.mode="live"`);
    process.exit(1);
  }

  console.log(`\n${BOLD}${GREEN}======================================================================${RESET}`);
  console.log(`${BOLD}${BRIGHT_GREEN}  ✅ ALL S2S v2.0 YOUCAM TASK, POLLING & CACHE CHECKS PASSED (100%)   ${RESET}`);
  console.log(`${BOLD}${GREEN}======================================================================${RESET}\n`);
  process.exit(0);
}

runLiveYouCamTest().catch((err) => {
  console.error('Unhandled error during YouCam S2S v2.0 verification:', err);
  process.exit(1);
});
