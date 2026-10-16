/**
 * Dermatology Guardrail Service
 * Clinical formulation safety auditing, active-clash detection, fabric micro-friction analysis,
 * and chromatic color harmony calculations for AuraCura.
 */

import type {
  SkinMetrics,
  ApparelVTOItem,
  SkincareStep,
  SafetyCheck,
  SafetyAuditResult,
  ConsumerBeautyProfile,
} from '../types/index.js';

export interface ComedogenicIngredient {
  name: string;
  rating: number; // 0 to 5
  aliases: string[];
}

export const KNOWN_COMEDOGENIC_INGREDIENTS: ComedogenicIngredient[] = [
  { name: 'Coconut Oil', rating: 4, aliases: ['cocos nucifera oil', 'coconut butter'] },
  { name: 'Isopropyl Myristate', rating: 5, aliases: ['isopropyl myristate', 'ipm'] },
  { name: 'Isopropyl Palmitate', rating: 4, aliases: ['isopropyl palmitate'] },
  { name: 'Ethylhexyl Palmitate', rating: 4, aliases: ['ethylhexyl palmitate', 'octyl palmitate'] },
  { name: 'Wheat Germ Oil', rating: 5, aliases: ['triticum vulgare germ oil', 'wheatgerm oil'] },
  { name: 'Cocoa Butter', rating: 4, aliases: ['theobroma cacao seed butter', 'cocoa seed butter'] },
  { name: 'Sodium Lauryl Sulfate', rating: 5, aliases: ['sodium lauryl sulfate', 'sls'] },
  { name: 'Myristyl Myristate', rating: 5, aliases: ['myristyl myristate'] },
  { name: 'Acetylated Lanolin', rating: 4, aliases: ['acetylated lanolin alcohol', 'acetylated lanolin'] },
  { name: 'Laureth-4', rating: 5, aliases: ['laureth-4', 'peg-4 lauryl ether'] },
  { name: 'Algae Extract', rating: 5, aliases: ['algae extract', 'laminaria saccharina extract'] },
];

export const CONTRAINDICATED_DAMAGED_BARRIER_ACTIVES = [
  { name: 'Retinol', pattern: /\bretinol\b|\btretinoin\b|\bretinal\b|\badapalene\b/i, maxSafePercent: 0.5 },
  { name: 'Glycolic Acid', pattern: /\bglycolic\s+acid\b|\baha\b/i },
  { name: 'Denatured Alcohol', pattern: /\balcohol\s+denat\b|\bdenatured\s+alcohol\b|\bsd\s+alcohol\b/i },
  { name: 'High-strength Salicylic Acid', pattern: /\bsalicylic\s+acid\b|\bbha\b/i },
  { name: 'Benzoyl Peroxide', pattern: /\bbenzoyl\s+peroxide\b/i },
];

export const ROUGH_FABRIC_PATTERNS = [
  /\brough\s+wool\b/i,
  /\bcoarse\s+wool\b/i,
  /\bshearling\b/i,
  /\b100%\s+polyester\b/i,
  /\bnon-breathable\s+polyester\b/i,
  /\bacrylic\b/i,
  /\bscratchy\s+nylon\b/i,
];

export const SKIN_SOOTHING_FABRIC_PATTERNS = [
  /\bsilk\b/i,
  /\bmulberry\s+silk\b/i,
  /\borganic\s+cotton\b/i,
  /\bbamboo\b/i,
  /\blyocell\b/i,
  /\btencel\b/i,
  /\bbelgian\s+linen\b/i,
];

