/**
 * AuraCura Core Domain Schema & Type Definitions
 * System: Autonomous Bio-Harmonic eCommerce VTO & Skin-Safe Styling
 *
 * NOTE: This file is mirrored verbatim in frontend/src/types/index.ts - keep both 100% in sync.
 */

// ============================================================================
// 1. BIOMETRIC & DERMATOLOGICAL DOMAIN TYPES
// ============================================================================

/**
 * Skin tone undertone classification for chromatic harmony analysis.
 */
export type SkinToneUndertone = 'cool_fair' | 'neutral_medium' | 'warm_deep' | 'olive';

/**
 * Skin barrier health and integrity status.
 */
export type SkinBarrierStatus = 'healthy' | 'compromised' | 'severely_damaged';

/**
 * Clinical and optical skin metrics measured from facial diagnostic scans.
 */
export interface SkinMetrics {
  /** Acne score: 0 (clear) to 100 (severe) */
  acneScore: number;
  /** Redness/erythema score: 0 (none) to 100 (extreme) */
  rednessScore: number;
  /** Moisture/hydration score: 0 (dehydrated) to 100 (optimal) */
  moistureScore: number;
  /** Pore dilation score: 0 (tight/invisible) to 100 (severely enlarged) */
  poreScore: number;
  /** Fine lines and wrinkle score: 0 (smooth) to 100 (deep) */
  wrinkleScore: number;
  /** Dark circles / periorbital hyperpigmentation score: 0 (none) to 100 (pronounced) */
  darkCircleScore: number;
  /** Biological skin age estimated via clinical vision diagnostics */
  skinAge: number;
  /** Chronological age of the user in years */
  chronologicalAge: number;
  /** Detected skin undertone for chromatic color matching */
  undertone: SkinToneUndertone;
  /** Stratum corneum barrier integrity status */
  barrierStatus: 'healthy' | 'compromised' | 'severely_damaged';
}

// ============================================================================
// 2. APPAREL & VIRTUAL TRY-ON (VTO) DOMAIN TYPES
// ============================================================================

/**
 * Categories of apparel supported in the AuraCura VTO and styling catalog.
 */
export type ApparelCategory =
  | 'evening_gown'
  | 'business_blazer'
  | 'resort_wear'
  | 'cocktail_dress';

/**
 * Apparel product item integrated into virtual try-on and skin-harmony matching.
 */
export interface ApparelVTOItem {
  /** Unique product identifier */
  id: string;
  /** Product display name */
  name: string;
  /** Fashion brand or designer */
  brand: string;
  /** Apparel category */
  category: 'evening_gown' | 'business_blazer' | 'resort_wear' | 'cocktail_dress';
  /** Primary hex color code (e.g. '#1A365D') */
  colorHex: string;
  /** Human-readable descriptive color name (e.g. 'Midnight Sapphire') */
  colorName: string;
  /** Material and fabric composition breakdown */
  fabricComposition: string[];
  /** Chromatic harmony score with user undertone: 0 (clash) to 100 (perfect harmony) */
  chromaticHarmonyScore: number;
  /** Retail price in USD */
  priceUsd: number;
  /** External merchant or direct product URL */
  productUrl: string;
  /** High-resolution image asset URL for virtual try-on preview */
  tryonImageUrl: string;
}

// ============================================================================
// 3. CLINICAL SKINCARE REGIMEN TYPES
// ============================================================================

/**
 * Diurnal phase for skincare application.
 */
export type SkincarePhase = 'morning' | 'evening';

/**
 * Functional step classification in the skincare routine.
 */
export type SkincareStepType = 'cleanse' | 'treat' | 'barrier_repair' | 'protect';

/**
 * Dermatologist-grounded skincare product step in a daily regimen.
 */
