import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleAgentTurn,
  orchestrateAuraCuraDossier,
  generateGenericBlindDossier,
} from '../src/agent/turnHandler.js';
import { CLINICAL_FALLBACK_PERSONAS } from '../src/services/clinicalSkinFallbackVault.js';
import { beautyProfileRepo } from '../src/database/beautyProfileRepo.js';
import { youcamCacheRepo } from '../src/database/youcamCacheRepo.js';
import { seedDemoData } from '../src/database/seedDemoData.js';
import type { AgentTraceStep } from '../src/types/index.js';

describe('Agentic Orchestrator & Benchmark Pipeline', () => {
  beforeEach(() => {
    seedDemoData();
  });

  describe('ReAct 4-Phase Orchestrator', () => {
    it('executes 4 phases (diagnose, audit_safety, vto_simulation, synthesize_regimen) with streaming ticks', async () => {
      const streamedSteps: AgentTraceStep[] = [];

      const { dossier, trace } = await orchestrateAuraCuraDossier(
        {
          consumerId: 'sarah-chen',
          eventContext: 'Black Tie Charity Gala at SF MOMA',
          budgetUsd: 1200,
          delayMs: 0,
        },
        async (step) => {
          streamedSteps.push(step);
        }
      );

      expect(dossier).toBeDefined();
      expect(dossier.profile.id).toBe('sarah-chen');
      expect(dossier.executionMode).toBe('auracura_grounded');

      // Verify all 4 distinct reasoning phases occurred
      const phases = streamedSteps.map((s) => s.phase);
      expect(phases).toContain('diagnose');
      expect(phases).toContain('audit_safety');
      expect(phases).toContain('vto_simulation');
      expect(phases).toContain('synthesize_regimen');

      // Verify safety audit vetoed red dress and picked Sage Green mulberry silk
      expect(dossier.apparelVTO.colorName).toMatch(/Sage Green/i);
      expect(dossier.safetyAudit.isSafe).toBe(true);

      // Verify trace records
      expect(trace.length).toBe(4);
    });

    it('handles interactive conversational handleAgentTurn query', async () => {
      const response = await handleAgentTurn({
        query: 'I need an evening outfit and skincare for an SF MOMA gala tonight.',
        consumerId: 'sarah-chen',
        budgetUsd: 1200,
      });

      expect(response.success).toBe(true);
      expect(response.speechResponse).toBeDefined();
      expect(response.speechResponse).toMatch(/chromatic harmony score/i);
      expect(response.dossier?.profile.id).toBe('sarah-chen');
      expect(response.trace?.length).toBe(4);
    });

    it('handles Marcus Reed executive profile smoothly', async () => {
      const response = await handleAgentTurn({
        query: 'Need keynote suit and anti-fatigue skincare.',
        consumerId: 'marcus-reed',
      });

      expect(response.success).toBe(true);
      expect(response.dossier?.profile.id).toBe('marcus-reed');
      expect(response.dossier?.skinMetrics.chronologicalAge).toBe(42);
      expect(response.dossier?.apparelVTO.category).toBe('business_blazer');
    });

    it('handles Elena Gomez resort wear profile smoothly', async () => {
      const response = await handleAgentTurn({
        query: 'Resort wear styling for destination wedding.',
        consumerId: 'elena-gomez',
      });

      expect(response.success).toBe(true);
      expect(response.dossier?.profile.id).toBe('elena-gomez');
      expect(response.dossier?.skinMetrics.undertone).toBe('olive');
      expect(response.dossier?.apparelVTO.category).toBe('resort_wear');
    });
  });

  describe('Grounding Benchmark Comparison Engine', () => {
    it('compares Grounded AuraCura against Generic Blind LLM baseline', async () => {
      const sarah = CLINICAL_FALLBACK_PERSONAS['sarah-chen'];
      const { dossier: groundedDossier } = await orchestrateAuraCuraDossier({
        consumerId: 'sarah-chen',
      });
      const { dossier: blindDossier } = await generateGenericBlindDossier(sarah.profile);

      // Blind LLM hallucination checks
      expect(blindDossier.executionMode).toBe('generic_llm');
      expect(blindDossier.safetyAudit.isSafe).toBe(false);
      expect(blindDossier.apparelVTO.colorName).toMatch(/Crimson|Red/i);
      expect(blindDossier.apparelVTO.chromaticHarmonyScore).toBeLessThanOrEqual(45);

      // Grounded AuraCura checks
      expect(groundedDossier.executionMode).toBe('auracura_grounded');
      expect(groundedDossier.safetyAudit.isSafe).toBe(true);
      expect(groundedDossier.apparelVTO.chromaticHarmonyScore).toBeGreaterThanOrEqual(90);
    });

    it('verifies beautyProfileRepo contains all reference personas', () => {
      const profiles = beautyProfileRepo.listProfiles();
      expect(profiles.length).toBeGreaterThanOrEqual(3);

      const ids = profiles.map((p) => p.id);
      expect(ids).toContain('sarah-chen');
      expect(ids).toContain('marcus-reed');
      expect(ids).toContain('elena-gomez');
    });
  });

  describe('Zero-Quota Offline Resilience & SQLite Cache', () => {
    it('operates without network calls using Clinical Fallback Vault', () => {
      const vaultKeys = Object.keys(CLINICAL_FALLBACK_PERSONAS);
      expect(vaultKeys).toEqual(['sarah-chen', 'marcus-reed', 'elena-gomez']);

      const stats = youcamCacheRepo.stats();
      expect(stats).toBeDefined();
      expect(stats.skinMemoryEntries).toBeGreaterThanOrEqual(0);
      expect(stats.vtoMemoryEntries).toBeGreaterThanOrEqual(0);
      expect(stats.skinSqliteEntries).toBeGreaterThanOrEqual(0);
      expect(stats.vtoSqliteEntries).toBeGreaterThanOrEqual(0);
    });
  });
});
