import { describe, it, expect, beforeEach } from 'vitest';
import { YouCamClient } from '../src/services/youcamClient.js';
import { CLINICAL_FALLBACK_PERSONAS } from '../src/services/clinicalSkinFallbackVault.js';
import { youcamCacheRepo } from '../src/database/youcamCacheRepo.js';
import { beautyProfileRepo } from '../src/database/beautyProfileRepo.js';
import { seedDemoData } from '../src/database/seedDemoData.js';

describe('YouCamClient & AuraCura Data Layer', () => {
  let client: YouCamClient;

  beforeEach(() => {
    // Clear caches to test clean execution paths
    youcamCacheRepo.clear();
    client = new YouCamClient();
  });

  describe('YouCamClient Offline & Fallback Resiliency', () => {
    it('returns Sarah Chen clinical skin metrics when no key is set (default fallback)', async () => {
      const selfieUrl = 'https://images.unsplash.com/photo-sarah-test.jpg';
      const metrics = await client.analyzeSkin(selfieUrl);

      expect(metrics).toBeDefined();
      expect(metrics.acneScore).toBe(74);
      expect(metrics.rednessScore).toBe(82);
      expect(metrics.barrierStatus).toBe('severely_damaged');
      expect(metrics.undertone).toBe('cool_fair');
      expect(metrics.chronologicalAge).toBe(24);
      expect(metrics.skinAge).toBe(27);

      // Verify that result was written into SQLite / Memory cache
      const cached = youcamCacheRepo.getCachedSkinAnalysis(selfieUrl);
      expect(cached).not.toBeNull();
      expect(cached?.acneScore).toBe(74);
    });

    it('returns Marcus Reed clinical metrics when URL references marcus', async () => {
      const marcusImg = 'https://images.unsplash.com/photo-marcus-reed-keynote.jpg';
      const metrics = await client.analyzeSkin(marcusImg);

      expect(metrics).toBeDefined();
      expect(metrics.wrinkleScore).toBe(68);
      expect(metrics.moistureScore).toBe(28);
      expect(metrics.barrierStatus).toBe('compromised');
      expect(metrics.undertone).toBe('neutral_medium');
      expect(metrics.chronologicalAge).toBe(42);
    });

    it('returns Elena Gomez clinical metrics when URL references elena', async () => {
      const elenaImg = 'https://images.unsplash.com/photo-elena-gomez-beach.jpg';
      const metrics = await client.analyzeSkin(elenaImg);

      expect(metrics).toBeDefined();
      expect(metrics.darkCircleScore).toBe(78);
      expect(metrics.barrierStatus).toBe('healthy');
      expect(metrics.undertone).toBe('olive');
      expect(metrics.chronologicalAge).toBe(31);
    });

    it('generates virtual try-on asset URL from fallback vault smoothly', async () => {
      const personImg = CLINICAL_FALLBACK_PERSONAS['sarah-chen'].profile.userSelfieUrl;
      const garmentImg = CLINICAL_FALLBACK_PERSONAS['sarah-chen'].recommendedApparel.tryonImageUrl;

      const renderedUrl = await client.generateApparelTryOn(personImg, garmentImg);

      expect(renderedUrl).toBeDefined();
      expect(renderedUrl).toMatch(/unsplash\.com|\/vto-renders\//);

      // Verify caching
      const cachedVTO = youcamCacheRepo.getCachedVTO(personImg, garmentImg);
      expect(cachedVTO).toBe(renderedUrl);
    });
  });

  describe('beautyProfileRepo & SQLite Integration', () => {
    it('persists and retrieves ConsumerBeautyProfile records', () => {
      const sarah = CLINICAL_FALLBACK_PERSONAS['sarah-chen'].profile;
      beautyProfileRepo.upsertProfile(sarah);

      const retrieved = beautyProfileRepo.getProfile('sarah-chen');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.fullName).toBe('Sarah Chen');
      expect(retrieved?.age).toBe(24);
      expect(retrieved?.budgetLimitUsd).toBe(1200);
      expect(retrieved?.knownAllergies).toContain('Fragrance');
    });

    it('seeds all 3 reference personas upon seedDemoData()', () => {
      const result = seedDemoData();
      expect(result.totalBeautyProfiles).toBeGreaterThanOrEqual(3);

      const sarah = beautyProfileRepo.getProfile('sarah-chen');
      const marcus = beautyProfileRepo.getProfile('marcus-reed');
      const elena = beautyProfileRepo.getProfile('elena-gomez');

      expect(sarah).not.toBeNull();
      expect(marcus).not.toBeNull();
      expect(elena).not.toBeNull();
      expect(marcus?.preferredStyle).toContain('Neapolitan');
      expect(elena?.eventContext).toContain('Tulum');
    });
  });
});
