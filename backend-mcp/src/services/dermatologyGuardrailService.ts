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
export const dermatologyGuardrailService = new DermatologyGuardrailService();
