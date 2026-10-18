export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface PromptDefinition {
  name: string;
  description: string;
  arguments?: PromptArgument[];
}

export const AURACURA_DIRECTOR_SYSTEM_PROMPT = `You are AuraCura Autonomous Bio-Harmonic Director & Chief Clinical Aesthetician, an advanced AI system combining Perfect Corp YouCam Vision AI with clinical dermatology guardrails.

Your primary mission is to eliminate "Dermatological & Stylistic Blindness" in eCommerce and personal styling. When styling a client or patient, you NEVER propose generic, irritating products or clashing fabrics (no comedogenic heavy oils for acne-prone skin, no abrasive textiles against erythema, no active ingredient clashes).

Instead, you operate via a rigorous 4-Phase Autonomous ReAct Reasoning Pipeline:
1. DIAGNOSE (Phase 1): Call YouCam Skin Analysis API (/s2s/v2.0/task/skin-analysis) to measure objective clinical metrics: erythema, acne, oiliness, moisture, wrinkles, texture, pores, and dark circles.
2. AUDIT SAFETY (Phase 2): Screen all proposed skincare and apparel against 4 strict dermatology guardrails (Comedogenicity <= 2, Zero Active Clashes, Textile Friction coefficient mu <= 0.18, and Optical Chromatic Harmony).
3. VTO SIMULATION (Phase 3): Generate photorealistic Virtual Try-On via YouCam Generative Cloth API (/s2s/v2.0/task/cloth), applying optical color-cancellation (e.g. emerald/cool jade canceling facial redness).
4. SYNTHESIZE REGIMEN (Phase 4): Formulate a diurnal, ceramide-dominant, skin-barrier-repairing skincare routine and lifestyle dossier with full clinical provenance.

Communication Style:
- Clinical, authoritative, empathetic, and sophisticated.
- Provide objective dermatology rationales for every ingredient and textile recommendation.
- Specify chromatic color harmony explanations and friction coefficients.`;

export const CHIEF_OF_STAFF_SYSTEM_PROMPT = AURACURA_DIRECTOR_SYSTEM_PROMPT;

export const BIO_HARMONIC_STYLING_BRIEFING_PROMPT = 'bio_harmonic_styling_briefing';
export const DERMATOLOGY_SAFETY_AUDIT_PROMPT = 'dermatology_safety_audit';

// Backward compatibility aliases
export const EXECUTIVE_DOSSIER_BRIEFING_PROMPT = BIO_HARMONIC_STYLING_BRIEFING_PROMPT;
export const CULTURAL_GIFT_CURATION_PROMPT = DERMATOLOGY_SAFETY_AUDIT_PROMPT;
export const DIPLOMATIC_ICEBREAKER_PROMPT = DERMATOLOGY_SAFETY_AUDIT_PROMPT;

export const registeredPrompts: PromptDefinition[] = [
  {
    name: BIO_HARMONIC_STYLING_BRIEFING_PROMPT,
    description:
      'Guides the AuraCura ReAct agent to orchestrate a complete Bio-Harmonic Styling Dossier: YouCam Skin Analysis + Apparel VTO + 5-step diurnal ceramide regimen.',
    arguments: [
      {
        name: 'consumerName',
        description: 'Full name or ID of the consumer profile (e.g. Sarah Chen, Marcus Reed, Elena Gomez)',
        required: true,
      },
      {
        name: 'eventContext',
        description: 'Lifestyle or event context (e.g. Tech Gala in Manhattan, coastal resort in Tulum)',
        required: false,
      },
      {
        name: 'targetCategory',
        description: 'Target garment category (dresses, tops, outerwear, suits)',
        required: false,
      },
      {
        name: 'budgetUsd',
        description: 'Total budget ceiling in USD',
        required: false,
      },
    ],
  },
  {
    name: DERMATOLOGY_SAFETY_AUDIT_PROMPT,
    description:
      'Evaluates proposed skincare formulations and apparel textiles against the 4 clinical dermatology guardrails (comedogenicity, active clashes, friction mu <= 0.18, color cancellation).',
    arguments: [
      {
        name: 'ingredients',
        description: 'Comma-separated active ingredients to screen for contraindications',
        required: true,
      },
      {
        name: 'fabricType',
        description: 'Fabric textile (e.g. Mulberry Silk, Egyptian Cotton, Pure Wool, Polyester)',
        required: true,
      },
      {
        name: 'skinCondition',
        description: 'Primary skin condition or diagnosis (e.g. Active Erythema, Acne Vulgaris, Compromised Lipid Barrier)',
        required: true,
      },
    ],
  },
];

export async function getPromptHandler(
  name: string,
  args?: Record<string, string>
): Promise<{ description: string; messages: Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }> }> {
  switch (name) {
    case BIO_HARMONIC_STYLING_BRIEFING_PROMPT:
    case 'executive_dossier_briefing': {
      const consumer = args?.consumerName || args?.vipName || 'Sarah Chen';
      const context = args?.eventContext || args?.meetingContext || 'Evening Gala';
      const budget = args?.budgetUsd || args?.budgetTier || '$1200';

      return {
        description: `Bio-harmonic styling briefing for ${consumer}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Orchestrate a comprehensive Bio-Harmonic Styling Dossier for ${consumer} regarding '${context}' with budget ${budget}. Execute 4-phase ReAct pipeline: diagnose clinical skin metrics via Perfect Corp YouCam API, audit dermatology safety & fabric friction, simulate Generative Cloth VTO, and curate an evidence-based diurnal skincare regimen.`,
            },
          },
        ],
      };
    }

    case DERMATOLOGY_SAFETY_AUDIT_PROMPT:
    case 'cultural_gift_curation':
    case 'diplomatic_icebreaker_generation': {
      const skinCondition = args?.skinCondition || 'Active Erythema & Rosacea Subtype 1';
      const fabric = args?.fabricType || 'Mulberry Silk (19 momme)';
      const ingredients = args?.ingredients || 'Niacinamide 2%, Centella Asiatica, Ceramide NP';

      return {
        description: `Dermatology safety audit for ${skinCondition}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Perform a clinical dermatology safety audit for ${skinCondition}. Verify comedogenicity index (<= 2), identify active ingredient clashes, and compute fabric friction coefficient (mu <= 0.18) for ${fabric} with ingredients ${ingredients}.`,
            },
          },
        ],
      };
    }

    default:
      throw new Error(`MCP Prompt '${name}' is not recognized.`);
  }
}

export function buildGroundedDossierPrompt(params: any): string {
  return `You are AuraCura Director. Formulate bio-harmonic styling dossier for ${params?.profile?.fullName || 'patient'}.`;
}

export function buildGenericDossierPrompt(params: any): string {
  return `You are a generic blind LLM generating standard non-clinical recommendations for ${params?.profile?.fullName || 'patient'}.`;
}
