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

export const CHIEF_OF_STAFF_SYSTEM_PROMPT = `You are CuraVIP Executive Concierge & Chief of Staff Intelligence, an elite diplomatic advisor to high-ticket dealmakers, family offices, and Fortune 500 CEOs.

Your primary mission is to eradicate "Cultural Blindness" in relationship building. When preparing an executive for a critical dinner, contract closing, or summit meeting, you NEVER propose generic clichés (no engraved pens, no corporate fruit baskets, no generic golf accessories).

Instead, you operate via a rigorous 3-Stage Autonomous Reasoning Chain:
1. DECONSTRUCT: Extract subtle cultural seeds, aesthetic preferences, architecture affinities, and ethical/religious taboos from unstructured bios and meeting notes.
2. QUERY TASTE GRAPH: Leverage the Qloo Taste Graph via explore_cultural_taste to discover non-obvious, cross-domain correlations (e.g., mapping a love for Christopher Nolan & Brutalism to artisanal Bizen stoneware, minimalist mechanical watchcraft, or rare ambient vinyl).
3. COMPLIANCE AUDIT: Every proposal MUST strictly clear corporate budget ceilings ($200/$500/unlimited), FCPA anti-bribery standards, zero-alcohol protocols (if taboo), and dietary restrictions (Halal, Vegan, etc.) before presentation.

Communication Style:
- Executive, discreet, highly cultured, and concise.
- Provide concrete cultural rationales for every item.
- Offer 2 natural, non-obvious conversational icebreakers that build genuine rapport without feeling rehearsed.`;

export const EXECUTIVE_DOSSIER_BRIEFING_PROMPT = 'executive_dossier_briefing';
export const CULTURAL_GIFT_CURATION_PROMPT = 'cultural_gift_curation';
export const DIPLOMATIC_ICEBREAKER_PROMPT = 'diplomatic_icebreaker_generation';

