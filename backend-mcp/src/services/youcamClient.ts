/**
 * YouCam Client
 * Integrates Perfect Corp YouCam Skin Analysis & Generative Apparel VTO APIs.
 * Includes offline resiliency, quota-guarding local caching (node:sqlite),
 * and automatic failover to the Clinical Skin Fallback Vault.
 */

import { envConfig, isRealSecret } from '../config/env.js';
import type { SkinMetrics } from '../types/index.js';
import { getFallbackSkinMetrics, getFallbackVTOImage } from './clinicalSkinFallbackVault.js';
import { youcamCacheRepo } from '../database/youcamCacheRepo.js';

export interface YouCamRawSkinResponse {
  status?: string;
  code?: number;
  data?: {
    skin_age?: number;
    chronological_age?: number;
    undertone?: 'cool_fair' | 'neutral_medium' | 'warm_deep' | 'olive';
    barrier_status?: 'healthy' | 'compromised' | 'severely_damaged';
    scores?: {
      acne?: number;
      redness?: number;
      moisture?: number;
      pores?: number;
      wrinkles?: number;
      dark_circles?: number;
    };
  };
  // Flat format fallback
  acne_score?: number;
  redness_score?: number;
  moisture_score?: number;
  pore_score?: number;
  wrinkle_score?: number;
  dark_circle_score?: number;
  skin_age?: number;
  chronological_age?: number;
  undertone?: 'cool_fair' | 'neutral_medium' | 'warm_deep' | 'olive';
  barrier_status?: 'healthy' | 'compromised' | 'severely_damaged';
}

export interface YouCamRawVtoResponse {
  status?: string;
  result_image_url?: string;
  rendered_url?: string;
  vto_url?: string;
  task_id?: string;
}

