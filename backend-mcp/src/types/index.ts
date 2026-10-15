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
