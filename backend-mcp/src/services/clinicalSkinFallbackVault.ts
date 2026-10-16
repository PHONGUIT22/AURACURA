/**
 * AuraCura Clinical Skin Fallback Vault
 * High-fidelity dermatological datasets & VTO simulation assets for 3 reference personas.
 * Preserves 1,000 YouCam API units by acting as an offline/quota-resilient vault.
 */

import type { ConsumerBeautyProfile, SkinMetrics, ApparelVTOItem } from '../types/index.js';

export interface PersonaDossierPackage {
  profile: ConsumerBeautyProfile;
  skinMetrics: SkinMetrics;
  recommendedApparel: ApparelVTOItem;
  vtoRenderedUrl: string;
}

export const CLINICAL_FALLBACK_PERSONAS: Record<string, PersonaDossierPackage> = {
  'sarah-chen': {
    profile: {
      id: 'sarah-chen',
      fullName: 'Sarah Chen',
      age: 24,
      eventContext: 'Black Tie Charity Gala at SF MOMA (Sudden acute facial flare-up crisis)',
      budgetLimitUsd: 1200,
      knownAllergies: ['Fragrance', 'Denatured Alcohol', 'High-concentration Salicylic Acid'],
      userSelfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      preferredStyle: 'Sculptural Modern Silk Evening Wear',
    },
    skinMetrics: {
      acneScore: 74,
      rednessScore: 82,
      moistureScore: 42,
      poreScore: 65,
      wrinkleScore: 12,
      darkCircleScore: 35,
      skinAge: 27,
      chronologicalAge: 24,
      undertone: 'cool_fair',
      barrierStatus: 'severely_damaged',
    },
    recommendedApparel: {
      id: 'apparel-sarah-01',
      name: 'Organic Mulberry Silk Column Gown',
      brand: 'Aura Atelier Bio-Couture',
      category: 'evening_gown',
      colorHex: '#8A9A86',
      colorName: 'Muted Sage Green (Anti-Erythema Chromatic Balance)',
      fabricComposition: ['100% Organic Mulberry Silk (Hypoallergenic)', 'OEKO-TEX Class 1 Certified'],
      chromaticHarmonyScore: 96,
      priceUsd: 680,
      productUrl: 'https://auracura.luxury/collections/evening/silk-sage-column',
      tryonImageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
    },
    vtoRenderedUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
  },

  'marcus-reed': {
    profile: {
      id: 'marcus-reed',
      fullName: 'Marcus Reed',
      age: 42,
      eventContext: 'Global AI Summit Keynote Presentation (High-definition stage lighting & dry air)',
      budgetLimitUsd: 2500,
      knownAllergies: ['Essential Oils', 'Wool Lanolin'],
      userSelfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      preferredStyle: 'Sharp Neapolitan Business Luxury',
    },
    skinMetrics: {
      acneScore: 15,
      rednessScore: 32,
      moistureScore: 28, // Severe trans-epidermal water loss from frequent long-haul flights
      poreScore: 48,
      wrinkleScore: 68,
      darkCircleScore: 62,
      skinAge: 47,
      chronologicalAge: 42,
      undertone: 'neutral_medium',
      barrierStatus: 'compromised',
    },
    recommendedApparel: {
      id: 'apparel-marcus-01',
      name: 'Structured Midnight Navy Blazer & Belgian Linen Layer',
      brand: 'Sartoria Neapolis Bio-Line',
      category: 'business_blazer',
      colorHex: '#1B263B',
      colorName: 'Midnight Deep Navy',
      fabricComposition: ['85% Super 150s Merino Wool', '15% Belgian Flax Linen (Breathable)'],
      chromaticHarmonyScore: 92,
      priceUsd: 1450,
      productUrl: 'https://auracura.luxury/collections/business/midnight-navy-blazer',
      tryonImageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
    },
    vtoRenderedUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
  },

  'elena-gomez': {
    profile: {
      id: 'elena-gomez',
      fullName: 'Elena Gomez',
      age: 31,
      eventContext: 'Tulum Beachfront Sunset Wedding (High UV Index & Tropical Humidity)',
      budgetLimitUsd: 1800,
      knownAllergies: ['Chemical Sunscreen (Avobenzone/Octinoxate)', 'Synthetic Dyes'],
      userSelfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      preferredStyle: 'Effortless Resort Bohemian Luxury',
    },
    skinMetrics: {
      acneScore: 22,
      rednessScore: 45,
      moistureScore: 55,
      poreScore: 40,
      wrinkleScore: 25,
      darkCircleScore: 78, // Periorbital hyperpigmentation & localized solar lentigines/melasma
      skinAge: 32,
      chronologicalAge: 31,
      undertone: 'olive',
      barrierStatus: 'healthy',
    },
    recommendedApparel: {
      id: 'apparel-elena-01',
      name: 'Sun-Shielding Tiered Terracotta Maxi Dress',
      brand: 'Solaris Pure Resort',
      category: 'resort_wear',
      colorHex: '#C86D51',
      colorName: 'Warm Terracotta Sand',
      fabricComposition: ['70% Lyocell Bamboo', '30% UV-Blocking Cotton (UPF 50+)'],
      chromaticHarmonyScore: 98,
      priceUsd: 590,
      productUrl: 'https://auracura.luxury/collections/resort/terracotta-upf50-maxi',
      tryonImageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
    },
    vtoRenderedUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
  },
};

