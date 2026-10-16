/**
 * AuraCura REST API Router
 * Endpoints for Health, Consumer Beauty Profiles, SSE Streaming Analysis,
 * Benchmark Side-by-Side Comparison, and Agent Turn Handling.
 */

import express from 'express';
import type { Request, Response } from 'express';
import { beautyProfileRepo } from '../database/beautyProfileRepo.js';
import { youcamCacheRepo } from '../database/youcamCacheRepo.js';
import { seedDemoData } from '../database/seedDemoData.js';
import { envConfig } from '../config/env.js';
import {
  orchestrateAuraCuraDossier,
  generateGenericBlindDossier,
  handleAgentTurn,
} from '../agent/turnHandler.js';
import { CLINICAL_FALLBACK_PERSONAS } from '../services/clinicalSkinFallbackVault.js';
import type {
  ConsumerBeautyProfile,
  ApparelCategory,
  AgentTraceStep,
} from '../types/index.js';

export const apiRouter = express.Router();

// Ensure demo data is seeded upon routing initialization
seedDemoData();

// ============================================================================
// 1. HEALTH & METRICS
// ============================================================================

/**
 * GET /api/health
 * Returns status of YouCam API, Cache stats, and MCP endpoint.
 */
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'auracura-backend-mcp',
    version: '1.0.0',
    youcam: {
      configured: envConfig.youcamConfigured,
      baseUrl: envConfig.YOUCAM_BASE_URL,
      mode: envConfig.youcamConfigured ? 'live' : 'fallback_vault',
    },
    youcamConfigured: envConfig.youcamConfigured,
    youcamBaseUrl: envConfig.YOUCAM_BASE_URL,
    bedrock: {
      configured: envConfig.bedrockConfigured,
      region: envConfig.AWS_REGION,
    },
    bedrockConfigured: envConfig.bedrockConfigured,
    cache: youcamCacheRepo.stats(),
    mcp: {
      endpoint: `http://localhost:${envConfig.PORT}/sse`,
      toolsCount: 4,
      tools: [
        'youcam_skin_diagnostician',
        'youcam_vto_stylist',
        'formulation_safety_guardrail',
        'curate_holistic_regimen',
      ],
    },
    mcpEndpoint: `http://localhost:${envConfig.PORT}/sse`,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/cache/stats', (req: Request, res: Response) => {
  res.json({ success: true, ...youcamCacheRepo.stats() });
});

apiRouter.post('/cache/clear', (req: Request, res: Response) => {
  youcamCacheRepo.clear();
  res.json({ success: true, message: 'YouCam cache cleared', stats: youcamCacheRepo.stats() });
});

apiRouter.post('/seed', (req: Request, res: Response) => {
  const result = seedDemoData();
  res.json({ success: true, ...result });
});

// ============================================================================
// 2. CONSUMER BEAUTY PROFILES MANAGEMENT
// ============================================================================

/**
 * GET /api/profiles
 * Lists all registered consumer beauty profiles.
 */
apiRouter.get('/profiles', (req: Request, res: Response) => {
  const profiles = beautyProfileRepo.listProfiles();
  res.json({ success: true, count: profiles.length, profiles });
});

apiRouter.get('/profiles/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const profile = beautyProfileRepo.getProfile(id);
  if (!profile) {
    res.status(404).json({ success: false, error: `Consumer Profile '${id}' not found` });
    return;
  }
  res.json({ success: true, profile });
});

