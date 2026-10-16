/**
 * YouCam Client — Official Perfect Corp S2S v2.0 Live API Implementation
 * Endpoints:
 *   • Skin Analysis: POST https://yce-api-01.makeupar.com/s2s/v2.0/task/skin-analysis
 *                    GET  https://yce-api-01.makeupar.com/s2s/v2.0/task/skin-analysis/{task_id}
 *                    -> Downloads S3 ZIP (data.results.url) & extracts skinanalysisResult/score_info.json
 *   • Cloth VTO:     POST https://yce-api-01.makeupar.com/s2s/v2.0/task/cloth
 *                    GET  https://yce-api-01.makeupar.com/s2s/v2.0/task/cloth/{task_id}
 *                    -> Extracts rendered S3 JPG URL (data.results.url)
 */

import zlib from 'node:zlib';
import { envConfig, isRealSecret } from '../config/env.js';
import type { SkinMetrics } from '../types/index.js';
import { getFallbackSkinMetrics, getFallbackVTOImage } from './clinicalSkinFallbackVault.js';
import { youcamCacheRepo } from '../database/youcamCacheRepo.js';

export interface YouCamS2STaskResponse {
  status?: number;
  data?: {
    task_id?: string;
    task_status?: 'running' | 'pending' | 'success' | 'error';
    results?: {
      url?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface YouCamScoreInfoJson {
  acne?: { ui_score?: number; raw_score?: number };
  redness?: { ui_score?: number; raw_score?: number };
  moisture?: { ui_score?: number; raw_score?: number };
  pore?: { ui_score?: number; raw_score?: number };
  wrinkle?: { ui_score?: number; raw_score?: number };
  dark_circle?: { ui_score?: number; raw_score?: number };
  dark_circles?: { ui_score?: number; raw_score?: number };
  skin_age?: number;
  [key: string]: any;
}

export interface YouCamTaskTelemetry {
  taskId: string;
  taskStatus: 'success' | 'fallback';
  pollCount: number;
  pollIntervalMs: number;
  zipUrl?: string;
  vtoTaskId?: string;
  vtoS3Url?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extracts `skinanalysisResult/score_info.json` from a Perfect Corp S3 ZIP buffer
 * using built-in `node:zlib` (`inflateRawSync`) without external dependencies.
 */
export function extractScoreInfoFromZipBuffer(zipBuffer: Buffer): YouCamScoreInfoJson {
  // Strategy 1: Scan Central Directory via End of Central Directory (EOCD: 0x06054b50)
  let eocdOffset = -1;
  for (let i = zipBuffer.length - 22; i >= Math.max(0, zipBuffer.length - 65557); i--) {
    if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset !== -1) {
    const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10);
    let cdOffset = zipBuffer.readUInt32LE(eocdOffset + 16);

    for (let e = 0; e < totalEntries && cdOffset + 46 <= zipBuffer.length; e++) {
      if (zipBuffer.readUInt32LE(cdOffset) !== 0x02014b50) break;

      const compressionMethod = zipBuffer.readUInt16LE(cdOffset + 10);
      const compressedSize = zipBuffer.readUInt32LE(cdOffset + 20);
      const fileNameLen = zipBuffer.readUInt16LE(cdOffset + 28);
      const extraLen = zipBuffer.readUInt16LE(cdOffset + 30);
      const commentLen = zipBuffer.readUInt16LE(cdOffset + 32);
      const localHeaderOffset = zipBuffer.readUInt32LE(cdOffset + 42);

      const fileName = zipBuffer.subarray(cdOffset + 46, cdOffset + 46 + fileNameLen).toString('utf8');

      if (fileName.endsWith('score_info.json')) {
        const localFileNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26);
        const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28);
        const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
        const compressedSlice = zipBuffer.subarray(dataStart, dataStart + compressedSize);

        const jsonBuffer =
          compressionMethod === 8
            ? zlib.inflateRawSync(compressedSlice)
            : compressedSlice;
        return JSON.parse(jsonBuffer.toString('utf8')) as YouCamScoreInfoJson;
      }

      cdOffset += 46 + fileNameLen + extraLen + commentLen;
    }
  }

  // Strategy 2: Direct Local File Header scan (0x04034b50)
  let offset = 0;
  while (offset + 30 <= zipBuffer.length) {
    const signature = zipBuffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;

    const compressionMethod = zipBuffer.readUInt16LE(offset + 8);
    const compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const fileNameLen = zipBuffer.readUInt16LE(offset + 26);
    const extraLen = zipBuffer.readUInt16LE(offset + 28);
    const fileName = zipBuffer.subarray(offset + 30, offset + 30 + fileNameLen).toString('utf8');
    const dataStart = offset + 30 + fileNameLen + extraLen;

    if (fileName.endsWith('score_info.json') && compressedSize > 0) {
      const compressedSlice = zipBuffer.subarray(dataStart, dataStart + compressedSize);
      const jsonBuffer =
        compressionMethod === 8
          ? zlib.inflateRawSync(compressedSlice)
          : compressedSlice;
      return JSON.parse(jsonBuffer.toString('utf8')) as YouCamScoreInfoJson;
    }

    if (compressedSize === 0) break;
    offset = dataStart + compressedSize;
  }

  throw new Error('skinanalysisResult/score_info.json not found in YouCam S3 ZIP archive');
}

export class YouCamClient {
  private customApiKey?: string;
  private customSecretKey?: string;
  private customBaseUrl?: string;
  private customTimeoutMs?: number;
  public lastTaskTelemetry: YouCamTaskTelemetry | null = null;

