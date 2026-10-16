import type { SkinMetrics, SkincareStep, SafetyCheck } from '../types/index.js';

export const KNOWN_COMEDOGENIC_INGREDIENTS = [
  { name: 'Coconut Oil', rating: 4, aliases: ['cocos nucifera oil', 'coconut butter'] },
  { name: 'Isopropyl Myristate', rating: 5, aliases: ['isopropyl myristate', 'ipm'] },
  { name: 'Isopropyl Palmitate', rating: 4, aliases: ['isopropyl palmitate'] },
];

export class DermatologyGuardrailService {
  public auditComedogenicity(skinMetrics: SkinMetrics, regimen: SkincareStep[]): SafetyCheck {
    const isAcneProne = skinMetrics.acneScore >= 50 || skinMetrics.poreScore >= 60;
    const maxAllowedRating = isAcneProne ? 2 : 3;

    for (const step of regimen) {
      if (step.comedogenicRating > maxAllowedRating) {
        return {
          id: 'comedogenic',
          status: 'fail',
          detail: `Pore-clogging hazard detected: '${step.productName}' contains high-comedogenic actives.`,
        };
      }
    }
    return { id: 'comedogenic', status: 'pass', detail: 'Formulation adheres to non-comedogenic criteria.' };
  }
}
  public auditActiveClashes(profile: any, skinMetrics: SkinMetrics, regimen: SkincareStep[]): SafetyCheck {
    if (skinMetrics.barrierStatus === 'severely_damaged') {
      const harsh = regimen.find(s => s.keyActives.some(a => /retinol|glycolic|alcohol denat/i.test(a)));
      if (harsh) {
        return {
          id: 'active_clash',
          status: 'fail',
          detail: `Contraindicated harsh actives: Contact Dermatitis hazard under compromised stratum corneum.`,
        };
      }
    }
    return { id: 'active_clash', status: 'pass', detail: 'Zero contraindicated active clashes detected.' };
  }
}
  public auditFabricFriction(skinMetrics: SkinMetrics, apparel: any): SafetyCheck {
    const isErythemaActive = skinMetrics.rednessScore >= 60;
    const isRough = apparel.fabricComposition.some((f: string) => /rough wool|coarse|polyester/i.test(f));
    if (isErythemaActive && isRough) {
      return {
        id: 'fabric_friction',
        status: 'fail',
        detail: 'Mechanical Friction Hazard: Abrasive textiles exacerbate acute erythema micro-inflammation.',
      };
    }
    return { id: 'fabric_friction', status: 'pass', detail: 'Tactile micro-friction certified safe.' };
  }
}
export const dermatologyGuardrailService = new DermatologyGuardrailService();
