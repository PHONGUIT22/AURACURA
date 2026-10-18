import { beautyProfileRepo } from '../database/beautyProfileRepo.js';
import { seedDemoData } from '../database/seedDemoData.js';
import { DERMATOLOGY_SAFETY_RULES } from '../services/dermatologyGuardrailService.js';

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const CONSUMER_ROSTER_URI = 'auracura://consumers/roster';
export const DERMATOLOGY_GUIDELINES_URI = 'auracura://guidelines/dermatology-guardrails';
export const BENCHMARKS_DATASET_URI = 'auracura://benchmarks/grounding-dataset';

// Backward compatibility aliases
export const VIP_ROSTER_URI = CONSUMER_ROSTER_URI;
export const TASTE_CLUSTERS_URI = DERMATOLOGY_GUIDELINES_URI;
export const COMPLIANCE_GUIDELINES_URI = BENCHMARKS_DATASET_URI;

export const registeredResources: ResourceDefinition[] = [
  {
    uri: CONSUMER_ROSTER_URI,
    name: 'AuraCura Consumer Beauty Profiles & Clinical Records',
    description: 'Active consumer beauty profiles with clinical skin metrics, allergies, Fitzpatrick phototype, and event contexts (Sarah Chen, Marcus Reed, Elena Gomez).',
    mimeType: 'application/json',
  },
  {
    uri: DERMATOLOGY_GUIDELINES_URI,
    name: 'Clinical Dermatology & Textile Friction Guardrails',
    description: 'The 4 clinical dermatology guardrails: Rule 1 Comedogenicity Index <= 2, Rule 2 Active Clashes & Barrier Integrity, Rule 3 Fabric Friction coefficient mu <= 0.18, Rule 4 Optical Chromatic Color Harmony.',
    mimeType: 'application/json',
  },
  {
    uri: BENCHMARKS_DATASET_URI,
    name: 'Grounding Evaluation Benchmark Dataset',
    description: 'Side-by-side comparative grounding dataset demonstrating AuraCura Grounded (YouCam Vision AI + Dermatology Guardrails) vs Generic Blind LLM baseline.',
    mimeType: 'application/json',
  },
];

export async function readResourceHandler(uri: string): Promise<{
  contents: Array<{
    uri: string;
    mimeType: string;
    text: string;
  }>;
}> {
  seedDemoData();

  if (uri === CONSUMER_ROSTER_URI || uri === 'curavip://principals/roster') {
    const profiles = beautyProfileRepo.listProfiles();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              system: 'AuraCura Autonomous Bio-Harmonic Engine',
              totalCount: profiles.length,
              generatedAt: new Date().toISOString(),
              consumers: profiles,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === DERMATOLOGY_GUIDELINES_URI || uri === 'curavip://taste-graph/clusters') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              system: 'AuraCura Dermatology & Safety Guardrails',
              totalRules: DERMATOLOGY_SAFETY_RULES.length,
              rules: DERMATOLOGY_SAFETY_RULES,
              clinicalPrinciples: [
                'Rule 1: Comedogenicity Index must not exceed 2 for acneic and compromised skins.',
                'Rule 2: Direct active clashes (e.g. AHA/BHA with Retinoids) are forbidden in the same diurnal step.',
                'Rule 3: Garment textile friction coefficient must be <= 0.18 for active erythema and rosacea.',
                'Rule 4: Apparel undertones must provide optical color-cancellation against facial erythema.',
              ],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === BENCHMARKS_DATASET_URI || uri === 'curavip://compliance/fcpa-guidelines') {
    const benchmarks = {
      benchmarkVersion: '2026.1',
      evaluationPairs: [
        {
          profileId: 'sarah-chen',
          groundedHypothesis: 'Mulberry silk apparel (mu=0.14) with optical emerald green undertone cancels erythema; diurnal ceramide complex restores compromised lipid barrier.',
          blindHallucinationHypothesis: 'Recommends 10% Glycolic Acid and abrasive sequined wool top, triggering severe contact dermatitis and exacerbating facial redness.',
          expectedHarmAvoidance: 'Prevents chemical burn and physical micro-abrasions.',
        },
        {
          profileId: 'marcus-reed',
          groundedHypothesis: 'Pure Egyptian cotton shirt with low surface roughness prevents micro-nicks on sensitive post-shave skin; calming centella and squalane hydrate without clogging.',
          blindHallucinationHypothesis: 'Prescribes alcohol-heavy astringent toner and stiff polyester blend collar.',
          expectedHarmAvoidance: 'Eliminates razor burn aggravation and folliculitis risks.',
        },
      ],
    };

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(benchmarks, null, 2),
        },
      ],
    };
  }

  throw new Error(`MCP Resource '${uri}' is not registered in AuraCura.`);
}