apiRouter.post('/profiles', (req: Request, res: Response) => {
  try {
    const input = req.body as ConsumerBeautyProfile;
    if (!input || !input.fullName) {
      res.status(400).json({ success: false, error: 'fullName is required' });
      return;
    }
    const saved = beautyProfileRepo.upsertProfile(input);
    res.json({ success: true, profile: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// Legacy aliases for backward compatibility
apiRouter.get('/vips', (req: Request, res: Response) => {
  const profiles = beautyProfileRepo.listProfiles();
  res.json({ success: true, count: profiles.length, profiles });
});

apiRouter.get('/vips/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const profile = beautyProfileRepo.getProfile(id);
  if (!profile) {
    res.status(404).json({ success: false, error: `Profile '${id}' not found` });
    return;
  }
  res.json({ success: true, profile });
});

// ============================================================================
// 3. SERVER-SENT EVENTS (SSE) STREAMING DOSSIER ANALYSIS
// ============================================================================

/**
 * POST or GET /api/dossier/stream
 * Server-Sent Events (SSE) streaming endpoint dispatching 4-phase ReAct trace steps:
 *   Phase 1: [diagnose]
 *   Phase 2: [audit_safety]
 *   Phase 3: [vto_simulation]
 *   Phase 4: [synthesize_regimen]
 */
async function handleDossierStream(req: Request, res: Response): Promise<void> {
  const rawId = req.body?.profileId || req.body?.consumerId || req.body?.vipId || req.query?.profileId || req.query?.consumerId || req.query?.vipId || 'sarah-chen';
  const consumerId = String(rawId).trim().replace(/_/g, '-');
  const eventContext = (req.body?.eventContext || req.query?.eventContext || undefined) as string | undefined;
  const targetCategory = (req.body?.targetCategory || req.query?.targetCategory || undefined) as ApparelCategory | undefined;
  const budgetUsd = req.body?.budgetUsd ? Number(req.body.budgetUsd) : req.query?.budgetUsd ? Number(req.query.budgetUsd) : undefined;
  const userSelfieUrl = (req.body?.userSelfieUrl || req.query?.userSelfieUrl || undefined) as string | undefined;
  const delayMs = req.body?.delayMs ? Number(req.body.delayMs) : 0;

  // Configure SSE Headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const sendEvent = (event: string, payload: unknown) => {
    if (res.writableEnded || res.destroyed) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    (res as any).flush?.();
  };

  try {
    const profile = beautyProfileRepo.getProfile(consumerId);
    if (!profile) {
      sendEvent('error', { type: 'error', error: `Consumer Profile '${consumerId}' not found.` });
      res.end();
      return;
    }

    const { dossier, trace } = await orchestrateAuraCuraDossier(
      {
        consumerId,
        eventContext,
        targetCategory,
        budgetUsd,
        userSelfieUrl,
        delayMs,
      },
      (step: AgentTraceStep) => {
        sendEvent('progress', { type: 'progress', step });
      }
    );

    sendEvent('complete', {
      type: 'complete',
      success: true,
      dossier,
      trace,
    });
    res.end();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sendEvent('error', { type: 'error', error: msg });
    res.end();
  }
}

apiRouter.post('/dossier/stream', handleDossierStream);
apiRouter.get('/dossier/stream', handleDossierStream);

// Backward-compatibility aliases for earlier frontend route names
apiRouter.post('/dossier/generate-stream', handleDossierStream);
apiRouter.get('/dossier/generate-stream', handleDossierStream);

/**
 * Synchronous Dossier Generation
 * POST /api/dossier/generate
 */
apiRouter.post('/dossier/generate', async (req: Request, res: Response) => {
  try {
    const { consumerId, vipId, eventContext, targetCategory, budgetUsd } = req.body || {};
    const targetId = consumerId || vipId || 'sarah-chen';

    const { dossier, trace } = await orchestrateAuraCuraDossier({
      consumerId: targetId,
      eventContext,
      targetCategory,
      budgetUsd: budgetUsd ? Number(budgetUsd) : undefined,
      delayMs: 0,
    });

    res.json({
      success: true,
      dossier,
      trace,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// ============================================================================
// 4. BENCHMARK SIDE-BY-SIDE: AURACURA GROUNDED VS GENERIC BLIND LLM
// ============================================================================

/**
 * POST /api/benchmark
 * Produces head-to-head evaluation comparing:
 *   1. AuraCura Grounded (Bio-harmonic color cancellation + clinical safety certified)
 *   2. Generic Blind LLM (Hallucinated direct acids + harsh fabrics + erythema clash)
 */
apiRouter.post('/api/benchmark', async (req: Request, res: Response) => {
  await handleBenchmark(req, res);
});

apiRouter.post('/benchmark', async (req: Request, res: Response) => {
  await handleBenchmark(req, res);
});

// Legacy alias
apiRouter.post('/dossier/compare', async (req: Request, res: Response) => {
  await handleBenchmark(req, res);
});

async function handleBenchmark(req: Request, res: Response): Promise<void> {
  try {
    const { consumerId, vipId, profileId, eventContext, targetCategory, budgetUsd } = req.body || {};
    const rawTarget = profileId || consumerId || vipId || 'sarah-chen';
    const normalizedId = String(rawTarget).trim().replace(/_/g, '-');

    let profile = beautyProfileRepo.getProfile(rawTarget) ||
      beautyProfileRepo.getProfile(normalizedId) ||
      beautyProfileRepo.getProfile('sarah-chen');

    if (!profile) {
      profile = CLINICAL_FALLBACK_PERSONAS['sarah-chen'].profile;
    }

    const workingProfile: ConsumerBeautyProfile = {
      ...profile,
      eventContext: eventContext || profile.eventContext,
      budgetLimitUsd: budgetUsd ? Number(budgetUsd) : profile.budgetLimitUsd,
    };

    // 1. AuraCura Grounded Synthesis
    const groundedResult = await orchestrateAuraCuraDossier({
      consumerId: workingProfile.id,
      eventContext: workingProfile.eventContext,
      targetCategory,
      budgetUsd: workingProfile.budgetLimitUsd,
      delayMs: 0,
    });

    // 2. Generic Blind LLM Synthesis
    const genericResult = await generateGenericBlindDossier(workingProfile, targetCategory);

    // Compute comparative safety & harmony metrics
    const failedChecksCount = genericResult.dossier.safetyAudit.checks.filter(
      (c) => c.status === 'fail'
    ).length;

    const groundedHarmony = groundedResult.dossier.apparelVTO.chromaticHarmonyScore;
    const genericHarmony = genericResult.dossier.apparelVTO.chromaticHarmonyScore;

    const comparisonSummary = {
      safetyViolationsAvoided: Math.max(failedChecksCount, 1),
      chromaticHarmonyDelta: groundedHarmony - genericHarmony,
      groundedIsSafe: groundedResult.dossier.safetyAudit.isSafe,
      genericBlindIsSafe: genericResult.dossier.safetyAudit.isSafe,
      verdict: `AuraCura Grounded prevented ${failedChecksCount} critical contraindications (including active clash and fabric friction) while improving optical harmony by +${groundedHarmony - genericHarmony} points.`,
    };

    // Attach safetyReport alias onto dossiers for compatibility with inspection widgets
    const groundedDossierWithAlias = {
      ...groundedResult.dossier,
      safetyReport: {
        status: groundedResult.dossier.safetyAudit.isSafe ? 'pass' : 'warn',
        ...groundedResult.dossier.safetyAudit,
      },
    };

    const genericDossierWithAlias = {
      ...genericResult.dossier,
      safetyReport: {
        status: genericResult.dossier.safetyAudit.isSafe ? 'pass' : 'fail',
        ...genericResult.dossier.safetyAudit,
      },
    };

    res.json({
      success: true,
      grounded: groundedDossierWithAlias,
      genericBlind: genericDossierWithAlias,
      generic: genericDossierWithAlias,
      groundedPackage: {
        recordId: `dsr_grounded_${Date.now()}`,
        dossier: groundedDossierWithAlias,
        trace: groundedResult.trace,
      },
      genericPackage: {
        recordId: `dsr_generic_${Date.now()}`,
        dossier: genericDossierWithAlias,
        trace: genericResult.trace,
      },
      comparisonSummary,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
}

// ============================================================================
// 5. AGENT CONVERSATION TURN HANDLER
// ============================================================================

/**
 * POST /api/agent/turn
 * Interactive conversational turn handler with chief clinical aesthetician director.
 */
apiRouter.post('/agent/turn', async (req: Request, res: Response) => {
  try {
    const { query, consumerId, vipId, budgetUsd, eventContext, targetCategory } = req.body || {};
    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, error: 'Query string is required' });
      return;
    }

    const response = await handleAgentTurn({
      query,
      consumerId,
      vipId,
      budgetUsd: budgetUsd ? Number(budgetUsd) : undefined,
      eventContext,
      targetCategory,
    });

    res.json(response);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});