export interface SkincareStep {
  /** Sequential step order within the routine phase */
  stepNumber: number;
  /** Daily phase */
  phase: 'morning' | 'evening';
  /** Functional category */
  stepType: 'cleanse' | 'treat' | 'barrier_repair' | 'protect';
  /** Commercial product title */
  productName: string;
  /** Cosmetic/skincare brand */
  brand: string;
  /** Active ingredients formulated in the product (e.g. ['Ceramide NP', 'Hyaluronic Acid']) */
  keyActives: string[];
  /** Comedogenicity index rating: 0 (non-comedogenic) to 5 (highly pore-clogging) */
  comedogenicRating: number;
  /** Dermatological explanation justifying this step for the user's skin metrics */
  clinicalRationale: string;
  /** Retail price in USD */
  priceUsd: number;
}

// ============================================================================
// 4. SAFETY AUDIT TYPES
// ============================================================================

/**
 * Safety check audit dimensions evaluated across formulations and fabrics.
 */
export type SafetyCheckId =
  | 'comedogenic'
  | 'active_clash'
  | 'barrier_safety'
  | 'fabric_friction';

/**
 * Verification status of an individual safety check.
 */
export type SafetyCheckStatus = 'pass' | 'warn' | 'fail';

/**
 * Individual safety check assessment result.
 */
export interface SafetyCheck {
  /** Target safety rule evaluated */
  id: 'comedogenic' | 'active_clash' | 'barrier_safety' | 'fabric_friction';
  /** Audit outcome */
  status: 'pass' | 'warn' | 'fail';
  /** Detailed clinical finding or caution notes */
  detail: string;
}

/**
 * Aggregated safety audit outcome.
 */
export interface SafetyAuditResult {
  /** True if all checks pass or have non-blocking warnings */
  isSafe: boolean;
  /** Itemized safety checks */
  checks: SafetyCheck[];
  /** High-level executive safety summary */
  summary: string;
}

// ============================================================================
// 5. CONSUMER BEAUTY PROFILE & DOSSIER TYPES
// ============================================================================

/**
 * Consumer profile capturing physical, event, budget, and dermatological constraints.
 */
export interface ConsumerBeautyProfile {
  /** Unique profile identifier */
  id: string;
  /** Consumer's full name */
  fullName: string;
  /** Consumer chronological age */
  age: number;
  /** Event, venue, or social context (e.g. 'Black Tie Gala at the Met') */
  eventContext: string;
  /** Total spending ceiling in USD */
  budgetLimitUsd: number;
  /** List of known skin sensitivities, allergens, or contraindicated actives */
  knownAllergies: string[];
  /** Diagnostic selfie image asset URL */
  userSelfieUrl: string;
  /** Aesthetic preference (e.g. 'Sculptural Minimalist', 'Romantic Whimsical') */
  preferredStyle: string;
}

/**
 * Execution grounding mode for AuraCura synthesis.
 */
export type AuraCuraExecutionMode = 'auracura_grounded' | 'generic_llm';

/**
 * Complete Autonomous Bio-Harmonic eCommerce VTO & Skin-Safe Styling Dossier.
 */
export interface AuraCuraDossier {
  /** Consumer profile and preferences */
  profile: ConsumerBeautyProfile;
  /** Diagnostic skin metrics */
  skinMetrics: SkinMetrics;
  /** Curated apparel item selected for Virtual Try-On */
  apparelVTO: ApparelVTOItem;
  /** Diurnal clinical skincare regimen */
  skincareRegimen: SkincareStep[];
  /** Multi-vector safety and barrier audit */
  safetyAudit: {
    isSafe: boolean;
    checks: SafetyCheck[];
    summary: string;
  };
  /** Bio-harmonic styling, color theory, and lookbook advice */
  eventLookbookAdvice: string;
  /** Engine execution grounding mode */
  executionMode: 'auracura_grounded' | 'generic_llm';
  /** ISO-8601 timestamp string when the dossier was synthesized */
  generatedAt: string;
}

// ============================================================================
// 6. AGENT TRACE & OBSERVABILITY TYPES
// ============================================================================

/**
 * Operational phases of the AuraCura autonomous agent loop.
 */
export type AuraCuraAgentPhase =
  | 'diagnose'
  | 'audit_safety'
  | 'vto_simulation'
  | 'synthesize_regimen';

