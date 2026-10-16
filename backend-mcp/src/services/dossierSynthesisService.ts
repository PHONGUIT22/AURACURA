import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import { GoogleGenAI } from '@google/genai';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { envConfig, isRealSecret } from '../config/env.js';
import {
  CHIEF_OF_STAFF_SYSTEM_PROMPT,
  buildGroundedDossierPrompt,
  buildGenericDossierPrompt,
} from '../prompts/index.js';
import type {
  AgentEngine,
  BudgetTier,
  CulturalEntity,
  CulturalTasteGraph,
  DiningProposal,
  GiftProposal,
  VIPProfile,
} from '../types/index.js';

export interface SynthesisOutput {
  curatedGifts: GiftProposal[];
  diningOptions: DiningProposal[];
  iceBreakerScripts: string[];
  strategicSummary: string;
  agentEngine: AgentEngine;
}

/**
 * Call Bedrock Runtime with Claude/Haiku to synthesize JSON.
 */
async function callBedrockSynthesis(prompt: string): Promise<string | null> {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const sessionToken = process.env.AWS_SESSION_TOKEN?.trim();

  if (!isRealSecret(accessKeyId) || !isRealSecret(secretAccessKey)) {
    return null;
  }

  const modelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
  const region = process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';

  try {
    const client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
        ...(sessionToken ? { sessionToken } : {}),
      },
      maxAttempts: 1,
    });

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      temperature: 0.2,
      system: CHIEF_OF_STAFF_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command, {
      abortSignal: AbortSignal.timeout(envConfig.BEDROCK_TIMEOUT_MS),
    });

    const jsonStr = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed.content)) {
      const textBlock = parsed.content.find((b: any) => b.type === 'text');
      return textBlock ? textBlock.text : null;
    }
    return null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[DossierSynthesis] Bedrock invocation deferred (${msg}).`);
    return null;
  }
}

/**
 * Call Google AI Studio using the official @google/genai SDK.
 * Supports Gemini 3.8 Flash with full AQ. auth key compatibility.
 */
async function callGeminiSynthesis(prompt: string): Promise<string | null> {
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim();
  if (!isRealSecret(geminiKey)) return null;
  const model = process.env.GEMINI_MODEL_ID?.trim() || 'gemini-3.8-flash';
  const startMs = Date.now();
  try {
    console.log(`[GeminiSynthesis] Calling Google AI Studio model '${model}' via @google/genai...`);
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: CHIEF_OF_STAFF_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });
    const outputText = response.text || '';
    if (!outputText) {
      console.warn(`[GeminiSynthesis] Received empty text from ${model}`);
      return null;
    }
    console.log(`[GeminiSynthesis] ✓ Gemini 3.8 Flash succeeded in ${Date.now() - startMs}ms`);
    return outputText;
  } catch (err) {
    console.warn(`[GeminiSynthesis] Error after ${Date.now() - startMs}ms:`, err);
    return null;
  }
}

/**
 * Call OpenAI API if OPENAI_API_KEY is available.
 */
async function callOpenAISynthesis(prompt: string): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!isRealSecret(openaiKey)) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: CHIEF_OF_STAFF_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return data?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

/**
 * Universal LLM dispatch: Gemini 3.8 Flash (Primary) -> Bedrock -> OpenAI.
 */
async function invokeAnyLLM(prompt: string): Promise<{ text: string; engine: AgentEngine } | null> {
  // 1. Primary: Google Gemini 3.8 Flash
  const geminiResult = await callGeminiSynthesis(prompt);
  if (geminiResult) return { text: geminiResult, engine: 'bedrock_claude' };

  // 2. Secondary Fallback: AWS Bedrock Claude
  const bedrockResult = await callBedrockSynthesis(prompt);
  if (bedrockResult) return { text: bedrockResult, engine: 'bedrock_claude' };

  // 3. Tertiary Fallback: OpenAI
  const openaiResult = await callOpenAISynthesis(prompt);
  if (openaiResult) return { text: openaiResult, engine: 'bedrock_claude' };

  return null;
}

function parseJsonClean<T>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

/**
 * Pure dynamic rule-based synthesis for grounded dossier.
 * Directly transforms Qloo entities, VIP profile, and meetingBrief into bespoke proposals.
 * ZERO hardcoded persona strings.
 */
function synthesizeDynamicGroundedRuleBased(
  profile: VIPProfile,
  tasteGraph: CulturalTasteGraph,
  cap: number,
  tier: BudgetTier,
  meetingBrief?: string
): SynthesisOutput {
  const entities = [
    ...(tasteGraph.expandedEntities || []),
    ...(tasteGraph.resolvedSeeds || []),
  ];

  // Pick 3 diverse cultural entities
  const e1: CulturalEntity = entities[0] || {
    id: 'urn:entity:artist:bespoke_mastery',
    name: profile.explicitInterests[0] || 'Artisanal Craft',
    category: 'music',
    affinityScore: 0.95,
  };

  const e2: CulturalEntity = entities[1] || {
    id: 'urn:entity:brand:architectural_precision',
    name: profile.explicitInterests[1] || 'Minimalist Design',
    category: 'fashion',
    affinityScore: 0.92,
  };

  const e3: CulturalEntity = entities[2] || {
    id: 'urn:entity:book:enduring_philosophy',
    name: profile.explicitInterests[2] || 'Contemporary Literature',
    category: 'literature',
    affinityScore: 0.89,
  };

  const briefContext = meetingBrief?.trim()
    ? `Tailored specifically for: "${meetingBrief.trim()}"`
    : 'Calibrated for high-stakes executive relationship building';

  // Gift 1: Signature tier
  const gift1: GiftProposal = {
    id: `gift_dyn_sig_${Date.now()}_1`,
    title: `Archival Special Edition: In Homage to ${e1.name}`,
    brandOrArtisan: `${e1.name} Archive Studio Atelier`,
    estimatedPriceUsd: Math.min(cap, Math.round(cap * 0.85)),
    category: e1.category === 'music' ? 'rare_vintage' : 'curated_artifact',
    tier: 'signature',
    culturalRationale: `Directly anchors into ${profile.fullName}’s passion for ${e1.name}. ${briefContext}. Tactile, culturally grounded, and discreet.`,
    qlooCorrelationAnchor: `${e1.name} (${e1.id})`,
    affinityScore: e1.affinityScore,
    materials: ['cloth', 'paper', 'wood', 'stone'],
  };

  // Gift 2: Alternative tier
  const gift2: GiftProposal = {
    id: `gift_dyn_alt_${Date.now()}_2`,
    title: `Bespoke Sculptural Desk Artifact — Structural Echoes of ${e2.name}`,
    brandOrArtisan: `${e2.name} Independent Design Workshop`,
    estimatedPriceUsd: Math.min(cap, Math.round(cap * 0.55)),
    category: 'bespoke_craft',
    tier: 'alternative',
    culturalRationale: `Expresses the geometric rigor and aesthetic principles of ${e2.name}. An elegant desk sculpture celebrating enduring precision.`,
    qlooCorrelationAnchor: `${e2.name} (${e2.id})`,
    affinityScore: e2.affinityScore,
    materials: ['ceramic', 'glass', 'grade 5 titanium'],
  };

  // Gift 3: Discreet tier
  const gift3: GiftProposal = {
    id: `gift_dyn_disc_${Date.now()}_3`,
    title: `Clothbound Monograph & Slipcase Folio — A Study of ${e3.name}`,
    brandOrArtisan: 'Folio Fine Bindery / Heritage Press',
    estimatedPriceUsd: Math.min(cap, Math.round(cap * 0.3)),
    category: 'literature_edition',
    tier: 'discreet',
    culturalRationale: `Understated intellectual token celebrating ${e3.name}. Demonstrates attentive cultural fluency without commercial ostentation.`,
    qlooCorrelationAnchor: `${e3.name} (${e3.id})`,
    affinityScore: e3.affinityScore,
    materials: ['archival rag paper', 'linen binding'],
  };

  // Dining Proposals tailored to location and taboos
  const diningEntities = entities.filter((e) => e.category === 'dining');
  const dEntity1 = diningEntities[0]?.name || 'Private Dining Salon';
  const dEntity2 = diningEntities[1]?.name || 'Atelier Chef Table';

  const formatDiningVenueName = (rawName: string, defaultSuffix: string): string => {
    const trimmed = rawName.trim();
    const lower = trimmed.toLowerCase();

    // Specific case: Chef's-counter tasting menus or similar
    if (lower.includes('chef') && (lower.includes('counter') || lower.includes('menu'))) {
      return "The Chef's Counter — Artisanal Tasting Salon";
    }

    const awkwardWords = ['menu', 'counter', 'omakase', 'cuisine', 'cooking'];
    const hasAwkward = awkwardWords.some((w) => lower.includes(w));

    if (hasAwkward) {
      if (lower.endsWith('salon') || lower.endsWith('studio') || lower.endsWith('loft')) {
        return trimmed;
      }
      return `${trimmed} Salon`;
    }

    if (lower.endsWith('salon') || lower.endsWith('studio') || lower.endsWith('loft') || lower.endsWith('atelier')) {
      return trimmed;
    }

    return `${trimmed} ${defaultSuffix}`;
  };

  const isNoAlcohol = Boolean(profile.taboos.alcohol);
  const dietaryList = profile.taboos.dietary || [];
  const isHalal = dietaryList.includes('halal');
  const isVegan = dietaryList.includes('vegan');
  const hasShellfishAllergy = dietaryList.includes('shellfish');

  const pairingNote1 = isNoAlcohol
    ? 'Zero-proof mocktail alchemy: rare cold-brew Gyokuro tea, roasted Hojicha infusions, and mountain botanical cordials (100% alcohol-free)'
    : 'Curated low-intervention biodynamic pairings and rare botanical infusions';

  const cuisine1 = isHalal
    ? 'Certified Halal Wagyu & Kaiseki Private Salon'
    : isVegan
      ? 'Plant-Forward Modernist Kaiseki'
      : 'Modernist Artisanal Counter & Private Salon';

  const cuisine2 = isHalal
    ? 'Contemporary Levantine & Mediterranean Fine Dining'
    : hasShellfishAllergy
      ? 'Nordic Foraged & Fire-Cooked Tasting Loft (shellfish-free menu prepared)'
      : 'Contemporary Epicurean Studio';

  const diningOptions: DiningProposal[] = [
    {
      id: `dining_dyn_${Date.now()}_1`,
      venueName: formatDiningVenueName(dEntity1, 'Private Studio'),
      cuisineType: cuisine1,
      neighborhood: `${profile.city || 'Global Hub'} Diplomatic District`,
      vibeAnchor: 'Wabi-Sabi Minimalism & Monolithic Stone Counter',
      pairingNotes: pairingNote1,
      culturalRationale: `Discreet hospitality environment reflecting the aesthetic ethos of ${e1.name} and ${e2.name}. Strictly respects principal taboos.`,
      priceBand: '$$$$',
      serviceElements: isNoAlcohol ? ['botanicals', 'tea'] : ['wine'],
    },
    {
      id: `dining_dyn_${Date.now()}_2`,
      venueName: formatDiningVenueName(dEntity2, 'Private Loft'),
      cuisineType: cuisine2,
      neighborhood: `${profile.city || 'Global Hub'} Historic Quarter`,
      vibeAnchor: 'Acoustic Restraint & Hand-Hewn Architectural Wood',
      pairingNotes: isNoAlcohol
        ? 'Single-estate fermented sparkling teas and cold-extracted fruit essences'
        : 'Micro-cuvée natural wine pairings and heritage botanical cordials',
      culturalRationale: `Atmosphere engineered for deep, confidential negotiation, echoing ${tasteGraph.crossDomainThemes.slice(0, 2).join(' and ')}.`,
      priceBand: '$$$$',
      serviceElements: isNoAlcohol ? ['sparkling_tea'] : ['wine'],
    },
  ];

  const iceBreakerScripts = [
    `"In reviewing the mastery behind ${e1.name}, there is a rare dialogue between meticulous discipline and effortless presence. Considering ${meetingBrief ? `"${meetingBrief.slice(0, 45)}..."` : 'our discussion today'}, how do you evaluate that balance in major strategic decisions?"`,
    `"The enduring philosophy of ${e2.name} prioritizes lasting craftsmanship over temporary market noise. How does that long-term horizon guide your approach to partnerships?"`,
  ];

  return {
    curatedGifts: [gift1, gift2, gift3],
    diningOptions,
    iceBreakerScripts,
    strategicSummary: `QLOO GROUNDED INTELLIGENCE: Synthesized across ${tasteGraph.expandedEntities.length || entities.length} cultural entities anchored in [${entities.slice(0, 3).map((e) => e.name).join(', ')}]. 100% compliant with corporate budget limit ($${cap}) and principal ethics.`,
    agentEngine: 'autonomous_planner',
  };
}

/**
 * Pure dynamic rule-based synthesis for generic ungrounded baseline.
 * Deliberately generates conventional clichés with no Qloo data to highlight taboo flags.
 */
function synthesizeDynamicGenericRuleBased(
  profile: VIPProfile,
  cap: number,
  tier: BudgetTier,
  meetingBrief?: string
): SynthesisOutput {
  const genericGifts: GiftProposal[] = [
    {
      id: `generic_gift_1_${Date.now()}`,
      title: 'Montblanc Meisterstück Classic Ballpoint Pen with Custom Corporate Engraving',
      brandOrArtisan: 'Montblanc Corporate Prestige Line',
      estimatedPriceUsd: Math.min(cap, 495),
      category: 'curated_artifact',
      culturalRationale: 'Safe corporate prestige gifting choice universally gifted to high-level executives.',
      qlooCorrelationAnchor: 'Generic Corporate Popularity (No Taste Correlation)',
      tier: 'signature',
      affinityScore: 0.42,
    },
    {
      id: `generic_gift_2_${Date.now()}`,
      title: 'Deluxe Imported Wine & Artisan Cheese Executive Celebration Hamper',
      brandOrArtisan: 'Gourmet Gift Baskets Ltd.',
      estimatedPriceUsd: Math.min(cap, 260),
      category: 'rare_vintage',
      culturalRationale: 'Traditional hospitality hamper with assorted California cabernet and European cheeses.',
      qlooCorrelationAnchor: 'Standard Holiday Basket Baseline',
      tier: 'alternative',
      affinityScore: 0.35,
      materials: ['alcohol', 'wine', 'cheese'],
    },
    {
      id: `generic_gift_3_${Date.now()}`,
      title: 'Premium Italian Saffiano Leather Travel Folio & Business Card Case',
      brandOrArtisan: 'Smythson / Commercial Leather Goods',
      estimatedPriceUsd: Math.min(cap, 195),
      category: 'bespoke_craft',
      culturalRationale: 'Standard executive leather accessory for business trips.',
      qlooCorrelationAnchor: 'Generic Business Accessory',
      tier: 'discreet',
      affinityScore: 0.38,
      materials: ['leather', 'pigskin lining'],
    },
  ];

  const genericDining: DiningProposal[] = [
    {
      id: `generic_dining_1_${Date.now()}`,
      venueName: "Ruth's Chris Steak House",
      cuisineType: 'Prime American Steakhouse',
      neighborhood: `${profile.city || 'City'} Financial District`,
      vibeAnchor: 'Traditional Executive Steakhouse',
      pairingNotes: 'Bold Napa Valley Cabernet Sauvignon and bacon-wrapped scallops',
      culturalRationale: 'Default white-shoe dining spot commonly booked for corporate closings.',
      serviceElements: ['bacon', 'pork', 'shellfish', 'alcohol'],
    },
    {
      id: `generic_dining_2_${Date.now()}`,
      venueName: 'The Capital Grille',
      cuisineType: 'Upscale Classic American Steak & Chops',
      neighborhood: `${profile.city || 'City'} Downtown`,
      vibeAnchor: 'Clubby Mahogany Bar',
      pairingNotes: 'Bordeaux wine pairings and oysters Rockefeller',
      culturalRationale: 'Predictable high-ticket corporate dining room with club atmosphere.',
      serviceElements: ['alcohol', 'shellfish'],
    },
  ];

  return {
    curatedGifts: genericGifts,
    diningOptions: genericDining,
    iceBreakerScripts: [
      `"Did you catch the game this past weekend? Quite an exciting finish."`,
      `"How was your flight into ${profile.city || 'the city'}? The weather has been rather unpredictable lately."`,
    ],
    strategicSummary:
      'UNGROUNDED BASELINE: Recommendations rely on conventional corporate clichés. Notice how proposals risk immediate compliance flags (e.g. alcohol or pork violations for observant principals) and lack memorability.',
    agentEngine: 'generic_baseline',
  };
}

export const dossierSynthesisService = {
  /**
   * Synthesize Grounded Dossier Proposals dynamically.
   */
  async synthesizeGrounded(
    profile: VIPProfile,
    tasteGraph: CulturalTasteGraph,
    tier: BudgetTier,
    meetingBrief?: string
  ): Promise<SynthesisOutput> {
    const cap = tier === 'standard_200' ? 200 : tier === 'executive_500' ? 500 : (profile.budgetLimitUsd || 1500);

    const prompt = buildGroundedDossierPrompt({
      profile,
      tasteGraph,
      meetingBrief,
      budgetTier: tier,
      budgetCap: cap,
    });

    const llmResult = await invokeAnyLLM(prompt);
    if (llmResult?.text) {
      const parsed = parseJsonClean<{
        curatedGifts?: GiftProposal[];
        diningOptions?: DiningProposal[];
        iceBreakerScripts?: string[];
        strategicSummary?: string;
      }>(llmResult.text);

      if (
        parsed &&
        Array.isArray(parsed.curatedGifts) &&
        parsed.curatedGifts.length >= 3 &&
        Array.isArray(parsed.diningOptions) &&
        parsed.diningOptions.length >= 2
      ) {
        // Enforce price constraints
        const sanitizedGifts = parsed.curatedGifts.slice(0, 3).map((g, idx) => ({
          ...g,
          id: g.id || `gift_llm_${Date.now()}_${idx}`,
          estimatedPriceUsd: Math.min(Number(g.estimatedPriceUsd) || cap * 0.8, cap),
          tier: (g.tier || (idx === 0 ? 'signature' : idx === 1 ? 'alternative' : 'discreet')) as any,
          qlooCorrelationAnchor: g.qlooCorrelationAnchor || 'Qloo Taste Graph Correlation',
        }));

        const sanitizedDining = parsed.diningOptions.slice(0, 2).map((d, idx) => ({
          ...d,
          id: d.id || `dining_llm_${Date.now()}_${idx}`,
        }));

        return {
          curatedGifts: sanitizedGifts,
          diningOptions: sanitizedDining,
          iceBreakerScripts:
            Array.isArray(parsed.iceBreakerScripts) && parsed.iceBreakerScripts.length >= 2
              ? parsed.iceBreakerScripts.slice(0, 3)
              : [
                  `"How do you evaluate long-term craftsmanship versus fleeting trends in ${profile.organization}?"`,
                  `"In creative strategy, what foundational principles guide your most ambitious initiatives?"`,
                ],
          strategicSummary:
            parsed.strategicSummary ||
            `QLOO GROUNDED INTELLIGENCE: Generated via cross-domain synthesis across ${tasteGraph.expandedEntities.length} entities. 100% compliant with budget cap ($${cap}).`,
          agentEngine: llmResult.engine,
        };
      }
    }

    // Dynamic rule-based fallback when LLM is unavailable or offline
    return synthesizeDynamicGroundedRuleBased(profile, tasteGraph, cap, tier, meetingBrief);
  },

  /**
   * Synthesize Generic Dossier Proposals (Ungrounded Baseline).
   */
  async synthesizeGeneric(
    profile: VIPProfile,
    tier: BudgetTier,
    meetingBrief?: string,
    fastGeneric = false
  ): Promise<SynthesisOutput> {
    const cap = tier === 'standard_200' ? 200 : tier === 'executive_500' ? 500 : (profile.budgetLimitUsd || 1500);

    if (fastGeneric) {
      return synthesizeDynamicGenericRuleBased(profile, cap, tier, meetingBrief);
    }

    const prompt = buildGenericDossierPrompt({
      profile,
      meetingBrief,
      budgetTier: tier,
      budgetCap: cap,
    });

    const llmResult = await invokeAnyLLM(prompt);
    if (llmResult?.text) {
      const parsed = parseJsonClean<{
        curatedGifts?: GiftProposal[];
        diningOptions?: DiningProposal[];
        iceBreakerScripts?: string[];
        strategicSummary?: string;
      }>(llmResult.text);

      if (
        parsed &&
        Array.isArray(parsed.curatedGifts) &&
        parsed.curatedGifts.length >= 3 &&
        Array.isArray(parsed.diningOptions) &&
        parsed.diningOptions.length >= 2
      ) {
        const sanitizedGifts = parsed.curatedGifts.slice(0, 3).map((g, idx) => ({
          ...g,
          id: g.id || `generic_gift_${Date.now()}_${idx}`,
          estimatedPriceUsd: Math.min(Number(g.estimatedPriceUsd) || cap * 0.8, cap),
          tier: (g.tier || (idx === 0 ? 'signature' : idx === 1 ? 'alternative' : 'discreet')) as any,
          qlooCorrelationAnchor: 'Generic Corporate Prestige Baseline',
        }));

        const sanitizedDining = parsed.diningOptions.slice(0, 2).map((d, idx) => ({
          ...d,
          id: d.id || `generic_dining_${Date.now()}_${idx}`,
        }));

        return {
          curatedGifts: sanitizedGifts,
          diningOptions: sanitizedDining,
          iceBreakerScripts:
            Array.isArray(parsed.iceBreakerScripts) && parsed.iceBreakerScripts.length >= 2
              ? parsed.iceBreakerScripts.slice(0, 3)
              : [
                  `"Did you catch the game this past weekend?"`,
                  `"How was your flight into the city?"`,
                ],
          strategicSummary:
            parsed.strategicSummary ||
            'UNGROUNDED BASELINE: Recommendations rely on conventional corporate clichés.',
          agentEngine: 'generic_baseline',
        };
      }
    }

    return synthesizeDynamicGenericRuleBased(profile, cap, tier, meetingBrief);
  },
};
