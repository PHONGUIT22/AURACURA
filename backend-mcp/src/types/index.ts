/**
 * AuraCura Core Domain Schema & Type Definitions
 * System: Autonomous Bio-Harmonic eCommerce VTO & Skin-Safe Styling
 */

export type SkinToneUndertone = 'cool_fair' | 'neutral_medium' | 'warm_deep' | 'olive';
export type SkinBarrierStatus = 'healthy' | 'compromised' | 'severely_damaged';
export type ApparelCategory = 'evening_gown' | 'business_blazer' | 'resort_wear' | 'cocktail_dress';

export interface ConsumerBeautyProfile {
  id: string;
  fullName: string;
  age: number;
  eventContext: string;
  budgetLimitUsd: number;
  knownAllergies: string[];
  userSelfieUrl: string;
  preferredStyle: string;
}

export interface SkinMetrics {
  acneScore: number;
  rednessScore: number;
  moistureScore: number;
  poreScore: number;
  wrinkleScore: number;
  darkCircleScore: number;
  skinAge: number;
  chronologicalAge: number;
  undertone: SkinToneUndertone;
  barrierStatus: SkinBarrierStatus;
}

export interface ApparelVTOItem {
  id: string;
  name: string;
  brand: string;
  category: ApparelCategory;
  colorHex: string;
  colorName: string;
  fabricComposition: string[];
  chromaticHarmonyScore: number;
  priceUsd: number;
  productUrl: string;
  tryonImageUrl: string;
}

export type SkincarePhase = 'morning' | 'evening';
export type SkincareStepType = 'cleanse' | 'treat' | 'barrier_repair' | 'protect';

export interface SkincareStep {
  stepNumber: number;
  phase: SkincarePhase;
  stepType: SkincareStepType;
  productName: string;
  brand: string;
  keyActives: string[];
  comedogenicRating: number;
  clinicalRationale: string;
  priceUsd: number;
}

export type SafetyCheckId = 'comedogenic' | 'active_clash' | 'barrier_safety' | 'fabric_friction';
export type SafetyCheckStatus = 'pass' | 'warn' | 'fail';

export interface SafetyCheck {
  id: SafetyCheckId;
  status: SafetyCheckStatus;
  detail: string;
}

export interface SafetyAuditResult {
  isSafe: boolean;
  checks: SafetyCheck[];
  summary: string;
}
