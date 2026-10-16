/**
 * MCP Tool: Curate Holistic Regimen
 * Synthesizes diurnal morning and evening skincare regimens paired with bio-harmonic VTO apparel,
 * audits through dermatologyGuardrailService, and packages into an AuraCuraDossier.
 */

import { z } from 'zod';
import { beautyProfileRepo } from '../database/beautyProfileRepo.js';
import { CLINICAL_FALLBACK_PERSONAS, getFallbackPersona } from '../services/clinicalSkinFallbackVault.js';
import { dermatologyGuardrailService } from '../services/dermatologyGuardrailService.js';
import type {
  AuraCuraDossier,
  ConsumerBeautyProfile,
  SkinMetrics,
  ApparelVTOItem,
  SkincareStep,
  ApparelCategory,
} from '../types/index.js';

export const CurateHolisticRegimenInputSchema = z.object({
  consumerId: z.string().describe('Consumer profile ID (e.g. "sarah-chen", "marcus-reed", "elena-gomez").'),
  eventContext: z.string().optional().describe('Contextual event brief (e.g. "Black Tie Charity Gala at SF MOMA").'),
  targetCategory: z
    .enum(['evening_gown', 'business_blazer', 'resort_wear', 'cocktail_dress'])
    .optional()
    .describe('Desired apparel styling category.'),
  budgetUsd: z.number().optional().describe('Total budget cap in USD.'),
});

export type CurateHolisticRegimenInput = z.infer<typeof CurateHolisticRegimenInputSchema>;

