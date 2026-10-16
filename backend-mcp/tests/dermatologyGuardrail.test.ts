import { describe, it, expect } from 'vitest';
import { dermatologyGuardrailService } from '../src/services/dermatologyGuardrailService.js';
import { CLINICAL_FALLBACK_PERSONAS } from '../src/services/clinicalSkinFallbackVault.js';
import type {
  SkinMetrics,
  ApparelVTOItem,
  SkincareStep,
} from '../src/types/index.js';

describe('DermatologyGuardrailService (Rules 1-4)', () => {
  const acneSkin: SkinMetrics = {
    acneScore: 75,
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

  describe('Rule 1: Comedogenicity Audit', () => {
    it('passes safe low-comedogenic ingredients for acne-prone skin', () => {
      const result = dermatologyGuardrailService.auditComedogenicity(acneSkin, safeRegimen);
      expect(result.status).toBe('pass');
    });

    it('fails pore-clogging ingredients (Coconut oil, Isopropyl Myristate) for acne-prone skin', () => {
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

      const result = dermatologyGuardrailService.auditComedogenicity(acneSkin, poreCloggingRegimen);
      expect(result.status).toBe('fail');
      expect(result.detail).toMatch(/Coconut Oil|Rating 4/i);
    });
  });

  describe('Rule 2: Active Clashes & Damaged Barrier Integrity', () => {
    const sarahProfile = CLINICAL_FALLBACK_PERSONAS['sarah-chen'].profile;
    const inflamedSkin: SkinMetrics = {
      ...acneSkin,
      rednessScore: 82,
      barrierStatus: 'severely_damaged',
    };

    it('fails aggressive retinoids and alcohol denat when barrier is severely damaged', () => {
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

      const result = dermatologyGuardrailService.auditActiveClashes(sarahProfile, inflamedSkin, harshAcidRegimen);
      expect(result.status).toBe('fail');
      expect(result.detail).toMatch(/Contact Dermatitis|Contraindicated harsh actives/i);
    });

    it('vetoes ingredients matching consumer allergies (e.g. Fragrance)', () => {
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

      const result = dermatologyGuardrailService.auditActiveClashes(sarahProfile, inflamedSkin, allergyRegimen);
      expect(result.status).toBe('fail');
      expect(result.detail).toMatch(/Fragrance/i);
    });

    it('generates a warning when concurrent BHA + Retinoid are used in the same sequence', () => {
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

      const result = dermatologyGuardrailService.auditActiveClashes(
        sarahProfile,
        { ...inflamedSkin, barrierStatus: 'healthy', rednessScore: 30 },
        acidClashRegimen
      );
      expect(result.status).toBe('warn');
      expect(result.detail).toMatch(/synergy|BHA.*Retinoid/i);
    });
  });

  describe('Rule 3: Fabric Friction Micro-Abrasion', () => {
    const inflamedSkin: SkinMetrics = {
      ...acneSkin,
      rednessScore: 82,
      barrierStatus: 'severely_damaged',
    };

    it('passes hypoallergenic mulberry silk on inflamed barrier', () => {
      const result = dermatologyGuardrailService.auditFabricFriction(inflamedSkin, silkApparel);
      expect(result.status).toBe('pass');
    });

    it('fails rough wool and coarse synthetic fabrics on inflamed skin', () => {
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

      const result = dermatologyGuardrailService.auditFabricFriction(inflamedSkin, roughWoolApparel);
      expect(result.status).toBe('fail');
      expect(result.detail).toMatch(/Mechanical Friction Hazard/i);
    });
  });

  describe('Rule 4: Chromatic Color Harmony', () => {
    const inflamedSkin: SkinMetrics = {
      ...acneSkin,
      rednessScore: 82,
      barrierStatus: 'severely_damaged',
    };

    it('awards high harmony score (>= 95) for Sage Green on acute erythema', () => {
      const result = dermatologyGuardrailService.computeChromaticHarmony(inflamedSkin, silkApparel);
      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.rationale).toMatch(/Optical Cancellation|erythema/i);
    });

    it('penalizes red garments (<= 50) on inflamed erythema skin to prevent chromatic echoing', () => {
      const redApparel: ApparelVTOItem = {
        ...silkApparel,
        colorHex: '#FF0033',
        colorName: 'Vibrant Scarlet Crimson',
      };

      const result = dermatologyGuardrailService.computeChromaticHarmony(inflamedSkin, redApparel);
      expect(result.score).toBeLessThanOrEqual(50);
      expect(result.rationale).toMatch(/Chromatic Echo|amplify/i);
    });

    it('computes comprehensive full audit report cleanly', () => {
      const sarah = CLINICAL_FALLBACK_PERSONAS['sarah-chen'];
      const audit = dermatologyGuardrailService.auditDermatologySafety(
        sarah.profile,
        sarah.skinMetrics,
        sarah.recommendedApparel,
        safeRegimen
      );

      expect(audit).toBeDefined();
      expect(audit.isSafe).toBe(true);
      expect(audit.checks.length).toBeGreaterThanOrEqual(4);
    });
  });
});