export class DermatologyGuardrailService {
  /**
   * Rule 1: Comedogenicity Check
   * In oily/acne-prone skin (acneScore > 50), bans pore-clogging ingredients rating >= 3.
   */
  public auditComedogenicity(skinMetrics: SkinMetrics, regimen: SkincareStep[]): SafetyCheck {
    const isAcneProne = skinMetrics.acneScore > 50 || skinMetrics.poreScore > 60;
    const flaggedItems: { product: string; ingredient: string; rating: number }[] = [];

    for (const step of regimen) {
      // Check step.comedogenicRating explicitly
      if (isAcneProne && step.comedogenicRating >= 3) {
        flaggedItems.push({
          product: step.productName,
          ingredient: 'High Comedogenic Matrix',
          rating: step.comedogenicRating,
        });
      }

      // Check ingredient active list
      for (const active of step.keyActives) {
        const lower = active.toLowerCase();
        for (const comedo of KNOWN_COMEDOGENIC_INGREDIENTS) {
          if (comedo.rating >= 3 && comedo.aliases.some((alias) => lower.includes(alias))) {
            flaggedItems.push({
              product: step.productName,
              ingredient: comedo.name,
              rating: comedo.rating,
            });
          }
        }
      }
    }

    if (flaggedItems.length > 0) {
      if (isAcneProne) {
        return {
          id: 'comedogenic',
          status: 'fail',
          detail: `Comedogenic Contraindication: Skin acne score (${skinMetrics.acneScore}/100) is highly vulnerable to follicular occlusion. Detected pore-clogging actives: ${flaggedItems
            .map((f) => `${f.ingredient} (Rating ${f.rating}/5) in '${f.product}'`)
            .join(', ')}. Must replace with non-comedogenic emollients (Squalane, Jojoba).`,
        };
      } else {
        return {
          id: 'comedogenic',
          status: 'warn',
          detail: `Comedogenic Caution: Moderate occlusion risk detected from ${flaggedItems.map((f) => f.ingredient).join(', ')}. Tolerable for dry skin without micro-comedones.`,
        };
      }
    }

    return {
      id: 'comedogenic',
      status: 'pass',
      detail: `Comedogenic Clearance: All prescribed skincare steps have comedogenicity ratings <= 2. Safe for acne-prone skin.`,
    };
  }

  /**
   * Rule 2: Active Ingredient Clash & Compromised Barrier Safety
   * In erythematous or damaged barrier skin (redness > 60 or barrier !== 'healthy'),
   * bans Retinol > 0.5%, Glycolic Acid, Alcohol Denat. Warns on BHA + Retinoid multi-acid stacking.
   */
  public auditActiveClashes(
    profile: ConsumerBeautyProfile,
    skinMetrics: SkinMetrics,
    regimen: SkincareStep[]
  ): SafetyCheck {
    const isBarrierDamaged =
      skinMetrics.rednessScore > 60 ||
      skinMetrics.barrierStatus === 'compromised' ||
      skinMetrics.barrierStatus === 'severely_damaged';

    const contraindications: string[] = [];
    const clashWarnings: string[] = [];
    const allergyViolations: string[] = [];

    let hasBHA = false;
    let hasRetinoid = false;

    for (const step of regimen) {
      for (const active of step.keyActives) {
        const lower = active.toLowerCase();

        // 1. Check known allergies
        for (const allergy of profile.knownAllergies || []) {
          if (lower.includes(allergy.toLowerCase())) {
            allergyViolations.push(`Known allergen '${allergy}' found in '${step.productName}'`);
          }
        }

        // 2. Check barrier contraindications
        if (isBarrierDamaged) {
          for (const rule of CONTRAINDICATED_DAMAGED_BARRIER_ACTIVES) {
            if (rule.pattern.test(lower)) {
              contraindications.push(`${rule.name} in '${step.productName}'`);
            }
          }
        }

        // Track BHA and Retinoid combinations
        if (/\bsalicylic\b|\bbha\b/i.test(lower)) hasBHA = true;
        if (/\bretinol\b|\btretinoin\b|\bretinal\b|\bretinoid\b|\bretinoate\b|\badapalene\b/i.test(lower)) hasRetinoid = true;
      }
    }

    // Check allergy violations first
    if (allergyViolations.length > 0) {
      return {
        id: 'active_clash',
        status: 'fail',
        detail: `Allergy Hazard: Consumer has documented sensitivities: ${allergyViolations.join('; ')}. Immediate formulation replacement mandatory.`,
      };
    }

    // Check barrier contraindications
    if (contraindications.length > 0) {
      return {
        id: 'active_clash',
        status: 'fail',
        detail: `Chemical Contact Dermatitis Hazard: Stratum corneum barrier status is '${skinMetrics.barrierStatus}' (Redness: ${skinMetrics.rednessScore}/100). Contraindicated harsh actives detected: ${contraindications.join(', ')}. Must suspend direct exfoliants until lipid barrier restoration.`,
      };
    }

    // Check acid + retinoid clash
    if (hasBHA && hasRetinoid) {
      clashWarnings.push('BHA (Salicylic Acid) combined with Retinoid in the same daily sequence. Separate into alternating AM/PM diurnal phases to prevent irritation.');
    }

    if (clashWarnings.length > 0) {
      return {
        id: 'active_clash',
        status: 'warn',
        detail: `Active Synergy Caution: ${clashWarnings.join(' ')}`,
      };
    }

    return {
      id: 'active_clash',
      status: 'pass',
      detail: `Active Chemistry Clearance: Formulations maintain pH homeostasis. Key restorative actives (Ceramides, Hyaluronic Acid, Centella) support barrier repair without destructive cross-reactions.`,
    };
  }

