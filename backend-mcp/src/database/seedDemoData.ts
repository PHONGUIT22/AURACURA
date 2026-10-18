import { beautyProfileRepo } from './beautyProfileRepo.js';
import { CLINICAL_FALLBACK_PERSONAS } from '../services/clinicalSkinFallbackVault.js';

/**
 * Idempotently seeds AuraCura clinical beauty profiles (Sarah Chen, Marcus Reed, Elena Gomez).
 * Existing rows are updated/preserved without duplicating records.
 */
export function seedDemoData(): {
  inserted: number;
  total: number;
  beautyProfilesInserted: number;
  totalBeautyProfiles: number;
} {
  let beautyProfilesInserted = 0;
  for (const [, pkg] of Object.entries(CLINICAL_FALLBACK_PERSONAS)) {
    const existing = beautyProfileRepo.getProfile(pkg.profile.id);
    beautyProfileRepo.upsertProfile(pkg.profile);
    if (!existing) {
      beautyProfilesInserted += 1;
    }
  }

  const total = beautyProfileRepo.listProfiles().length;
  return {
    inserted: beautyProfilesInserted,
    total,
    beautyProfilesInserted,
    totalBeautyProfiles: total,
  };
}