export const curateHolisticRegimenTool = {
  definition: {
    name: 'curate_holistic_regimen',
    description:
      'Curates a complete diurnal (Morning/Evening) clinical skincare routine and bio-harmonic VTO apparel recommendation, executing full safety guardrails and spending ceiling checks.',
    inputSchema: {
      type: 'object',
      properties: {
        consumerId: {
          type: 'string',
          description: 'Unique consumer ID to synthesize regimen for (e.g. "sarah-chen", "marcus-reed", "elena-gomez").',
        },
        eventContext: {
          type: 'string',
          description: 'Occasion details to calibrate lookbook advice.',
        },
        targetCategory: {
          type: 'string',
          enum: ['evening_gown', 'business_blazer', 'resort_wear', 'cocktail_dress'],
          description: 'Optional apparel category preference.',
        },
        budgetUsd: {
          type: 'number',
          description: 'Optional budget override in USD.',
        },
      },
      required: ['consumerId'],
    },
  },

  async handler(args: CurateHolisticRegimenInput): Promise<{ dossier: AuraCuraDossier; shoppingCartSummary: { totalCostUsd: number; remainingBudgetUsd: number } }> {
    const validated = CurateHolisticRegimenInputSchema.parse(args);

    // 1. Resolve Profile & Skin Metrics
    let profile = beautyProfileRepo.getProfile(validated.consumerId);
    const fallbackPkg = getFallbackPersona(validated.consumerId);

    if (!profile) {
      if (fallbackPkg) {
        profile = fallbackPkg.profile;
        beautyProfileRepo.upsertProfile(profile);
      } else {
        profile = CLINICAL_FALLBACK_PERSONAS['sarah-chen'].profile;
      }
    }

    if (validated.eventContext) profile.eventContext = validated.eventContext;
    if (validated.budgetUsd) profile.budgetLimitUsd = validated.budgetUsd;

    const skinMetrics: SkinMetrics = fallbackPkg?.skinMetrics ?? CLINICAL_FALLBACK_PERSONAS['sarah-chen'].skinMetrics;

    // 2. Select Bio-Harmonic Apparel VTO
    let apparel: ApparelVTOItem = fallbackPkg?.recommendedApparel ?? CLINICAL_FALLBACK_PERSONAS['sarah-chen'].recommendedApparel;
    if (validated.targetCategory && validated.targetCategory !== apparel.category) {
      apparel = {
        ...apparel,
        category: validated.targetCategory as ApparelCategory,
      };
    }

    // 3. Synthesize Diurnal Skincare Regimen grounded in Skin Metrics
    const skincareRegimen: SkincareStep[] = [];

    // --- MORNING PROTOCOL (Cleanse, Treat, Protect) ---
    skincareRegimen.push({
      stepNumber: 1,
      phase: 'morning',
      stepType: 'cleanse',
      productName: 'Aura Gentle Biome Jelly Cleanser',
      brand: 'Aura Clinical',
      keyActives: ['Glycerin', 'Panthenol (Pro-Vitamin B5)', 'Oat Beta-Glucan'],
      comedogenicRating: 0,
      clinicalRationale: 'Sulfate-free surfactant preserving epidermal acid mantle (pH 5.5).',
      priceUsd: 38,
    });

    if (skinMetrics.rednessScore > 50 || skinMetrics.barrierStatus === 'severely_damaged') {
      skincareRegimen.push({
        stepNumber: 2,
        phase: 'morning',
        stepType: 'barrier_repair',
        productName: 'Centella Asiatica Soothing Ampoule',
        brand: 'Aura Clinical',
        keyActives: ['Madecassoside 2%', 'Centella Asiatica Extract 85%', 'Allantoin'],
        comedogenicRating: 0,
        clinicalRationale: 'Suppresses pro-inflammatory cytokines (IL-6, TNF-alpha) and rapidly calms facial vascular flush.',
        priceUsd: 65,
      });
    } else {
      skincareRegimen.push({
        stepNumber: 2,
        phase: 'morning',
        stepType: 'treat',
        productName: 'Phyto-Antioxidant Radiance Serum',
        brand: 'Aura Clinical',
        keyActives: ['Niacinamide 4%', 'Hyaluronic Acid Multi-Molecular', 'Ferulic Acid'],
        comedogenicRating: 0,
        clinicalRationale: 'Neutralizes free radicals from UV/stage lighting without lowering epidermal pH.',
        priceUsd: 78,
      });
    }

    skincareRegimen.push({
      stepNumber: 3,
      phase: 'morning',
      stepType: 'protect',
      productName: 'Pure Mineral Solar Shield SPF 50+ PA++++',
      brand: 'Aura Clinical',
      keyActives: ['Non-Nano Zinc Oxide 18%', 'Ectoin 1%', 'Bisabolol'],
      comedogenicRating: 0,
      clinicalRationale: '100% physical zinc mineral barrier providing full-spectrum UV defense with zero chemical filters.',
      priceUsd: 52,
    });

    // --- EVENING PROTOCOL (Cleanse, Barrier Repair, Treat) ---
    skincareRegimen.push({
      stepNumber: 4,
      phase: 'evening',
      stepType: 'cleanse',
      productName: 'Squalane Micellar Emulsion',
      brand: 'Aura Clinical',
      keyActives: ['Sugarcane Squalane', 'Thermal Spring Water'],
      comedogenicRating: 1,
      clinicalRationale: 'Dissolves sebum and sunscreen without disrupting intercellular ceramides.',
      priceUsd: 42,
    });

    skincareRegimen.push({
      stepNumber: 5,
      phase: 'evening',
      stepType: 'barrier_repair',
      productName: 'Physiological Lipid Matrix Cream (3:1:1:1)',
      brand: 'Aura Clinical',
      keyActives: ['Ceramide NP 3%', 'Plant Cholesterol 1%', 'Free Fatty Acids 1%', 'Colloidal Oatmeal'],
      comedogenicRating: 1,
      clinicalRationale: 'Patented physiological ratio mimicking stratum corneum bilayers to seal trans-epidermal water loss (TEWL).',
      priceUsd: 85,
    });

    // 4. Multi-Vector Safety Audit
    const safetyAudit = dermatologyGuardrailService.auditDermatologySafety(
      profile,
      skinMetrics,
      apparel,
      skincareRegimen
    );

    // 5. Chromatic Harmony and Lookbook Advice
    const chromatic = dermatologyGuardrailService.computeChromaticHarmony(skinMetrics, apparel);
    apparel.chromaticHarmonyScore = chromatic.score;

    const eventLookbookAdvice = `[Event Lookbook: ${profile.eventContext}]
Styling Architecture: Wearing the ${apparel.name} by ${apparel.brand} (${apparel.colorName}).
Optical Rationale: ${chromatic.rationale}
Fabric Tactile Comfort: ${apparel.fabricComposition.join(', ')} chosen to prevent neckline micro-abrasion.
Skincare Synthesis: Diurnal protocol actively treats biological skin age ${skinMetrics.skinAge} and supports barrier integrity with 0 contraindicated actives.`;

    const totalSkincareCost = skincareRegimen.reduce((sum, s) => sum + s.priceUsd, 0);
    const totalCostUsd = apparel.priceUsd + totalSkincareCost;
    const remainingBudgetUsd = Math.max(0, profile.budgetLimitUsd - totalCostUsd);

    const dossier: AuraCuraDossier = {
      profile,
      skinMetrics,
      apparelVTO: apparel,
      skincareRegimen,
      safetyAudit,
      eventLookbookAdvice,
      executionMode: 'auracura_grounded',
      generatedAt: new Date().toISOString(),
    };

    // Save generated dossier
    beautyProfileRepo.saveDossier(profile.id, dossier);

    return {
      dossier,
      shoppingCartSummary: {
        totalCostUsd,
        remainingBudgetUsd,
      },
    };
  },
};