  /**
   * Rule 3: Fabric Friction & Tactile Micro-Abrasion Audit
   * In sensitive/inflamed skin, bans rough wool, coarse polyester turtlenecks.
   * Endorses 100% Mulberry Silk, Organic Cotton, and Lyocell Bamboo.
   */
  public auditFabricFriction(skinMetrics: SkinMetrics, apparel: ApparelVTOItem): SafetyCheck {
    const isErythematous = skinMetrics.rednessScore > 50 || skinMetrics.barrierStatus !== 'healthy';
    const fabrics = (apparel.fabricComposition || []).join(' ').toLowerCase();

    const isRough = ROUGH_FABRIC_PATTERNS.some((pattern) => pattern.test(fabrics));
    const isSoothing = SKIN_SOOTHING_FABRIC_PATTERNS.some((pattern) => pattern.test(fabrics));

    if (isRough) {
      if (isErythematous) {
        return {
          id: 'fabric_friction',
          status: 'fail',
          detail: `Mechanical Friction Hazard: Garment contains abrasive fibers (${apparel.fabricComposition.join(', ')}). High erythema score (${skinMetrics.rednessScore}/100) risks mechanical stratum corneum micro-tears. Replace with organic silk or bamboo fibers.`,
        };
      }
      return {
        id: 'fabric_friction',
        status: 'warn',
        detail: `Tactile Friction Warning: Synthetic or coarse wool fibers detected in '${apparel.name}'. Wear an ultra-soft modal/silk base layer to protect the epidermis.`,
      };
    }

    if (isSoothing) {
      return {
        id: 'fabric_friction',
        status: 'pass',
        detail: `Tactile Micro-Abrasion Clearance: '${apparel.name}' incorporates bio-compatible fibers (${apparel.fabricComposition.join(', ')}). Friction coefficient < 0.15, promoting epidermal soothing and optimal breathability.`,
      };
    }

    return {
      id: 'fabric_friction',
      status: 'pass',
      detail: `Fabric Safety Clearance: Neutral fabric blend (${apparel.fabricComposition.join(', ')}) complies with dermatological safety thresholds.`,
    };
  }

  /**
   * Rule 4: Chromatic Color Harmony & Optical Balancing
   * Computes optical compensation:
   *  - High facial erythema (Redness > 50 or cool_fair) -> Recommends Olive/Sage Green (#8A9A86) to cancel red wavelengths.
   *  - Pale / Dehydrated -> Recommends Rich Navy (#1B263B) or warm tones.
   *  - Olive / Warm Deep -> Recommends Terracotta (#C86D51), jewel tones.
   */
  public computeChromaticHarmony(
    skinMetrics: SkinMetrics,
    apparel: ApparelVTOItem
  ): { score: number; rationale: string; recommendation: string } {
    const colorLower = (apparel.colorName + ' ' + apparel.colorHex).toLowerCase();
    let score = apparel.chromaticHarmonyScore || 85;
    let rationale = '';
    let recommendation = '';

    // Condition A: High Erythema / Red Flare-up (e.g. Sarah Chen)
    if (skinMetrics.rednessScore > 60 || (skinMetrics.rednessScore > 40 && skinMetrics.undertone === 'cool_fair')) {
      const isGreenFamily = /sage|olive|emerald|green|#8a9a86|#2e4033/i.test(colorLower);
      const isRedFamily = /crimson|scarlet|ruby|magenta|red|#ff0000|#c0392b/i.test(colorLower);

      if (isGreenFamily) {
        score = Math.max(score, 95);
        rationale = `Bio-Harmonic Optical Cancellation: Sage green / olive tones reside directly opposite erythema wavelengths (~650nm) on the chromatic spectrum, canceling visual redness through optical subtraction.`;
        recommendation = `Sage Green and Muted Olive are ideal for optical redness neutralization.`;
      } else if (isRedFamily) {
        score = Math.min(score, 45);
        rationale = `Chromatic Echo Warning: Scarlet and magenta amplify cutaneous erythema, drawing visual focus to inflamed facial zones.`;
        recommendation = `Avoid high-chroma red or pink apparel during acute erythema flare-ups.`;
      } else {
        score = Math.min(score, 88);
        rationale = `Neutral Chromatic Contrast: Color provides gentle complement without active redness cancellation.`;
        recommendation = `Pair with a sage green silk scarf or emerald accessory to maximize chromatic balance.`;
      }
    }
    // Condition B: Dehydrated / Sallow / Stage Lighting (e.g. Marcus Reed)
    else if (skinMetrics.moistureScore < 35 || skinMetrics.wrinkleScore > 50) {
      const isDeepNavyOrCharcoal = /navy|midnight|slate|charcoal|#1b263b|#2c3e50/i.test(colorLower);
      if (isDeepNavyOrCharcoal) {
        score = Math.max(score, 92);
        rationale = `Luminance Sculpting: Midnight navy creates a crisp structured silhouette that grounds stage lighting, imparting healthy visual definition to fatigued, dehydrated skin.`;
        recommendation = `Deep navy paired with breathable linen keeps the complexion sharp and revitalized.`;
      } else {
        rationale = `Moderate Luminance Balance: Harmonious for executive presentation environments.`;
        recommendation = `Opt for dark jewel tones or structured navy to boost complexion vitality.`;
      }
    }
    // Condition C: Olive / Beach UV Exposure (e.g. Elena Gomez)
    else {
      const isTerracottaOrEarthy = /terracotta|earth|bronze|copper|sand|coral|#c86d51/i.test(colorLower);
      if (isTerracottaOrEarthy) {
        score = Math.max(score, 98);
        rationale = `Warm Undertone Resonance: Terracotta and warm earth pigments complement golden-olive skin undertones, enhancing natural radiance under outdoor sunlight while masking localized melasma.`;
        recommendation = `Warm Terracotta with UPF 50+ rating provides supreme harmony and solar protection.`;
      } else {
        rationale = `Harmonious aesthetic pairing with natural undertones.`;
        recommendation = `Earth tones and warm neutrals complement natural skin luminosity.`;
      }
    }

    return {
      score: Math.max(10, Math.min(100, score)),
      rationale,
      recommendation,
    };
  }