/**
 * Returns fallback skin metrics matching the requested identity or URL pattern.
 * Defaults deterministically to Sarah Chen's acute skin condition.
 */
export function getFallbackSkinMetrics(seedKeyOrUrl: string): SkinMetrics {
  const normalized = seedKeyOrUrl.toLowerCase();
  if (normalized.includes('marcus') || normalized.includes('reed')) {
    return { ...CLINICAL_FALLBACK_PERSONAS['marcus-reed'].skinMetrics };
  }
  if (normalized.includes('elena') || normalized.includes('gomez')) {
    return { ...CLINICAL_FALLBACK_PERSONAS['elena-gomez'].skinMetrics };
  }
  return { ...CLINICAL_FALLBACK_PERSONAS['sarah-chen'].skinMetrics };
}

/**
 * Returns a high-resolution simulated VTO rendering matching the persona or garment.
 */
export function getFallbackVTOImage(personImg: string, _garmentImg?: string): string {
  const normalized = personImg.toLowerCase();
  if (normalized.includes('marcus') || normalized.includes('reed')) {
    return CLINICAL_FALLBACK_PERSONAS['marcus-reed'].vtoRenderedUrl;
  }
  if (normalized.includes('elena') || normalized.includes('gomez')) {
    return CLINICAL_FALLBACK_PERSONAS['elena-gomez'].vtoRenderedUrl;
  }
  return CLINICAL_FALLBACK_PERSONAS['sarah-chen'].vtoRenderedUrl;
}

/**
 * Retrieves a complete persona package by ID or fuzzy name.
 */
export function getFallbackPersona(keyOrId: string): PersonaDossierPackage | undefined {
  const key = keyOrId.toLowerCase().trim();
  if (CLINICAL_FALLBACK_PERSONAS[key]) return CLINICAL_FALLBACK_PERSONAS[key];
  if (key.includes('sarah')) return CLINICAL_FALLBACK_PERSONAS['sarah-chen'];
  if (key.includes('marcus')) return CLINICAL_FALLBACK_PERSONAS['marcus-reed'];
  if (key.includes('elena')) return CLINICAL_FALLBACK_PERSONAS['elena-gomez'];
  return undefined;
}

/**
 * Returns all predefined clinical personas.
 */
export function getAllFallbackPersonas(): PersonaDossierPackage[] {
  return Object.values(CLINICAL_FALLBACK_PERSONAS);
}
