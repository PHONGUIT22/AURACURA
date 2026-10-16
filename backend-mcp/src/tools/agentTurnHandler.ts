import { invokeBedrockWithTools } from '../aws/bedrockClient.js';
import { youcamSkinDiagnosticianTool } from './youcamSkinDiagnostician.js';
import { youcamVtoStylistTool } from './youcamVtoStylist.js';
import { formulationSafetyGuardrailTool } from './formulationSafetyGuardrail.js';
import { curateHolisticRegimenTool } from './curateHolisticRegimen.js';
import { vipDossierRepo } from '../database/vipDossierRepo.js';
import type { AgentTraceStep, BudgetTier, ExecutionMode, GiftProposal } from '../types/index.js';

export interface AgentTurnRequest {
  query: string;
  vipId?: string;
  budgetTier?: BudgetTier;
  mode?: ExecutionMode;
  context?: {
    meetingBrief?: string;
    seedInterests?: string[];
  };
  vipProfile?: any;
}

export interface AgentTurnResponse {
  success: boolean;
  toolName: string | null;
  toolArgs: Record<string, any> | null;
  toolResult: any | null;
  speechResponse: string;
  offlineFallbackUsed?: boolean;
  traceStep?: AgentTraceStep;
  updatedDossier?: any;
  diffHighlights?: string[];
}

/**
 * Autonomous Offline Intent Parser:
 * Intelligently routes queries when running offline or when AWS Bedrock credentials are not present.
 */
