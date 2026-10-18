/**
 * AuraCura Core Domain Schema & Type Definitions
 * System: Autonomous Bio-Harmonic eCommerce VTO & Skin-Safe Styling
 *
 * NOTE: This file is mirrored verbatim in frontend/src/types/index.ts and backend-mcp/src/types/index.ts - keep both 100% in sync.
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
  barrierStatus: SkinBarrierStatus;
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
  category: ApparelCategory;
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
  phase: SkincarePhase;
  /** Functional category */
  stepType: SkincareStepType;
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
  id: SafetyCheckId;
  /** Audit outcome */
  status: SafetyCheckStatus;
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

export interface DermatologyGuardrailResult {
  isSafe: boolean;
  checks: SafetyCheck[];
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
export type ExecutionMode = AuraCuraExecutionMode;

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
  safetyAudit: SafetyAuditResult;
  /** Bio-harmonic styling, color theory, and lookbook advice */
  eventLookbookAdvice: string;
  /** Engine execution grounding mode */
  executionMode: AuraCuraExecutionMode;
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
  phase: AuraCuraAgentPhase;
  /** MCP tool or internal subsystem invoked */
  tool: string;
  /** Summary title */
  title: string;
  /** Detailed telemetry or output */
  detail: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Step status */
  status: AuraCuraAgentStepStatus;
  /** Optional trace source for observability */
  source?: 'youcam_live' | 'youcam_cache' | 'fallback_vault' | 'bedrock' | 'auracura' | string;
}

// ============================================================================
// 7. SYSTEM HEALTH, BENCHMARK & CONVERSATION RESPONSE TYPES
// ============================================================================

export interface BenchmarkComparisonResponse {
  success: boolean;
  grounded: AuraCuraDossier;
  genericBlind: AuraCuraDossier;
  generic: AuraCuraDossier;
  groundedPackage: {
    recordId: string;
    dossier: AuraCuraDossier;
    trace: AgentTraceStep[];
  };
  genericPackage: {
    recordId: string;
    dossier: AuraCuraDossier;
    trace: AgentTraceStep[];
  };
  comparisonSummary: {
    safetyViolationsAvoided: number;
    chromaticHarmonyDelta: number;
    groundedIsSafe: boolean;
    genericBlindIsSafe: boolean;
    verdict: string;
  };
}

export type DossierComparisonResponse = BenchmarkComparisonResponse;

export interface AgentTurnResponse {
  success: boolean;
  response: string;
  suggestedActions?: string[];
  dossierDelta?: Partial<AuraCuraDossier>;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  youcam: {
    configured: boolean;
    baseUrl: string;
    mode: string;
  };
  youcamConfigured: boolean;
  youcamBaseUrl: string;
  bedrock: {
    configured: boolean;
    region: string;
  };
  bedrockConfigured: boolean;
  cache: {
    skinCacheEntries: number;
    vtoCacheEntries: number;
    totalHitRatio: number;
  };
  mcp: {
    endpoint: string;
    toolsCount: number;
    tools: string[];
  };
  mcpEndpoint: string;
  timestamp: string;
}

// Aliases for consumer profiles and dossiers
export type UserProfile = ConsumerBeautyProfile;
export type AuraCuraProfile = ConsumerBeautyProfile;
export type AuraCuraDossierResponse = AuraCuraDossier;