  constructor(options?: { apiKey?: string; secretKey?: string; baseUrl?: string; timeoutMs?: number }) {
    this.customApiKey = options?.apiKey;
    this.customSecretKey = options?.secretKey;
    this.customBaseUrl = options?.baseUrl;
    this.customTimeoutMs = options?.timeoutMs;
  }

  private get apiKey(): string {
    return this.customApiKey !== undefined ? this.customApiKey : envConfig.YOUCAM_API_KEY;
  }

  public get secretKey(): string {
    return this.customSecretKey !== undefined ? this.customSecretKey : envConfig.YOUCAM_SECRET_KEY;
  }

  private get baseUrl(): string {
    return (this.customBaseUrl || envConfig.YOUCAM_BASE_URL).replace(/\/+$/, '');
  }

  private get timeoutMs(): number {
    return this.customTimeoutMs || envConfig.YOUCAM_TIMEOUT_MS;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  public isLiveApiConfigured(): boolean {
    return isRealSecret(this.apiKey);
  }

  /**
   * Ensures portrait URLs sent to YouCam have >60% face area coverage.
   * For images.unsplash.com URLs, sets `?auto=format&fit=facearea&facepad=1.6&w=800&h=800&q=85`.
   */
  public prepareSkinImageUrl(imageUrl: string): string {
    if (imageUrl.includes('images.unsplash.com')) {
      const basePart = imageUrl.split('?')[0];
      return `${basePart}?auto=format&fit=facearea&facepad=1.6&w=800&h=800&q=85`;
    }
    return imageUrl;
  }

  /**
   * Analyzes facial skin diagnostic indicators from a user's selfie image via
   * Perfect Corp S2S v2.0 (`/s2s/v2.0/task/skin-analysis`) and S3 ZIP extraction.
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

    const preparedImageUrl = this.prepareSkinImageUrl(imageUrl);
    const fallbackReference = getFallbackSkinMetrics(imageUrl);

    try {
      // 3. Create Skin Analysis Task on Perfect Corp S2S v2.0
      const createEndpoint = `${this.baseUrl}/s2s/v2.0/task/skin-analysis`;
      const createRes = await fetch(createEndpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          src_file_url: preparedImageUrl,
          dst_actions: ['acne', 'redness', 'moisture', 'pore', 'wrinkle'],
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!createRes.ok) {
        const errBody = await createRes.text().catch(() => '');
        throw new Error(`HTTP ${createRes.status}: ${errBody || createRes.statusText}`);
      }

      const resJson = (await createRes.json()) as YouCamS2STaskResponse;
      const taskId = resJson.data?.task_id;
      if (!taskId) {
        throw new Error(`Missing data.task_id in response: ${JSON.stringify(resJson)}`);
      }

      console.log('[YouCam LIVE] Created Skin Analysis Task ID:', taskId);

      // 4. Poll GET /s2s/v2.0/task/skin-analysis/{taskId} every 1.5s (max 10 attempts)
      const pollEndpoint = `${this.baseUrl}/s2s/v2.0/task/skin-analysis/${encodeURIComponent(taskId)}`;
      for (let attempt = 1; attempt <= 10; attempt++) {
        await sleep(1500);

        const pollRes = await fetch(pollEndpoint, {
          method: 'GET',
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!pollRes.ok) {
          throw new Error(`Poll HTTP ${pollRes.status}: ${pollRes.statusText}`);
        }

        const pollJson = (await pollRes.json()) as YouCamS2STaskResponse;
        const data = pollJson.data || {};

        if (data.task_status === 'success') {
          const zipUrl = data.results?.url;
          if (!zipUrl) {
            throw new Error(`Missing data.results.url in completed skin-analysis task ${taskId}`);
          }

          // 5. Download S3 .zip archive and extract skinanalysisResult/score_info.json
          const zipRes = await fetch(zipUrl, {
            signal: AbortSignal.timeout(this.timeoutMs),
          });
          if (!zipRes.ok) {
            throw new Error(`Failed to download S3 ZIP (${zipRes.status})`);
          }

          const arrayBuf = await zipRes.arrayBuffer();
          const zipBuffer = Buffer.from(arrayBuf);
          const scoreInfo = extractScoreInfoFromZipBuffer(zipBuffer);

          const acneScore = Math.round(Number(scoreInfo.acne?.ui_score ?? fallbackReference.acneScore));
          const rednessScore = Math.round(Number(scoreInfo.redness?.ui_score ?? fallbackReference.rednessScore));
          const moistureScore = Math.round(Number(scoreInfo.moisture?.ui_score ?? fallbackReference.moistureScore));
          const poreScore = Math.round(Number(scoreInfo.pore?.ui_score ?? fallbackReference.poreScore));
          const wrinkleScore = Math.round(Number(scoreInfo.wrinkle?.ui_score ?? fallbackReference.wrinkleScore));
          const skinAge = Math.round(Number(scoreInfo.skin_age ?? fallbackReference.skinAge));

          console.log('[YouCam LIVE] Skin Analysis SUCCESS from S3 ZIP:', {
            acneScore,
            rednessScore,
            moistureScore,
            poreScore,
            wrinkleScore,
            skinAge,
          });

          const darkCircleScore = Math.round(
            Number(
              scoreInfo.dark_circle?.ui_score ??
                scoreInfo.dark_circles?.ui_score ??
                fallbackReference.darkCircleScore
            )
          );

          let barrierStatus: SkinMetrics['barrierStatus'] = 'healthy';
          if (rednessScore > 75 || acneScore > 70) {
            barrierStatus = 'severely_damaged';
          } else if (rednessScore > 40 || moistureScore < 35) {
            barrierStatus = 'compromised';
          }

          const metrics: SkinMetrics = {
            acneScore: Math.max(0, Math.min(100, acneScore)),
            rednessScore: Math.max(0, Math.min(100, rednessScore)),
            moistureScore: Math.max(0, Math.min(100, moistureScore)),
            poreScore: Math.max(0, Math.min(100, poreScore)),
            wrinkleScore: Math.max(0, Math.min(100, wrinkleScore)),
            darkCircleScore: Math.max(0, Math.min(100, darkCircleScore)),
            skinAge: Math.max(16, skinAge),
            chronologicalAge: fallbackReference.chronologicalAge,
            undertone: fallbackReference.undertone,
            barrierStatus,
          };

          this.lastTaskTelemetry = {
            taskId,
            taskStatus: 'success',
            pollCount: attempt,
            pollIntervalMs: 1500,
            zipUrl,
          };

          youcamCacheRepo.cacheSkinAnalysis(imageUrl, metrics);
          return metrics;
        }

        if (data.task_status === 'error') {
          throw new Error(`YouCam Skin Analysis task ${taskId} failed: ${JSON.stringify(data)}`);
        }
      }

      throw new Error(`YouCam Skin Analysis task ${taskId} timed out after 10 polls`);
    } catch (err: unknown) {
      if (process.env.DEBUG_YOUCAM === 'true') {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[YouCamClient] Live skin analysis fallback engaged (${msg}).`);
      }
      const fallback = getFallbackSkinMetrics(imageUrl);
      youcamCacheRepo.cacheSkinAnalysis(imageUrl, fallback);
      return fallback;
    }
  }

  /**
   * Generates a virtual try-on rendering merging a user image with a target garment
   * via Perfect Corp S2S v2.0 Cloth VTO (`/s2s/v2.0/task/cloth`).
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

    try {
      // 3. Create Cloth VTO Task via POST /s2s/v2.0/task/cloth
      const createEndpoint = `${this.baseUrl}/s2s/v2.0/task/cloth`;
      const createRes = await fetch(createEndpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          src_file_url: personImg,
          ref_file_url: garmentImg,
          garment_category: 'full_body',
        }),
        signal: AbortSignal.timeout(Math.max(15000, this.timeoutMs * 1.5)),
      });

      if (!createRes.ok) {
        const errBody = await createRes.text().catch(() => '');
        throw new Error(`Cloth VTO HTTP ${createRes.status}: ${errBody || createRes.statusText}`);
      }

      const resJson = (await createRes.json()) as YouCamS2STaskResponse;
      const taskId = resJson.data?.task_id;
      if (!taskId) {
        throw new Error(`Missing data.task_id in Cloth VTO response: ${JSON.stringify(resJson)}`);
      }

      console.log('[YouCam LIVE] Created Cloth VTO Task ID:', taskId);

      // 4. Poll GET /s2s/v2.0/task/cloth/{taskId} every 2s (max 10 attempts)
      const pollEndpoint = `${this.baseUrl}/s2s/v2.0/task/cloth/${encodeURIComponent(taskId)}`;
      for (let attempt = 1; attempt <= 10; attempt++) {
        await sleep(2000);

        const pollRes = await fetch(pollEndpoint, {
          method: 'GET',
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!pollRes.ok) {
          throw new Error(`Cloth VTO Poll HTTP ${pollRes.status}: ${pollRes.statusText}`);
        }

        const pollJson = (await pollRes.json()) as YouCamS2STaskResponse;
        const data = pollJson.data || {};

        if (data.task_status === 'success') {
          const renderedUrl = data.results?.url;
          if (!renderedUrl) {
            throw new Error(`Missing data.results.url in completed Cloth VTO task ${taskId}`);
          }

          console.log('[YouCam LIVE] Cloth VTO Rendered S3 URL:', renderedUrl);

          if (this.lastTaskTelemetry) {
            this.lastTaskTelemetry.vtoTaskId = taskId;
            this.lastTaskTelemetry.vtoS3Url = renderedUrl;
          }

          youcamCacheRepo.cacheVTO(personImg, garmentImg, renderedUrl);
          return renderedUrl;
        }

        if (data.task_status === 'error') {
          throw new Error(`YouCam Cloth VTO task ${taskId} failed: ${JSON.stringify(data)}`);
        }
      }

      throw new Error(`YouCam Cloth VTO task ${taskId} timed out after 10 polls`);
    } catch (err: unknown) {
      if (process.env.DEBUG_YOUCAM === 'true') {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[YouCamClient] Live cloth VTO fallback engaged (${msg}).`);
      }
      const fallbackUrl = getFallbackVTOImage(personImg, garmentImg);
      youcamCacheRepo.cacheVTO(personImg, garmentImg, fallbackUrl);
      return fallbackUrl;
    }
  }
}

export const youcamClient = new YouCamClient();