/**
 * Execution step outcome status.
 */
export type AuraCuraAgentStepStatus = 'ok' | 'warn' | 'error';

/**
 * Telemetry log for an autonomous agent action in the AuraCura pipeline.
 */
export interface AgentTraceStep {
  /** Step identifier */
  id: string;
  /** Execution pipeline phase */
  phase: 'diagnose' | 'audit_safety' | 'vto_simulation' | 'synthesize_regimen' | AgentPhase;
  /** MCP tool or internal subsystem invoked */
  tool: string;
  /** Summary title */
  title: string;
  /** Detailed telemetry or output */
  detail: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Step status */
  status: 'ok' | 'warn' | 'error' | AgentStepStatus;
  /** Optional trace source for legacy observability compatibility */
  source?: AgentStepSource;
}

// ============================================================================
// 7. COMPATIBILITY & LEGACY MIGRATION TYPES (CuraVIP / Qloo)
// ============================================================================

export type BudgetTier = 'standard_200' | 'executive_500' | 'unlimited_vip';

export const BUDGET_TIER_CAPS: Record<BudgetTier, number | null> = {
  standard_200: 200,
  executive_500: 500,
  unlimited_vip: null,
};

export const BUDGET_TIER_LABELS: Record<BudgetTier, string> = {
  standard_200: 'Standard · $200',
  executive_500: 'Executive · $500',
  unlimited_vip: 'Unlimited VIP',
};

export type LegacyExecutionMode = 'qloo_grounded';
export type ExecutionMode = AuraCuraExecutionMode | LegacyExecutionMode;

export type TasteGraphSource = 'qloo_live' | 'curated_fallback' | 'none';
export type AgentEngine = 'bedrock_claude' | 'autonomous_planner' | 'generic_baseline';

export type CulturalCategory = 'music' | 'film' | 'dining' | 'fashion' | 'literature' | 'architecture';

export const CULTURAL_CATEGORIES: readonly CulturalCategory[] = [
  'music',
  'film',
  'dining',
  'fashion',
  'literature',
  'architecture',
] as const;

export interface CulturalEntity {
  id: string;
  name: string;
  category: CulturalCategory;
  affinityScore: number;
  metadata?: Record<string, unknown>;
}

export interface CulturalTasteGraph {
  seedInterests: string[];
  resolvedSeeds: CulturalEntity[];
  expandedEntities: CulturalEntity[];
  crossDomainThemes: string[];
  source: TasteGraphSource;
}

export interface VIPTaboos {
  alcohol: boolean;
  dietary: string[];
  religiousCultural: string[];
}

export interface VIPProfile {
  id: string;
  fullName: string;
  role: string;
  organization: string;
  city: string;
  budgetLimitUsd: number;
  rawBio: string;
  explicitInterests: string[];
  taboos: VIPTaboos;
  createdAt?: string;
}

export type VIPProfileInput = Omit<VIPProfile, 'id' | 'createdAt'> & { id?: string };

export type GiftCategory = 'curated_artifact' | 'rare_vintage' | 'bespoke_craft' | 'literature_edition';
export type GiftTier = 'signature' | 'alternative' | 'discreet';

export interface GiftProposal {
  id: string;
  title: string;
  brandOrArtisan: string;
  estimatedPriceUsd: number;
  category: GiftCategory;
  culturalRationale: string;
  qlooCorrelationAnchor: string;
  purchaseUrl?: string;
  tier?: GiftTier;
  materials?: string[];
  affinityScore?: number;
}

export interface DiningProposal {
  id: string;
  venueName: string;
  cuisineType: string;
  neighborhood: string;
  vibeAnchor: string;
  pairingNotes: string;
  culturalRationale: string;
  priceBand?: '$$$' | '$$$$';
  serviceElements?: string[];
}

export type FcpaRiskLevel = 'low' | 'medium' | 'high';
export type ComplianceCheckId = 'budget' | 'fcpa' | 'alcohol' | 'dietary' | 'religious_cultural' | 'precedent' | SafetyCheckId;
export type ComplianceCheckStatus = 'pass' | 'warn' | 'fail';