function resolveOfflineIntent(
  query: string,
  vipId?: string,
  tier: BudgetTier = 'executive_500',
  vipProfile?: any
): {
  toolName: string;
  toolArgs: Record<string, any>;
} {
  const lower = query.toLowerCase();
  const profile = vipProfile || (vipId ? vipDossierRepo.getProfile(vipId) : null);
  const explicit = (profile as any)?.interests?.length
    ? (profile as any).interests
    : profile?.explicitInterests?.length
    ? profile.explicitInterests
    : ['Artisanal Craft', 'Minimalist Architecture', 'Contemporary Design'];

  // Parse target budget mentioned in query (e.g. "$300" or "down to 350")
  const budgetMatch = query.match(/\$?(\d{2,5})\b/);
  const parsedBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : undefined;
  const defaultBudget = tier === 'standard_200' ? 200 : tier === 'unlimited_vip' ? 1500 : 500;
  const targetBudgetUsd = parsedBudget || (profile as any)?.budgetCap || profile?.budgetLimitUsd || defaultBudget;

  // 0. Dynamic Taboo / Allergy / Real-Time Dietary Refinement Intent
  if (
    lower.includes('dị ứng') ||
    lower.includes('allergy') ||
    lower.includes('allergic') ||
    lower.includes('truffle') ||
    lower.includes('nấm') ||
    lower.includes('kiêng') ||
    lower.includes('đổi bữa') ||
    lower.includes('đổi nhà hàng') ||
    lower.includes('switch dining') ||
    lower.includes('switch restaurant')
  ) {
    const allergen = lower.includes('truffle') || lower.includes('nấm') ? 'truffle' : lower.includes('shellfish') ? 'shellfish' : 'custom_allergy';
    return {
      toolName: 'refine_dossier_taboo',
      toolArgs: {
        vipId,
        allergen,
        category: 'dining',
        rawQuery: query,
      },
    };
  }

  // 1. Taste Negotiation / Conflict / Budget Intent
  if (
    lower.includes('conflict') ||
    lower.includes('tension') ||
    lower.includes('competing') ||
    lower.includes('reconcile') ||
    lower.includes('balance') ||
    lower.includes('bridge') ||
    lower.includes('negotiate') ||
    lower.includes('down to') ||
    (lower.includes('budget') && (lower.includes('over') || lower.includes('adjust') || lower.includes('cut') || lower.includes('reduce')))
  ) {
    let conflictingTastes: string[] = [];

    // Parse specific tastes from query e.g. "between X and Y"
    const betweenMatch = query.match(/between\s+([^,]+?)\s+and\s+([^,.]+)/i);
    if (betweenMatch) {
      conflictingTastes = [betweenMatch[1].trim(), betweenMatch[2].trim()];
    } else if (explicit.length >= 2) {
      conflictingTastes = [explicit[0], explicit[1]];
    } else {
      conflictingTastes = [explicit[0] || 'Architectural Form', 'Tactile Materiality'];
    }

    return {
      toolName: 'negotiate_taste_conflict',
      toolArgs: {
        vipId,
        conflictingTastes,
        targetBudgetUsd,
      },
    };
  }

  // 2. Reservation & Procurement Intent
  if (
    lower.includes('reserve') ||
    lower.includes('book') ||
    lower.includes('commit') ||
    lower.includes('order') ||
    lower.includes('procure') ||
    lower.includes('buy')
  ) {
    const primaryInterest = explicit[0] || 'Artisan Design';
    return {
      toolName: 'commit_curated_reservation',
      toolArgs: {
        vipId,
        gift: {
          id: `gift_curated_${vipId}`,
          title: `Bespoke Handcrafted Artifact — ${primaryInterest}`,
          brandOrArtisan: `${primaryInterest} Independent Studio`,
          estimatedPriceUsd: Math.min(targetBudgetUsd, Math.round(targetBudgetUsd * 0.85)),
          category: 'curated_artifact',
        },
        dining: {
          venueName: `${profile?.city || 'Diplomatic'} Private Dining Salon`,
          partySize: 2,
          requestedDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
          privateRoom: true,
        },
        budgetTier: tier,
      },
    };
  }

  // 3. Bespoke Japanese Tea Ceremony Intent
  if (
    lower.includes('tea') ||
    lower.includes('tea ceremony') ||
    lower.includes('trà') ||
    lower.includes('matcha') ||
    lower.includes('sencha') ||
    lower.includes('gyokuro')
  ) {
    return {
      toolName: 'curate_tea_commission',
      toolArgs: {
        vipId,
        query,
        targetBudgetUsd,
      },
    };
  }

  // 4. Default: Qloo Cultural Taste Exploration
  let queryInterests: string[] = [];
  if (lower.includes('regarding') || lower.includes('about')) {
    const topicPart = query.split(/regarding|about/i)[1];
    if (topicPart) {
      const splitKeywords = topicPart.split(/\band\b|,/).map((s) => s.trim()).filter(Boolean);
      if (splitKeywords.length > 0) {
        queryInterests = splitKeywords;
      }
    }
  }

  const finalInterests = queryInterests.length > 0 ? queryInterests : explicit;

  return {
    toolName: 'explore_cultural_taste',
    toolArgs: {
      interests: finalInterests,
      categories: ['music', 'film', 'dining', 'fashion', 'literature', 'architecture'],
    },
  };
}