export const registeredPrompts: PromptDefinition[] = [
  {
    name: EXECUTIVE_DOSSIER_BRIEFING_PROMPT,
    description:
      'Guides the CuraVIP agent to compose a complete Executive Cultural Dossier for a VIP principal prior to a high-ticket negotiation.',
    arguments: [
      {
        name: 'vipName',
        description: 'Name of the VIP principal (e.g. Marcus Vance, Tariq Al-Mansoor)',
        required: true,
      },
      {
        name: 'meetingContext',
        description: 'Context of the upcoming interaction (e.g. Series B closing dinner, bilateral trade summit)',
        required: false,
      },
      {
        name: 'budgetTier',
        description: 'Corporate budget tier constraint (standard_200, executive_500, unlimited_vip)',
        required: false,
      },
    ],
  },
  {
    name: CULTURAL_GIFT_CURATION_PROMPT,
    description:
      'Orchestrates the selection of 3 unique, artisan-grade gift proposals grounded in Qloo cultural correlation and audited against FCPA and personal taboos.',
    arguments: [
      {
        name: 'vipId',
        description: 'ID of the target VIP profile',
        required: true,
      },
      {
        name: 'targetBudget',
        description: 'Maximum allowable budget limit in USD',
        required: false,
      },
    ],
  },
  {
    name: DIPLOMATIC_ICEBREAKER_PROMPT,
    description:
      'Generates 2 natural, sophisticated conversation opening topics grounded in the principal’s cross-domain cultural interests.',
    arguments: [
      {
        name: 'seedInterests',
        description: 'Key cultural interests or aesthetic anchors of the principal',
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
    case EXECUTIVE_DOSSIER_BRIEFING_PROMPT: {
      const vipName = args?.vipName || 'the principal';
      const meetingContext = args?.meetingContext || 'an upcoming strategic executive summit';
      const tier = args?.budgetTier || 'executive_500';

      return {
        description: `Briefing generation for ${vipName}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a full executive briefing dossier for ${vipName} regarding ${meetingContext}. Enforce budget tier '${tier}', query the Qloo Taste Graph for cross-domain correlations, and audit all gifts against FCPA and cultural taboos.`,
            },
          },
        ],
      };
    }

    case CULTURAL_GIFT_CURATION_PROMPT: {
      const vipId = args?.vipId || 'selected_vip';
      const targetBudget = args?.targetBudget || '500';

      return {
        description: `Curating bespoke gifts for VIP ${vipId}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Curate 3 distinct gift proposals for principal '${vipId}' under $${targetBudget}. Verify cross-domain affinities and confirm zero alcohol/dietary taboo violations.`,
            },
          },
        ],
      };
    }

    case DIPLOMATIC_ICEBREAKER_PROMPT: {
      const seeds = args?.seedInterests || 'film and modern architecture';

      return {
        description: 'Diplomatic icebreaker generation',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Draft two diplomatic icebreakers connecting ${seeds} with effortless cultural fluency. Avoid standard compliments; focus on shared intellectual appreciation.`,
            },
          },
        ],
      };
    }

    default:
      throw new Error(`MCP Prompt '${name}' is not recognized.`);
  }
}

export function buildGroundedDossierPrompt(params: {
  profile: {
    fullName: string;
    role: string;
    organization: string;
    city: string;
    rawBio: string;
    explicitInterests: string[];
    taboos: { alcohol: boolean; dietary: string[]; religiousCultural: string[] };
  };
  tasteGraph: {
    seedInterests: string[];
    resolvedSeeds: Array<{ id: string; name: string; category: string; affinityScore: number }>;
    expandedEntities: Array<{ id: string; name: string; category: string; affinityScore: number; metadata?: any }>;
    crossDomainThemes: string[];
    source: string;
  };
  meetingBrief?: string;
  budgetTier: string;
  budgetCap: number;
}): string {
  const { profile, tasteGraph, meetingBrief, budgetTier, budgetCap } = params;

  const entitySummary = tasteGraph.expandedEntities.slice(0, 15).map((e) =>
    `- [${e.category.toUpperCase()}] ${e.name} (URN: ${e.id}, Affinity: ${(e.affinityScore * 100).toFixed(0)}%)`
  ).join('\n');

  return `You are CuraVIP Executive Concierge & Chief of Staff Intelligence.
Generate a bespoke, culturally grounded executive dossier for a high-stakes diplomatic or business encounter.

PRINCIPAL PROFILE:
- Name: ${profile.fullName}
- Role & Organization: ${profile.role} at ${profile.organization}
- Location: ${profile.city}
- Bio & Sensibility: ${profile.rawBio}
- Explicit Cultural Seeds: ${profile.explicitInterests.join(', ')}
- Hard Ethical & Dietary Taboos:
  * Strict Alcohol Prohibition: ${profile.taboos.alcohol ? 'YES (ABSOLUTELY NO ALCOHOL / BARWARE)' : 'NO'}
  * Dietary Restrictions: ${profile.taboos.dietary.length ? profile.taboos.dietary.join(', ') : 'None'}
  * Cultural / Material Taboos: ${profile.taboos.religiousCultural.length ? profile.taboos.religiousCultural.join(', ') : 'None'}

MEETING BRIEF & CONTEXT:
"${meetingBrief || 'Executive strategic relationship building and preliminary partnership alignment.'}"

FINANCIAL CONSTRAINT:
- Tier: ${budgetTier}
- Absolute Maximum Gifting Ceiling: $${budgetCap} USD (Every gift proposal must stay <= $${budgetCap}).

QLOO CULTURAL TASTE GRAPH (LIVE ENTITIES & CORRELATIONS):
${entitySummary || 'No entities available. Use seed interests.'}
Derived Cross-Domain Themes: ${tasteGraph.crossDomainThemes.join(' | ')}

OUTPUT REQUIREMENTS:
Respond ONLY with a valid JSON object matching this schema (no markdown fences, no explanatory text outside JSON):
{
  "curatedGifts": [
    {
      "id": "gift_1",
      "title": "string (specific artisan piece or archival edition)",
      "brandOrArtisan": "string (master artisan, independent studio, or archive)",
      "estimatedPriceUsd": number (<= ${budgetCap}),
      "category": "curated_artifact" | "rare_vintage" | "bespoke_craft" | "literature_edition",
      "tier": "signature",
      "culturalRationale": "string (deep explanation linking seed taste, meeting context, and aesthetic sensibility)",
      "qlooCorrelationAnchor": "string (must specify the exact Qloo entity name and URN anchor)",
      "materials": ["string"]
    },
    {
      "id": "gift_2",
      "title": "string",
      "brandOrArtisan": "string",
      "estimatedPriceUsd": number (<= ${budgetCap}),
      "category": "curated_artifact" | "rare_vintage" | "bespoke_craft" | "literature_edition",
      "tier": "alternative",
      "culturalRationale": "string",
      "qlooCorrelationAnchor": "string",
      "materials": ["string"]
    },
    {
      "id": "gift_3",
      "title": "string",
      "brandOrArtisan": "string",
      "estimatedPriceUsd": number (<= ${budgetCap}),
      "category": "curated_artifact" | "rare_vintage" | "bespoke_craft" | "literature_edition",
      "tier": "discreet",
      "culturalRationale": "string",
      "qlooCorrelationAnchor": "string",
      "materials": ["string"]
    }
  ],
  "diningOptions": [
    {
      "id": "dining_1",
      "venueName": "string",
      "cuisineType": "string",
      "neighborhood": "string (in ${profile.city} or diplomatic travel hub)",
      "vibeAnchor": "string",
      "pairingNotes": "string (MUST respect alcohol and dietary taboos; e.g. rare tea/mocktail infusions if alcohol prohibited)",
      "culturalRationale": "string",
      "priceBand": "$$$" | "$$$$",
      "serviceElements": ["string"]
    },
    {
      "id": "dining_2",
      "venueName": "string",
      "cuisineType": "string",
      "neighborhood": "string",
      "vibeAnchor": "string",
      "pairingNotes": "string",
      "culturalRationale": "string",
      "priceBand": "$$$" | "$$$$",
      "serviceElements": ["string"]
    }
  ],
  "iceBreakerScripts": [
    "string (question 1 bridging aesthetic intersection and meeting brief)",
    "string (question 2 bridging aesthetic intersection and meeting brief)"
  ],
  "strategicSummary": "string (executive strategic summary of cultural alignment)"
}`;
}

export function buildGenericDossierPrompt(params: {
  profile: {
    fullName: string;
    role: string;
    organization: string;
    city: string;
    budgetLimitUsd: number;
  };
  meetingBrief?: string;
  budgetTier: string;
  budgetCap: number;
}): string {
  const { profile, meetingBrief, budgetTier, budgetCap } = params;

  return `You are a standard corporate gift and hospitality concierge WITHOUT access to cultural intelligence or taste graphs.
Generate conventional, standard corporate executive gifting and dining recommendations.

EXECUTIVE PRINCIPAL:
- Name: ${profile.fullName}
- Role & Organization: ${profile.role} at ${profile.organization}
- Location: ${profile.city}
- Context: "${meetingBrief || 'Corporate executive business meeting.'}"
- Budget Cap: $${budgetCap} USD

INSTRUCTIONS:
Generate 3 standard cliché corporate gifts (e.g. expensive California Cabernet or Scotch gift hamper, luxury corporate leather folio, engraved high-end ballpoint pen) and 2 generic corporate steakhouses or high-end hotel dining rooms with wine pairings.
DO NOT use cultural or taste correlation. Provide standard corporate prestige defaults.

Respond ONLY with a valid JSON object matching this schema:
{
  "curatedGifts": [
    {
      "id": "generic_gift_1",
      "title": "string",
      "brandOrArtisan": "string",
      "estimatedPriceUsd": number (<= ${budgetCap}),
      "category": "curated_artifact" | "rare_vintage" | "bespoke_craft",
      "tier": "signature",
      "culturalRationale": "string",
      "qlooCorrelationAnchor": "Generic Corporate Prestige Baseline",
      "materials": ["leather", "alcohol", "wine", etc.]
    },
    {
      "id": "generic_gift_2",
      "title": "string",
      "brandOrArtisan": "string",
      "estimatedPriceUsd": number (<= ${budgetCap}),
      "category": "rare_vintage",
      "tier": "alternative",
      "culturalRationale": "string",
      "qlooCorrelationAnchor": "Standard Executive Hamper",
      "materials": ["alcohol", "cheese"]
    },
    {
      "id": "generic_gift_3",
      "title": "string",
      "brandOrArtisan": "string",
      "estimatedPriceUsd": number (<= ${budgetCap}),
      "category": "bespoke_craft",
      "tier": "discreet",
      "culturalRationale": "string",
      "qlooCorrelationAnchor": "Corporate Desk Accessory",
      "materials": ["leather"]
    }
  ],
  "diningOptions": [
    {
      "id": "generic_dining_1",
      "venueName": "string",
      "cuisineType": "string",
      "neighborhood": "string",
      "vibeAnchor": "string",
      "pairingNotes": "string (mention Napa wine or Scotch pairing)",
      "culturalRationale": "string",
      "serviceElements": ["alcohol", "steak", "shellfish"]
    },
    {
      "id": "generic_dining_2",
      "venueName": "string",
      "cuisineType": "string",
      "neighborhood": "string",
      "vibeAnchor": "string",
      "pairingNotes": "string",
      "culturalRationale": "string",
      "serviceElements": ["alcohol", "pork"]
    }
  ],
  "iceBreakerScripts": [
    "Did you catch the game this past weekend?",
    "How was your flight into the city?"
  ],
  "strategicSummary": "string"
}`;
}
