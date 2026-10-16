import { describe, it, expect } from 'vitest';
import { youcamSkinDiagnosticianTool } from '../src/tools/youcamSkinDiagnostician.js';
import { youcamVtoStylistTool } from '../src/tools/youcamVtoStylist.js';
import { formulationSafetyGuardrailTool } from '../src/tools/formulationSafetyGuardrail.js';
import { curateHolisticRegimenTool } from '../src/tools/curateHolisticRegimen.js';
import { CLINICAL_FALLBACK_PERSONAS } from '../src/services/clinicalSkinFallbackVault.js';
import type { ApparelVTOItem, SkincareStep } from '../src/types/index.js';

describe('Model Context Protocol (MCP) Tools', () => {
  const sarah = CLINICAL_FALLBACK_PERSONAS['sarah-chen'];
  const silkApparel: ApparelVTOItem = {
    id: 'app-silk',
    name: 'Mulberry Silk Column Gown',
    brand: 'Aura Atelier',
    category: 'evening_gown',
    colorHex: '#8A9A86',
    colorName: 'Sage Green',
    fabricComposition: ['100% Organic Mulberry Silk'],
    chromaticHarmonyScore: 95,
    priceUsd: 680,
    productUrl: 'https://auracura.luxury',
    tryonImageUrl: 'https://example.com/vto-silk.jpg',
  };

  const safeRegimen: SkincareStep[] = [
    {
      stepNumber: 1,
      phase: 'morning',
      stepType: 'cleanse',
      productName: 'Gentle Foaming Gel',
      brand: 'Clinical Pure',
      keyActives: ['Glycerin', 'Panthenol'],
      comedogenicRating: 0,
      clinicalRationale: 'Gentle pH-balanced wash',
      priceUsd: 30,
    },
    {
      stepNumber: 2,
      phase: 'morning',
      stepType: 'barrier_repair',
      productName: 'Pure Squalane Barrier Emulsion',
      brand: 'Clinical Pure',
      keyActives: ['Sugarcane Squalane', 'Ceramide NP'],
      comedogenicRating: 1,
      clinicalRationale: 'Restores intercellular lipids without follicular occlusion',
      priceUsd: 55,
    },
  ];

  it('youcam_skin_diagnostician analyzes skin and returns 14 clinical metrics', async () => {
    expect(youcamSkinDiagnosticianTool.definition.name).toBe('youcam_skin_diagnostician');
    expect(Array.isArray(youcamSkinDiagnosticianTool.definition.inputSchema.required)).toBe(true);

    const result = await youcamSkinDiagnosticianTool.handler({
      imageUrl: 'https://images.unsplash.com/sarah-chen-crisis.jpg',
      consumerId: 'sarah-chen',
    });

    expect(result).toBeDefined();
    expect(result.skinMetrics.acneScore).toBe(74);
    expect(result.skinMetrics.rednessScore).toBe(82);
    expect(result.primaryConcerns.length).toBeGreaterThan(0);
    expect(result.barrierIntegrityAlert).not.toBeNull();
  });

  it('youcam_vto_stylist simulates try-on and computes chromatic harmony', async () => {
    expect(youcamVtoStylistTool.definition.name).toBe('youcam_vto_stylist');

    const result = await youcamVtoStylistTool.handler({
      personImageUrl: 'https://images.unsplash.com/selfie.jpg',
      garmentImageUrl: 'https://images.unsplash.com/gown.jpg',
      garmentCategory: 'evening_gown',
      garmentColorHex: '#8A9A86',
      garmentColorName: 'Sage Green',
      fabricComposition: ['100% Organic Mulberry Silk'],
      rednessScore: 82,
      skinUndertone: 'cool_fair',
    });

    expect(result).toBeDefined();
    expect(result.tryonImageUrl).toContain('unsplash.com');
    expect(result.chromaticHarmonyScore).toBeGreaterThanOrEqual(95);
    expect(result.fabricFrictionVerdict).toMatch(/Clearance|0\.15/);
  });

  it('formulation_safety_guardrail executes 4-vector safety audit', async () => {
    expect(formulationSafetyGuardrailTool.definition.name).toBe('formulation_safety_guardrail');

    const result = await formulationSafetyGuardrailTool.handler({
      consumerId: 'sarah-chen',
      skinMetrics: sarah.skinMetrics,
      apparel: silkApparel,
      skincareRegimen: safeRegimen,
    });

    expect(result.isSafe).toBe(true);
    expect(result.checks.length).toBe(4);
  });

  it('curate_holistic_regimen synthesizes complete grounded dossier and cart', async () => {
    expect(curateHolisticRegimenTool.definition.name).toBe('curate_holistic_regimen');

    const result = await curateHolisticRegimenTool.handler({
      consumerId: 'sarah-chen',
      eventContext: 'Black Tie Charity Gala at SF MOMA',
      budgetUsd: 1200,
    });

    expect(result.dossier).toBeDefined();
    expect(result.dossier.executionMode).toBe('auracura_grounded');
    expect(result.dossier.skincareRegimen.length).toBe(5);
    expect(result.dossier.safetyAudit.isSafe).toBe(true);
    expect(result.shoppingCartSummary.totalCostUsd).toBeLessThanOrEqual(1200);
  });
});