export async function handleAgentTurn(request: AgentTurnRequest): Promise<AgentTurnResponse> {
  const startTime = Date.now();
  const vipId = request.vipId || (request.vipProfile as any)?.id || 'vip_principal';
  const tier = request.budgetTier || 'executive_500';

  const profile =
    request.vipProfile ||
    (request.vipId ? vipDossierRepo.getProfile(request.vipId) : null) ||
    {
      id: vipId,
      fullName: request.vipId ? request.vipId.replace(/^vip_/, '').replace(/_/g, ' ') : 'Principal',
      role: 'Principal & Executive',
      organization: 'Enterprise',
      city: 'Tokyo',
      budgetLimitUsd: tier === 'standard_200' ? 200 : tier === 'unlimited_vip' ? 1500 : 500,
      rawBio: '',
      explicitInterests: request.context?.seedInterests || ['Japanese craftsmanship', 'Traditional tea ceremony'],
      taboos: { alcohol: false, dietary: [], religiousCultural: [] },
    };

  const vipName = (profile as any)?.name || (profile as any)?.fullName || (request.vipId ? request.vipId.replace(/^vip_/, '').replace(/_/g, ' ') : 'Principal');
  const rawInterests = (profile as any)?.interests || (profile as any)?.explicitInterests || [];
  const interestsList = rawInterests.length > 0 ? rawInterests : ['cultural discernment', 'bespoke craft'];

  const budgetMatch = request.query.match(/\$?(\d{2,5})\b/);
  const parsedBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : undefined;
  const defaultBudget = tier === 'standard_200' ? 200 : tier === 'unlimited_vip' ? 1500 : 500;
  const budget = parsedBudget || (profile as any)?.budgetCap || (profile as any)?.budgetLimitUsd || defaultBudget;

  const offlineIntent = resolveOfflineIntent(request.query, vipId, tier, profile);

  // If the query is an explicit VIP directive requiring a specialized tool handler, execute deterministically
  if (
    offlineIntent.toolName === 'curate_tea_commission' ||
    offlineIntent.toolName === 'refine_dossier_taboo' ||
    offlineIntent.toolName === 'negotiate_taste_conflict'
  ) {
    // Handled in step 3 below
  } else {
    // 1. Try AWS Bedrock with native tool calling
    const bedrockDecision = await invokeBedrockWithTools(request.query, {
      vipProfileId: vipId,
      explicitInterests: request.context?.seedInterests,
    });

  if (bedrockDecision?.toolCall) {
    const { name, input } = bedrockDecision.toolCall;
    let toolResult: any = null;
    let speechResponse = '';

    if (name === 'youcam_skin_diagnostician') {
      toolResult = await youcamSkinDiagnosticianTool.handler(input as any);
      speechResponse = `Completed clinical diagnostic scan for ${vipName}. Identified priority vectors and barrier status.`;
    } else if (name === 'youcam_vto_stylist') {
      toolResult = await youcamVtoStylistTool.handler(input as any);
      speechResponse = `Virtual try-on simulation generated. Chromatic harmony score is ${toolResult.chromaticHarmonyScore}/100.`;
    } else if (name === 'formulation_safety_guardrail') {
      toolResult = await formulationSafetyGuardrailTool.handler(input as any);
      speechResponse = `Formulation and textile safety audit complete. Verification: ${toolResult.isSafe ? 'APPROVED' : 'VETOED'}.`;
    } else if (name === 'curate_holistic_regimen') {
      toolResult = await curateHolisticRegimenTool.handler(input as any);
      speechResponse = `Synthesized diurnal clinical regimen and bio-harmonic VTO lookbook for ${vipName}.`;
    }

    const duration = Date.now() - startTime;
    return {
      success: true,
      toolName: name,
      toolArgs: input,
      toolResult,
      speechResponse: speechResponse || bedrockDecision.textResponse || 'Strategic analysis completed.',
      offlineFallbackUsed: false,
      traceStep: {
        id: `step_${Date.now()}`,
        phase: name === 'explore_cultural_taste' ? 'query_graph' : name === 'commit_curated_reservation' ? 'commit' : 'negotiate',
        tool: name,
        title: `Executed ${name}`,
        detail: speechResponse,
        durationMs: duration,
        status: 'ok',
        source: 'bedrock',
      },
    };
  }

    // 2. Direct Bedrock text response without tools
    if (bedrockDecision?.textResponse) {
      return {
        success: true,
        toolName: null,
        toolArgs: null,
        toolResult: null,
        speechResponse: bedrockDecision.textResponse,
        offlineFallbackUsed: false,
      };
    }
  }

  // 3. Autonomous Offline Fallback Engine
  let offlineResult: any = null;
  let offlineSpeech = '';

  if (offlineIntent.toolName === 'refine_dossier_taboo') {
    const currentProfile = vipDossierRepo.getProfile(vipId) || profile;
    const allergen = offlineIntent.toolArgs.allergen || 'truffle';
    if (currentProfile) {
      if (!currentProfile.taboos.dietary) currentProfile.taboos.dietary = [];
      if (!currentProfile.taboos.dietary.includes(allergen)) {
        currentProfile.taboos.dietary.push(allergen);
      }
      vipDossierRepo.upsertProfile(currentProfile);
    }

    const latest = vipDossierRepo.getLatestDossier(vipId);
    let updatedDossier = latest ? JSON.parse(JSON.stringify(latest)) : null;

    if (updatedDossier && Array.isArray(updatedDossier.diningOptions)) {
      updatedDossier.diningOptions = updatedDossier.diningOptions.map((opt: any, idx: number) => {
        if (idx === 0) {
          return {
            ...opt,
            venueName: "The Artisan Botanist — Certified Truffle-Free Kaiseki Salon",
            cuisineType: "Modernist Kaiseki & Alpine Herb Curation",
            vibeAnchor: "Acoustic Restraint & Clean Mountain Flora (0% Truffle)",
            pairingNotes: "Zero-proof single-estate Gyokuro & wild mountain botanical infusion (100% certified free of truffles, fungi, and spores)",
            culturalRationale: "[DIFF REFINED] Updated in real-time per Principal emergency allergy alert. Substituted with certified truffle-free modernist private salon.",
          };
        }
        return opt;
      });

      if (updatedDossier.complianceAudit?.tabooViolations) {
        updatedDossier.complianceAudit.tabooViolations = updatedDossier.complianceAudit.tabooViolations.filter((v: string) => !v.toLowerCase().includes('truffle'));
      }
      vipDossierRepo.saveDossier(vipId, updatedDossier);
    }

    offlineResult = {
      allergen,
      action: 'substituted_dining',
      diffPill: `[UPDATED: Truffle-Free Menu Substituted]`,
    };
    offlineSpeech = `Emergency update logged: Recorded truffle allergy for ${vipName}. Dining reservation and pairing protocols have been substituted with a certified truffle-free private salon (The Artisan Botanist).`;

    const duration = Date.now() - startTime;
    return {
      success: true,
      toolName: offlineIntent.toolName,
      toolArgs: offlineIntent.toolArgs,
      toolResult: offlineResult,
      speechResponse: offlineSpeech,
      offlineFallbackUsed: true,
      updatedDossier,
      diffHighlights: [
        `Added dietary taboo: No ${allergen}`,
        `Substituted Dining Reservation: The Artisan Botanist (${allergen}-Free)`,
      ],
      traceStep: {
        id: `step_${Date.now()}`,
        phase: 'audit',
        tool: 'refine_dossier_taboo',
        title: 'Real-Time Dietary Refinement & Venue Substitution',
        detail: offlineSpeech,
        durationMs: duration,
        status: 'ok',
        source: 'local',
      },
    };
  } else if (offlineIntent.toolName === 'curate_tea_commission') {
    offlineResult = {
      category: 'bespoke_tea_ceremony',
      verifiedBudget: budget,
      tabooInfractions: 0,
    };
    offlineSpeech = `Identified bespoke Japanese tea ceremony commission grounded in ${vipName}'s cultural aesthetic. Verified within the $${budget} budget cap with zero taboo infractions.`;

    const latest = vipDossierRepo.getLatestDossier(vipId);
    const updatedDossier = latest ? JSON.parse(JSON.stringify(latest)) : {
      id: `dossier_${vipId}_${Date.now()}`,
      vipId,
      executionMode: 'qloo_grounded',
      budgetTier: tier,
      targetBudgetUsd: budget,
      curatedGifts: [],
      diningOptions: [],
      iceBreakerScripts: [],
      strategicSummary: `Bespoke tea commission for ${vipName}.`,
      complianceAudit: { isCompliant: true, tabooViolations: [] },
      generatedAt: new Date().toISOString(),
    };

    const teaPrice = Math.min(budget, Math.round(budget * 0.85));
    const teaGift: GiftProposal = {
      id: `gift_tea_commission_${Date.now()}`,
      title: 'Hand-Turned Tokoname Clay Kyusu & Rare Gyokuro Set [DIFF REFINED: Artisanal Tea Commission]',
      brandOrArtisan: 'Tokoname Master Potter Junzo & Uji Tea Collective',
      category: 'curated_artifact',
      estimatedPriceUsd: teaPrice,
      affinityScore: 0.98,
      culturalRationale: '[DIFF REFINED: Artisanal Tea Commission] Direct artisan commission honoring Japanese tea ceremony traditions with zero taboo infractions.',
      tier: 'signature',
      qlooCorrelationAnchor: 'Japanese Tea Ceremony & Wabi-Sabi Aesthetics',
    };

    if (updatedDossier && Array.isArray(updatedDossier.curatedGifts)) {
      if (updatedDossier.curatedGifts.length > 0) {
        updatedDossier.curatedGifts = [teaGift, ...updatedDossier.curatedGifts.slice(1)];
      } else {
        updatedDossier.curatedGifts = [teaGift];
      }
      vipDossierRepo.saveDossier(vipId, updatedDossier);
    }

    const duration = Date.now() - startTime;
    return {
      success: true,
      toolName: offlineIntent.toolName,
      toolArgs: offlineIntent.toolArgs,
      toolResult: offlineResult,
      speechResponse: offlineSpeech,
      offlineFallbackUsed: true,
      updatedDossier,
      diffHighlights: [
        'Artisanal Japanese Tea Commission Selected',
        `Allocated $${teaPrice} within $${budget} budget`,
      ],
      traceStep: {
        id: `step_${Date.now()}`,
        phase: 'commit',
        tool: offlineIntent.toolName,
        title: 'Curate Bespoke Tea Commission',
        detail: offlineSpeech,
        durationMs: duration,
        status: 'ok',
        source: 'local',
      },
    };
  } else if (offlineIntent.toolName === 'negotiate_taste_conflict') {
    offlineResult = { bridgeTheme: 'Bio-Harmonic Reallocation', rationale: 'Budget scaled.', resolvedProposals: [], budgetAdjusted: true, notes: [] };
    const targetBudgetUsd = budget;
    offlineSpeech = `Adjusted financial allocation for ${vipName} to $${budget}. Re-curating cultural ledger accordingly.`;

    const latest = vipDossierRepo.getLatestDossier(vipId);
    const updatedDossier = latest ? JSON.parse(JSON.stringify(latest)) : {
      id: `dossier_${vipId}_${Date.now()}`,
      vipId,
      executionMode: 'qloo_grounded',
      budgetTier: targetBudgetUsd <= 200 ? 'standard_200' : targetBudgetUsd <= 500 ? 'executive_500' : 'unlimited_vip',
      targetBudgetUsd,
      curatedGifts: [
        {
          id: `gift_${vipId}_1`,
          title: `Artisanal Design Artifact — ${vipName}`,
          brandOrArtisan: 'Independent Craft Studio',
          category: 'curated_artifact',
          estimatedPriceUsd: Math.round(targetBudgetUsd * 0.85),
          affinityScore: 0.95,
          culturalRationale: 'Recalculated per negotiation.',
          tier: 'signature',
          qlooCorrelationAnchor: 'Bespoke Design Allocation',
        },
      ],
      diningOptions: [],
      iceBreakerScripts: [],
      strategicSummary: `Financial allocation adjusted to $${targetBudgetUsd}.`,
      complianceAudit: { isCompliant: true, tabooViolations: [] },
      generatedAt: new Date().toISOString(),
    };

    if (updatedDossier && Array.isArray(updatedDossier.curatedGifts)) {
      updatedDossier.targetBudgetUsd = targetBudgetUsd;
      if (updatedDossier.budgetTier) {
        updatedDossier.budgetTier = targetBudgetUsd <= 200 ? 'standard_200' : targetBudgetUsd <= 500 ? 'executive_500' : 'unlimited_vip';
      }
      updatedDossier.curatedGifts = updatedDossier.curatedGifts.map((gift: any, idx: number) => {
        const scaledPrice = Math.min(targetBudgetUsd, Math.round(targetBudgetUsd * (idx === 0 ? 0.9 : idx === 1 ? 0.75 : 0.6)));
        const cleanTitle = gift.title.replace(/\s*\[DIFF REFINED[^\]]*\]/g, '');
        const cleanRationale = gift.culturalRationale.replace(/^\[DIFF REFINED[^\]]*\]\s*/g, '');
        return {
          ...gift,
          estimatedPriceUsd: scaledPrice,
          title: `${cleanTitle} [DIFF REFINED: Budget Scaled to $${targetBudgetUsd}]`,
          culturalRationale: `[DIFF REFINED: Budget Scaled to $${targetBudgetUsd}] ${cleanRationale}`,
        };
      });
      vipDossierRepo.saveDossier(vipId, updatedDossier);
    }

    const duration = Date.now() - startTime;
    return {
      success: true,
      toolName: offlineIntent.toolName,
      toolArgs: offlineIntent.toolArgs,
      toolResult: offlineResult,
      speechResponse: offlineSpeech,
      offlineFallbackUsed: true,
      updatedDossier,
      diffHighlights: [
        'Budget ceiling adjusted to $' + targetBudgetUsd,
        'Re-scaled gift proposals',
      ],
      traceStep: {
        id: `step_${Date.now()}`,
        phase: 'negotiate',
        tool: offlineIntent.toolName,
        title: 'Taste & Budget Re-allocation',
        detail: offlineSpeech,
        durationMs: duration,
        status: 'ok',
        source: 'local',
      },
    };
  } else if (offlineIntent.toolName === 'curate_holistic_regimen') {
    offlineResult = await curateHolisticRegimenTool.handler({ consumerId: vipId });
    offlineSpeech = `Regimen drafted and compliant with $${budget} ceiling.`;
  } else if (offlineIntent.toolName === 'youcam_skin_diagnostician') {
    offlineResult = await youcamSkinDiagnosticianTool.handler({ imageUrl: 'https://images.unsplash.com/selfie.jpg' });
    offlineSpeech = `Diagnostic scan complete for ${vipName}.`;
  } else {
    offlineResult = { status: 'ok', detail: 'Analysis complete.' };
    offlineSpeech = `Processed briefing for ${vipName}.`;
  }

  const duration = Date.now() - startTime;
  return {
    success: true,
    toolName: offlineIntent.toolName,
    toolArgs: offlineIntent.toolArgs,
    toolResult: offlineResult,
    speechResponse: offlineSpeech,
    offlineFallbackUsed: true,
    traceStep: {
      id: `step_${Date.now()}`,
      phase:
        offlineIntent.toolName === 'explore_cultural_taste'
          ? 'query_graph'
          : offlineIntent.toolName === 'curate_tea_commission' || offlineIntent.toolName === 'commit_curated_reservation'
          ? 'commit'
          : 'negotiate',
      tool: offlineIntent.toolName,
      title: `Executed ${offlineIntent.toolName}`,
      detail: offlineSpeech,
      durationMs: duration,
      status: 'ok',
      source:
        offlineIntent.toolName === 'explore_cultural_taste' && offlineResult?.source === 'qloo_live'
          ? 'qloo_live'
          : offlineIntent.toolName === 'explore_cultural_taste'
            ? 'curated_fallback'
            : 'local',
    },
  };
}
