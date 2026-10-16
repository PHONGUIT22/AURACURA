/**
 * Task 2 Verification Suite
 * Verifies YouCam client, Clinical Skin Fallback Vault, SQLite persistence, and Demo Seeding.
 */

import { youcamClient } from '../src/services/youcamClient.js';
import { CLINICAL_FALLBACK_PERSONAS, getFallbackSkinMetrics, getFallbackVTOImage } from '../src/services/clinicalSkinFallbackVault.js';
import { youcamCacheRepo } from '../src/database/youcamCacheRepo.js';
import { beautyProfileRepo } from '../src/database/beautyProfileRepo.js';
import { seedDemoData } from '../src/database/seedDemoData.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runVerification() {
  console.log('\n======================================================');
  console.log('🧪 AURACURA TASK 2 ARCHITECTURAL VERIFICATION SUITE');
  console.log('======================================================\n');

  // Test 1: Fallback Vault Personas
  console.log('1. Verifying Clinical Skin Fallback Vault Personas:');
  const sarah = CLINICAL_FALLBACK_PERSONAS['sarah-chen'];
  const marcus = CLINICAL_FALLBACK_PERSONAS['marcus-reed'];
  const elena = CLINICAL_FALLBACK_PERSONAS['elena-gomez'];

  assert(sarah !== undefined, 'Sarah Chen persona exists');
  assert(sarah.skinMetrics.acneScore === 74, `Sarah Chen acneScore is 74 (got ${sarah.skinMetrics.acneScore})`);
  assert(sarah.skinMetrics.rednessScore === 82, `Sarah Chen rednessScore is 82 (got ${sarah.skinMetrics.rednessScore})`);
  assert(sarah.skinMetrics.barrierStatus === 'severely_damaged', `Sarah Chen barrierStatus is severely_damaged`);
  assert(sarah.skinMetrics.undertone === 'cool_fair', `Sarah Chen undertone is cool_fair`);
  assert(sarah.recommendedApparel.category === 'evening_gown', `Sarah Chen apparel is evening_gown`);
  assert(sarah.recommendedApparel.colorHex === '#8A9A86', `Sarah Chen apparel color is Sage Green #8A9A86`);

  assert(marcus !== undefined, 'Marcus Reed persona exists');
  assert(marcus.skinMetrics.wrinkleScore === 68, `Marcus Reed wrinkleScore is 68`);
  assert(marcus.skinMetrics.moistureScore === 28, `Marcus Reed moistureScore is 28 (dehydration crisis)`);
  assert(marcus.skinMetrics.barrierStatus === 'compromised', `Marcus Reed barrierStatus is compromised`);
  assert(marcus.recommendedApparel.category === 'business_blazer', `Marcus Reed apparel is business_blazer`);

  assert(elena !== undefined, 'Elena Gomez persona exists');
  assert(elena.skinMetrics.darkCircleScore === 78, `Elena Gomez darkCircleScore is 78 (melasma/hyperpigmentation)`);
  assert(elena.skinMetrics.barrierStatus === 'healthy', `Elena Gomez barrierStatus is healthy`);
  assert(elena.recommendedApparel.category === 'resort_wear', `Elena Gomez apparel is resort_wear`);

  // Test 2: Native SQLite Caching Layer
  console.log('\n2. Verifying Native SQLite YouCam Cache (youcamCacheRepo):');
  youcamCacheRepo.clear();
  const testUrl = 'https://images.unsplash.com/test-selfie-photo.jpg';
  const testMetrics = getFallbackSkinMetrics(testUrl);

  youcamCacheRepo.cacheSkinAnalysis(testUrl, testMetrics);
  const cachedMetrics = youcamCacheRepo.getCachedSkinAnalysis(testUrl);
  assert(cachedMetrics !== null, 'Skin analysis retrieved from SQLite cache');
  assert(cachedMetrics?.acneScore === testMetrics.acneScore, 'Cached skin metrics match original data');

  const vtoPerson = 'https://images.unsplash.com/person.jpg';
  const vtoGarment = 'https://images.unsplash.com/garment.jpg';
  const vtoRendered = 'https://images.unsplash.com/rendered-simulation.jpg';
  youcamCacheRepo.cacheVTO(vtoPerson, vtoGarment, vtoRendered);
  const cachedVto = youcamCacheRepo.getCachedVTO(vtoPerson, vtoGarment);
  assert(cachedVto === vtoRendered, 'VTO rendering asset URL cached & retrieved from SQLite');

  const stats = youcamCacheRepo.stats();
  assert(stats.skinSqliteEntries >= 1, `SQLite skin cache entries count >= 1 (got ${stats.skinSqliteEntries})`);
  assert(stats.vtoSqliteEntries >= 1, `SQLite VTO cache entries count >= 1 (got ${stats.vtoSqliteEntries})`);

  // Test 3: Consumer Beauty Profile Repository
  console.log('\n3. Verifying Beauty Profile Repository (beautyProfileRepo):');
  beautyProfileRepo.upsertProfile(sarah.profile);
  const loadedProfile = beautyProfileRepo.getProfile('sarah-chen');
  assert(loadedProfile !== null, 'ConsumerBeautyProfile persisted and loaded from SQLite');
  assert(loadedProfile?.fullName === 'Sarah Chen', `Loaded fullName is Sarah Chen`);
  assert(loadedProfile?.budgetLimitUsd === 1200, `Loaded budgetLimitUsd is 1200`);
  assert(Array.isArray(loadedProfile?.knownAllergies), 'knownAllergies deserialized as array');

  // Test 4: Seed Demo Data
  console.log('\n4. Verifying Database Demo Seeder (seedDemoData):');
  const seedResult = seedDemoData();
  assert(seedResult.totalBeautyProfiles >= 3, `Seeded at least 3 beauty profiles (got ${seedResult.totalBeautyProfiles})`);
  assert(beautyProfileRepo.getProfile('marcus-reed') !== null, 'Marcus Reed seeded in SQLite');
  assert(beautyProfileRepo.getProfile('elena-gomez') !== null, 'Elena Gomez seeded in SQLite');

  // Test 5: YouCam Client Resilient Fallback Execution
  console.log('\n5. Verifying YouCamClient Resilient Offline / Fallback Flow:');
  const analyzedSarah = await youcamClient.analyzeSkin('https://example.com/sarah-chen-crisis.jpg');
  assert(analyzedSarah.acneScore === 74, `analyzeSkin returned Sarah Chen fallback acneScore 74`);
  assert(analyzedSarah.barrierStatus === 'severely_damaged', `analyzeSkin returned barrierStatus severely_damaged`);

  const analyzedMarcus = await youcamClient.analyzeSkin('https://example.com/marcus-reed-keynote.jpg');
  assert(analyzedMarcus.wrinkleScore === 68, `analyzeSkin returned Marcus Reed wrinkleScore 68`);

  const analyzedElena = await youcamClient.analyzeSkin('https://example.com/elena-gomez-beach.jpg');
  assert(analyzedElena.darkCircleScore === 78, `analyzeSkin returned Elena Gomez darkCircleScore 78`);

  const vtoResult = await youcamClient.generateApparelTryOn(sarah.profile.userSelfieUrl, sarah.recommendedApparel.tryonImageUrl);
  assert(typeof vtoResult === 'string' && vtoResult.includes('unsplash.com'), 'generateApparelTryOn returned valid fallback VTO asset URL');

  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