export class YouCamClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor() {
    this.apiKey = envConfig.YOUCAM_API_KEY;
    this.baseUrl = envConfig.YOUCAM_BASE_URL.replace(/\/+$/, '');
    this.timeoutMs = envConfig.YOUCAM_TIMEOUT_MS;
  }

  /**
   * Diagnostic inspection of API key readiness.
   */
  public isLiveApiConfigured(): boolean {
    return isRealSecret(this.apiKey);
  }

  /**
   * Normalizes raw API response into AuraCura SkinMetrics.
   */
  private normalizeSkinMetrics(raw: YouCamRawSkinResponse, originalUrl: string): SkinMetrics {
    const data = raw.data || {};
    const scores = data.scores || {};

    const acneScore = Math.round(Number(scores.acne ?? raw.acne_score ?? 30));
    const rednessScore = Math.round(Number(scores.redness ?? raw.redness_score ?? 25));
    const moistureScore = Math.round(Number(scores.moisture ?? raw.moisture_score ?? 60));
    const poreScore = Math.round(Number(scores.pores ?? raw.pore_score ?? 40));
    const wrinkleScore = Math.round(Number(scores.wrinkles ?? raw.wrinkle_score ?? 20));
    const darkCircleScore = Math.round(Number(scores.dark_circles ?? raw.dark_circle_score ?? 35));

    const skinAge = Math.round(Number(data.skin_age ?? raw.skin_age ?? 30));
    const chronologicalAge = Math.round(Number(data.chronological_age ?? raw.chronological_age ?? 28));

    const undertone = data.undertone || raw.undertone || 'neutral_medium';

    let barrierStatus = data.barrier_status || raw.barrier_status;
    if (!barrierStatus) {
      if (rednessScore > 75 || acneScore > 70) {
        barrierStatus = 'severely_damaged';
      } else if (rednessScore > 40 || moistureScore < 35) {
        barrierStatus = 'compromised';
      } else {
        barrierStatus = 'healthy';
      }
    }

    return {
      acneScore: Math.max(0, Math.min(100, acneScore)),
      rednessScore: Math.max(0, Math.min(100, rednessScore)),
      moistureScore: Math.max(0, Math.min(100, moistureScore)),
      poreScore: Math.max(0, Math.min(100, poreScore)),
      wrinkleScore: Math.max(0, Math.min(100, wrinkleScore)),
      darkCircleScore: Math.max(0, Math.min(100, darkCircleScore)),
      skinAge: Math.max(16, skinAge),
      chronologicalAge: Math.max(16, chronologicalAge),
      undertone,
      barrierStatus,
    };
  }

  /**
   * Analyzes facial skin diagnostic indicators from a user's selfie image.
   * Execution Flow:
   * 1. Cache Check (L1 Memory / L2 SQLite) -> Instant Return
   * 2. Key Check -> If missing/placeholder, fall back cleanly to Clinical Vault
   * 3. Live API Request -> Perfect Corp Skin Analysis API
   * 4. Resilient Fallback -> On HTTP error, timeout, or quota exhaust (429), fall back to Clinical Vault
   */
  async analyzeSkin(imageUrl: string): Promise<SkinMetrics> {
    if (!imageUrl || imageUrl.trim() === '') {
      return getFallbackSkinMetrics('default');
    }

    // 1. Check local SQLite cache first to preserve unit quota
    const cached = youcamCacheRepo.getCachedSkinAnalysis(imageUrl);
    if (cached) {
      return cached;
    }

    // 2. Fall back to Clinical Vault if no valid API key is present
    if (!this.isLiveApiConfigured()) {
      const fallback = getFallbackSkinMetrics(imageUrl);
      youcamCacheRepo.cacheSkinAnalysis(imageUrl, fallback);
      return fallback;
    }

    // 3. Dispatch Live API Request to YouCam endpoint
    try {
      const endpoint = `${this.baseUrl}/api/v1/skin-analysis`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          image_url: imageUrl,
          features: ['acne', 'redness', 'moisture', 'pores', 'wrinkles', 'dark_circles', 'skin_age', 'undertone'],
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`YouCam Skin API error HTTP ${response.status}: ${response.statusText}`);
      }

      const raw = (await response.json()) as YouCamRawSkinResponse;
      const metrics = this.normalizeSkinMetrics(raw, imageUrl);

      youcamCacheRepo.cacheSkinAnalysis(imageUrl, metrics);
      return metrics;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[YouCamClient] Live skin analysis failed (${msg}). Falling back to Clinical Skin Vault.`);
      const fallback = getFallbackSkinMetrics(imageUrl);
      youcamCacheRepo.cacheSkinAnalysis(imageUrl, fallback);
      return fallback;
    }
  }

  /**
   * Generates a virtual try-on rendering merging a user image with a target garment.
   * Execution Flow:
   * 1. Cache Check -> Return existing simulation
   * 2. Key Check -> Clinical Fallback Vault VTO URL
   * 3. Live API Request -> Perfect Corp Generative Apparel VTO API
   * 4. Resilient Fallback -> On HTTP failure / timeout, return fallback asset URL
   */
  async generateApparelTryOn(personImg: string, garmentImg: string): Promise<string> {
    if (!personImg || !garmentImg) {
      return getFallbackVTOImage(personImg || 'default', garmentImg);
    }

    // 1. Check local SQLite cache
    const cached = youcamCacheRepo.getCachedVTO(personImg, garmentImg);
    if (cached) {
      return cached;
    }

    // 2. Fall back to Clinical Vault if no valid API key
    if (!this.isLiveApiConfigured()) {
      const fallbackUrl = getFallbackVTOImage(personImg, garmentImg);
      youcamCacheRepo.cacheVTO(personImg, garmentImg, fallbackUrl);
      return fallbackUrl;
    }

    // 3. Dispatch Live API Request to YouCam Apparel VTO
    try {
      const endpoint = `${this.baseUrl}/api/v1/apparel-vto`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          person_image_url: personImg,
          garment_image_url: garmentImg,
          fit_mode: 'bio_harmonic',
        }),
        signal: AbortSignal.timeout(Math.max(15000, this.timeoutMs * 1.5)),
      });

      if (!response.ok) {
        throw new Error(`YouCam Apparel VTO API error HTTP ${response.status}: ${response.statusText}`);
      }

      const raw = (await response.json()) as YouCamRawVtoResponse;
      const renderedUrl =
        raw.result_image_url || raw.rendered_url || raw.vto_url || getFallbackVTOImage(personImg, garmentImg);

      youcamCacheRepo.cacheVTO(personImg, garmentImg, renderedUrl);
      return renderedUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[YouCamClient] Live apparel VTO generation failed (${msg}). Returning Fallback VTO asset.`);
      const fallbackUrl = getFallbackVTOImage(personImg, garmentImg);
      youcamCacheRepo.cacheVTO(personImg, garmentImg, fallbackUrl);
      return fallbackUrl;
    }
  }
}

export const youcamClient = new YouCamClient();