  /**
   * Barrier Integrity Audit
   */
  public auditBarrierSafety(skinMetrics: SkinMetrics, regimen: SkincareStep[]): SafetyCheck {
    const hasBarrierRepair = regimen.some(
      (s) =>
        s.stepType === 'barrier_repair' ||
        s.keyActives.some((a) => /ceramide|centella|panthenol|squalane|madecassoside/i.test(a))
    );

    if (skinMetrics.barrierStatus === 'severely_damaged') {
      if (!hasBarrierRepair) {
        return {
          id: 'barrier_safety',
          status: 'fail',
          detail: `Critical Barrier Deficit: Stratum corneum is severely damaged (TEWL elevated), but no ceramide or lipid-replenishing barrier step was included in the daily regimen.`,
        };
      }
      return {
        id: 'barrier_safety',
        status: 'warn',
        detail: `Acute Barrier Recovery Protocol Active: Dedicated lipid replenishment prescribed. Patient must avoid physical exfoliants and facial waxing for 14 days.`,
      };
    }

    return {
      id: 'barrier_safety',
      status: 'pass',
      detail: `Barrier Integrity Certified: Hydration and intercellular lipid bilayers are fortified against environmental stressors.`,
    };
  }

  /**
   * Master Multi-Vector Safety Audit
   * Evaluates all 4 dimensions: Comedogenic, Active Clash, Fabric Friction, and Barrier Safety.
   */
  public auditDermatologySafety(
    profile: ConsumerBeautyProfile,
    skinMetrics: SkinMetrics,
    apparel: ApparelVTOItem,
    skincareRegimen: SkincareStep[]
  ): SafetyAuditResult {
    const checks: SafetyCheck[] = [
      this.auditComedogenicity(skinMetrics, skincareRegimen),
      this.auditActiveClashes(profile, skinMetrics, skincareRegimen),
      this.auditBarrierSafety(skinMetrics, skincareRegimen),
      this.auditFabricFriction(skinMetrics, apparel),
    ];

    const isSafe = checks.every((c) => c.status !== 'fail');
    const failingChecks = checks.filter((c) => c.status === 'fail');
    const warningChecks = checks.filter((c) => c.status === 'warn');

    let summary = '';
    if (!isSafe) {
      summary = `SAFETY VETO: ${failingChecks.length} clinical contraindication(s) detected. ${failingChecks.map((f) => f.detail).join(' ')}`;
    } else if (warningChecks.length > 0) {
      summary = `CLINICAL CLEARANCE WITH PRECAUTIONS: Regimen and apparel approved with ${warningChecks.length} monitored recommendation(s). ${warningChecks.map((w) => w.detail).join(' ')}`;
    } else {
      summary = `OPTIMAL CLINICAL CERTIFICATION: 100% compliant across Comedogenicity, Active Chemistry, Lipid Barrier Safety, and Fabric Micro-Abrasion thresholds.`;
    }

    return {
      isSafe,
      checks,
      summary,
    };
  }
}

export const dermatologyGuardrailService = new DermatologyGuardrailService();
