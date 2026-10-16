/**
 * Task 3 Verification Suite
 * Verifies Dermatology Guardrail Engine (Rules 1-4) and the 4 MCP Tools
 * conforming to the Model Context Protocol standard.
 */

import { dermatologyGuardrailService } from '../src/services/dermatologyGuardrailService.js';
import { youcamSkinDiagnosticianTool } from '../src/tools/youcamSkinDiagnostician.js';
import { youcamVtoStylistTool } from '../src/tools/youcamVtoStylist.js';
import { formulationSafetyGuardrailTool } from '../src/tools/formulationSafetyGuardrail.js';
import { curateHolisticRegimenTool } from '../src/tools/curateHolisticRegimen.js';
import { CLINICAL_FALLBACK_PERSONAS } from '../src/services/clinicalSkinFallbackVault.js';
import type {
  SkinMetrics,
  ApparelVTOItem,
  SkincareStep,
  ConsumerBeautyProfile,
} from '../src/types/index.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTask3Verification() {
  console.log('\n======================================================');
  console.log('🧪 AURACURA TASK 3: DERMATOLOGY GUARDRAILS & MCP TOOLS');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // 1. DERMATOLOGY GUARDRAIL ENGINE: RULE 1 (COMEDOGENICITY)
  // -------------------------------------------------------------------------
  console.log('1. Testing Rule 1 (Comedogenic Audit):');
  const acneSkin: SkinMetrics = {
    acneScore: 75, // Severe acne
    rednessScore: 60,
    moistureScore: 50,
    poreScore: 70,
    wrinkleScore: 10,
    darkCircleScore: 20,
    skinAge: 25,
    chronologicalAge: 24,
    undertone: 'cool_fair',
    barrierStatus: 'compromised',
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

  const poreCloggingRegimen: SkincareStep[] = [
    ...safeRegimen,
    {
      stepNumber: 3,
      phase: 'evening',
      stepType: 'treat',
      productName: 'Heavy Coconut Night Balm',
      brand: 'Indie Organic',
      keyActives: ['Cocos Nucifera Oil (Coconut Oil)', 'Isopropyl Myristate'],
      comedogenicRating: 4,
      clinicalRationale: 'Deep moisture balm',
      priceUsd: 45,
    },
  ];

  const comedoSafeCheck = dermatologyGuardrailService.auditComedogenicity(acneSkin, safeRegimen);
  assert(comedoSafeCheck.status === 'pass', 'Safe regimen passes comedogenic audit for acne-prone skin');

  const comedoFailCheck = dermatologyGuardrailService.auditComedogenicity(acneSkin, poreCloggingRegimen);
  assert(comedoFailCheck.status === 'fail', 'High-comedogenic coconut oil/IPM fails comedogenic audit for acne-prone skin');
  assert(comedoFailCheck.detail.includes('Coconut Oil') || comedoFailCheck.detail.includes('Rating 4'), 'Comedogenic failure details identify offending ingredients');

  // -------------------------------------------------------------------------
  // 2. DERMATOLOGY GUARDRAIL ENGINE: RULE 2 (ACTIVE CLASH & BARRIER INTEGRITY)
  // -------------------------------------------------------------------------
  console.log('\n2. Testing Rule 2 (Active Ingredient Clash & Damaged Barrier):');
  const sarahProfile = CLINICAL_FALLBACK_PERSONAS['sarah-chen'].profile;
  const inflamedSkin: SkinMetrics = {
    ...acneSkin,
    rednessScore: 82, // Acute erythema
    barrierStatus: 'severely_damaged',
  };

  const harshAcidRegimen: SkincareStep[] = [
    {
      stepNumber: 1,
      phase: 'evening',
      stepType: 'treat',
      productName: 'Max Strength 1% Retinol Treatment in Denatured Alcohol',
      brand: 'Intense Clinical',
      keyActives: ['Pure Retinol 1%', 'Alcohol Denat 15%', 'Glycolic Acid 7%'],
      comedogenicRating: 1,
      clinicalRationale: 'Aggressive resurfacing',
      priceUsd: 85,
    },
  ];

  const activeFailCheck = dermatologyGuardrailService.auditActiveClashes(sarahProfile, inflamedSkin, harshAcidRegimen);
  assert(activeFailCheck.status === 'fail', 'Retinol, Glycolic Acid & Alcohol Denat fail barrier safety when barrier is severely damaged');
  assert(activeFailCheck.detail.includes('Contact Dermatitis') || activeFailCheck.detail.includes('Contraindicated harsh actives'), 'Active clash failure highlights chemical contact dermatitis hazard');

  const allergyRegimen: SkincareStep[] = [
    {
      stepNumber: 1,
      phase: 'morning',
      stepType: 'cleanse',
      productName: 'Botanical Fragranced Wash',
      brand: 'Botanica',
      keyActives: ['Natural Fragrance Essential Oil Blend'],
      comedogenicRating: 0,
      clinicalRationale: 'Aromatic cleansing',
      priceUsd: 25,
    },
  ];
  const allergyFailCheck = dermatologyGuardrailService.auditActiveClashes(sarahProfile, inflamedSkin, allergyRegimen);
  assert(allergyFailCheck.status === 'fail', 'Documented consumer allergy (Fragrance) triggers veto');

  const acidClashRegimen: SkincareStep[] = [
    {
      stepNumber: 1,
      phase: 'evening',
      stepType: 'treat',
      productName: 'BHA 2% Liquid Exfoliant',
      brand: 'Pore Cleanser',
      keyActives: ['Salicylic Acid 2%'],
      comedogenicRating: 0,
      clinicalRationale: 'BHA exfoliant',
      priceUsd: 35,
    },
    {
      stepNumber: 2,
      phase: 'evening',
      stepType: 'treat',
      productName: 'Gentle Granactive Retinoid 2%',
      brand: 'Youth Serum',
      keyActives: ['Hydroxypinacolone Retinoate (Retinoid)'],
      comedogenicRating: 0,
      clinicalRationale: 'Gentle retinoid',
      priceUsd: 40,
    },
  ];
  const acidClashWarnCheck = dermatologyGuardrailService.auditActiveClashes(sarahProfile, { ...inflamedSkin, barrierStatus: 'healthy', rednessScore: 30 }, acidClashRegimen);
  assert(acidClashWarnCheck.status === 'warn', 'Concurrent BHA + Retinoid in same sequence triggers active synergy caution warning');

  // -------------------------------------------------------------------------
  // 3. DERMATOLOGY GUARDRAIL ENGINE: RULE 3 (FABRIC FRICTION)
  // -------------------------------------------------------------------------
  console.log('\n3. Testing Rule 3 (Fabric Friction Micro-Abrasion):');
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

  const roughWoolApparel: ApparelVTOItem = {
    id: 'app-wool',
    name: 'Rough Coarse Wool Turtleneck',
    brand: 'Winter Knitwear',
    category: 'cocktail_dress',
    colorHex: '#333333',
    colorName: 'Charcoal',
    fabricComposition: ['80% Rough Wool', '20% Non-breathable Polyester'],
    chromaticHarmonyScore: 70,
    priceUsd: 320,
    productUrl: 'https://auracura.luxury',
    tryonImageUrl: 'https://example.com/vto-wool.jpg',
  };

  const silkFrictionCheck = dermatologyGuardrailService.auditFabricFriction(inflamedSkin, silkApparel);
  assert(silkFrictionCheck.status === 'pass', '100% Mulberry Silk passes tactile friction audit with low coefficient');

  const woolFrictionCheck = dermatologyGuardrailService.auditFabricFriction(inflamedSkin, roughWoolApparel);
  assert(woolFrictionCheck.status === 'fail', 'Rough Wool and non-breathable polyester fail on high-erythema skin');
  assert(woolFrictionCheck.detail.includes('Mechanical Friction Hazard'), 'Fabric friction failure details mechanical micro-tear hazard');

  // -------------------------------------------------------------------------
  // 4. DERMATOLOGY GUARDRAIL ENGINE: RULE 4 (CHROMATIC COLOR HARMONY)
  // -------------------------------------------------------------------------
  console.log('\n4. Testing Rule 4 (Chromatic Color Harmony):');
  const greenHarmony = dermatologyGuardrailService.computeChromaticHarmony(inflamedSkin, silkApparel);
  assert(greenHarmony.score >= 95, `Sage Green on acute erythema scores >= 95 (got ${greenHarmony.score})`);
  assert(greenHarmony.rationale.includes('Optical Cancellation') || greenHarmony.rationale.includes('erythema'), 'Optical wavelength cancellation rationale generated for Sage Green');

  const redApparel: ApparelVTOItem = {
    ...silkApparel,
    colorHex: '#FF0033',
    colorName: 'Vibrant Scarlet Crimson',
  };
  const redHarmony = dermatologyGuardrailService.computeChromaticHarmony(inflamedSkin, redApparel);
  assert(redHarmony.score <= 50, `Scarlet Red on acute erythema is penalized <= 50 (got ${redHarmony.score})`);
  assert(redHarmony.rationale.includes('Chromatic Echo') || redHarmony.rationale.includes('amplify'), 'Chromatic echo warning generated against red garments on inflamed skin');

  const navyApparel: ApparelVTOItem = {
    ...silkApparel,
    colorHex: '#1B263B',
    colorName: 'Midnight Deep Navy',
    category: 'business_blazer',
  };
  const dehydratedSkin: SkinMetrics = {
    ...acneSkin,
    moistureScore: 28,
    wrinkleScore: 68,
    rednessScore: 32,
  };
  const navyHarmony = dermatologyGuardrailService.computeChromaticHarmony(dehydratedSkin, navyApparel);
  assert(navyHarmony.score >= 90, `Midnight Navy on dehydrated complexion scores >= 90 (got ${navyHarmony.score})`);

  // -------------------------------------------------------------------------
  // 5. MCP TOOLS COMPLIANCE & EXECUTION
  // -------------------------------------------------------------------------
  console.log('\n5. Testing 4 MCP Tools Schema & Handlers:');

  // Tool 1: youcam_skin_diagnostician
  assert(youcamSkinDiagnosticianTool.definition.name === 'youcam_skin_diagnostician', 'Tool 1 name is youcam_skin_diagnostician');
  assert(Array.isArray(youcamSkinDiagnosticianTool.definition.inputSchema.required), 'Tool 1 defines required inputSchema array');
  const diagResult = await youcamSkinDiagnosticianTool.handler({
    imageUrl: 'https://images.unsplash.com/sarah-chen-crisis.jpg',
    consumerId: 'sarah-chen',
  });
  assert(diagResult.skinMetrics.acneScore === 74, 'Tool 1 handler returned diagnostic metrics');
  assert(diagResult.primaryConcerns.length > 0, 'Tool 1 identified clinical concerns');
  assert(diagResult.barrierIntegrityAlert !== null, 'Tool 1 flagged severe barrier integrity alert');

  // Tool 2: youcam_vto_stylist
  assert(youcamVtoStylistTool.definition.name === 'youcam_vto_stylist', 'Tool 2 name is youcam_vto_stylist');
  const vtoResult = await youcamVtoStylistTool.handler({
    personImageUrl: 'https://images.unsplash.com/selfie.jpg',
    garmentImageUrl: 'https://images.unsplash.com/gown.jpg',
    garmentCategory: 'evening_gown',
    garmentColorHex: '#8A9A86',
    garmentColorName: 'Sage Green',
    fabricComposition: ['100% Organic Mulberry Silk'],
    rednessScore: 82,
    skinUndertone: 'cool_fair',
  });
  assert(vtoResult.tryonImageUrl.includes('unsplash.com'), 'Tool 2 generated simulated try-on URL');
  assert(vtoResult.chromaticHarmonyScore >= 95, 'Tool 2 calculated chromatic harmony score >= 95 for Sage Green');
  assert(vtoResult.fabricFrictionVerdict.includes('Clearance') || vtoResult.fabricFrictionVerdict.includes('0.15'), 'Tool 2 evaluated fabric friction verdict');

  // Tool 3: formulation_safety_guardrail
  assert(formulationSafetyGuardrailTool.definition.name === 'formulation_safety_guardrail', 'Tool 3 name is formulation_safety_guardrail');
  const auditOutput = await formulationSafetyGuardrailTool.handler({
    consumerId: 'sarah-chen',
    skinMetrics: inflamedSkin,
    apparel: silkApparel,
    skincareRegimen: safeRegimen,
  });
  assert(auditOutput.isSafe === true, 'Tool 3 approved safe silk + ceramide formulation');
  assert(auditOutput.checks.length === 4, 'Tool 3 evaluated all 4 multi-vector checks');

  // Tool 4: curate_holistic_regimen
  assert(curateHolisticRegimenTool.definition.name === 'curate_holistic_regimen', 'Tool 4 name is curate_holistic_regimen');
  const holisticResult = await curateHolisticRegimenTool.handler({
    consumerId: 'sarah-chen',
    eventContext: 'Black Tie Charity Gala at SF MOMA',
    budgetUsd: 1200,
  });
  assert(holisticResult.dossier !== undefined, 'Tool 4 synthesized complete AuraCuraDossier');
  assert(holisticResult.dossier.executionMode === 'auracura_grounded', 'Tool 4 executionMode is auracura_grounded');
  assert(holisticResult.dossier.skincareRegimen.length === 5, 'Tool 4 generated 5 diurnal AM/PM skincare steps');
  assert(holisticResult.dossier.safetyAudit.isSafe === true, 'Tool 4 dossier safetyAudit is certified safe');
  assert(holisticResult.shoppingCartSummary.totalCostUsd <= 1200, 'Tool 4 shopping cart complies with budget cap');

  console.log('\n======================================================');
  console.log(`📊 TASK 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTask3Verification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