export interface ComplianceCheck {
  id: ComplianceCheckId;
  label?: string;
  status: ComplianceCheckStatus;
  detail: string;
}

export interface BlockedItem {
  itemId: string;
  itemName: string;
  itemType: 'gift' | 'dining';
  reasons: string[];
}

export interface ComplianceAuditResult {
  isCompliant: boolean;
  fcpaRiskLevel: FcpaRiskLevel;
  budgetChecked: boolean;
  tabooViolations: string[];
  auditNotes: string;
  checks: ComplianceCheck[];
  blockedItems: BlockedItem[];
  effectiveBudgetCapUsd: number | null;
  auditedAt: string;
}

export interface ExecutiveDossier {
  vipProfile: VIPProfile;
  tasteGraph: CulturalTasteGraph;
  iceBreakerScripts: string[];
  curatedGifts: GiftProposal[];
  diningOptions: DiningProposal[];
  complianceAudit: ComplianceAuditResult;
  generatedAt: string;
  executionMode: ExecutionMode;
  budgetTier: BudgetTier;
  agentEngine: AgentEngine;
  strategicSummary: string;
  targetBudgetUsd?: number;
}

export type LegacyAgentPhase = 'deconstruct' | 'query_graph' | 'curate' | 'audit' | 'negotiate' | 'commit';
export type AgentPhase = AuraCuraAgentPhase | LegacyAgentPhase;
export type AgentStepStatus = 'ok' | 'warn' | 'error' | 'fallback' | 'blocked';
export type AgentStepSource = 'qloo_live' | 'curated_fallback' | 'bedrock' | 'local' | 'auracura';

export interface DossierRequest {
  vipId: string;
  meetingBrief?: string;
  mode: ExecutionMode;
  budgetTier?: BudgetTier;
}

export interface DossierResponse {
  recordId: string;
  dossier: ExecutiveDossier;
  trace: AgentTraceStep[];
}

export interface DossierComparisonResponse {
  grounded: DossierResponse;
  generic: DossierResponse;
}

export interface DossierRecord {
  id: string;
  vipId: string;
  dossier: ExecutiveDossier;
  isBookmarked: boolean;
  createdAt: string;
}

export interface CurationHistoryEntry {
  id: string;
  vipId: string;
  itemType: 'gift' | 'dining';
  itemName: string;
  awardedAt: string;
}

export interface ReservationRequest {
  vipId: string;
  gift?: Pick<GiftProposal, 'id' | 'title' | 'brandOrArtisan' | 'estimatedPriceUsd'> &
    Partial<Pick<GiftProposal, 'materials' | 'category'>>;
  dining?: {
    venueName: string;
    partySize: number;
    requestedDate: string;
    privateRoom: boolean;
    notes?: string;
  };
  budgetTier?: BudgetTier;
}

export interface ReservationOrder {
  id: string;
  vipId: string;
  confirmationCode: string;
  status: 'drafted' | 'held_for_compliance';
  giftOrder: {
    title: string;
    brandOrArtisan: string;
    estimatedPriceUsd: number;
    handNote: string;
  } | null;
  diningReservation: {
    venueName: string;
    partySize: number;
    requestedDate: string;
    privateRoom: boolean;
    serviceBrief: string;
  } | null;
  complianceCleared: boolean;
  complianceNotes: string[];
  createdAt: string;
}

export interface TasteNegotiationResult {
  bridgeTheme: string;
  rationale: string;
  resolvedProposals: GiftProposal[];
  budgetAdjusted: boolean;
  notes: string[];
}

export interface HealthStatus {
  status: 'ok';
  service: string;
  version: string;
  qlooConfigured: boolean;
  bedrockConfigured: boolean;
  mcpEndpoint: string;
}

// Modern AuraCura Aliases for forward-compatibility
export type UserProfile = ConsumerBeautyProfile;
export type AuraCuraProfile = ConsumerBeautyProfile;
export type CuraVIPDossier = AuraCuraDossier;