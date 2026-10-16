/**
 * MCP Tool: YouCam Skin Diagnostician
 * Analyzes facial skin metrics (14 indices: acne, redness, moisture, pores, wrinkles, dark circles,
 * biological skin age, undertone, and barrier status) via YouCam API or the Clinical Fallback Vault.
 */

import { z } from 'zod';
import { youcamClient } from '../services/youcamClient.js';
import { beautyProfileRepo } from '../database/beautyProfileRepo.js';
import type { SkinMetrics } from '../types/index.js';

export const YoucamSkinDiagnosticianInputSchema = z.object({
  imageUrl: z.string().describe('Public or authenticated URL of the consumer selfie photo to diagnose.'),
  consumerId: z.string().optional().describe('Optional ID of existing ConsumerBeautyProfile to associate with.'),
});

export type YoucamSkinDiagnosticianInput = z.infer<typeof YoucamSkinDiagnosticianInputSchema>;

export interface YoucamSkinDiagnosticianResult {
  skinMetrics: SkinMetrics;
  diagnosticSummary: string;
  primaryConcerns: string[];
  barrierIntegrityAlert: string | null;
  recommendedChromaticTones: string[];
}

export const youcamSkinDiagnosticianTool = {
  definition: {
    name: 'youcam_skin_diagnostician',
    description:
      'Performs optical and clinical facial skin diagnosis across 14 dermatological parameters (acne, redness, moisture/TEWL, pores, wrinkles, dark circles, skin age, undertone, barrier status) from an input selfie image.',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'Direct image URL of the consumer front-facing selfie (natural light, unretouched).',
        },
        consumerId: {
          type: 'string',
          description: 'Optional registered consumer profile ID (e.g. "sarah-chen", "marcus-reed").',
        },
      },
      required: ['imageUrl'],
    },
  },

  async handler(args: YoucamSkinDiagnosticianInput): Promise<YoucamSkinDiagnosticianResult> {
    const validated = YoucamSkinDiagnosticianInputSchema.parse(args);
    let targetUrl = validated.imageUrl;

    // If consumerId is provided but imageUrl is generic, retrieve the user's selfie URL
    if (validated.consumerId && (!targetUrl || targetUrl.includes('placeholder'))) {
      const profile = beautyProfileRepo.getProfile(validated.consumerId);
      if (profile?.userSelfieUrl) {
        targetUrl = profile.userSelfieUrl;
      }
    }

    const metrics = await youcamClient.analyzeSkin(targetUrl);

    // Identify primary concerns
    const primaryConcerns: string[] = [];
    if (metrics.acneScore > 50) primaryConcerns.push(`Inflammatory Acne Severity (${metrics.acneScore}/100)`);
    if (metrics.rednessScore > 50) primaryConcerns.push(`Cutaneous Erythema / Micro-Vascular Redness (${metrics.rednessScore}/100)`);
    if (metrics.moistureScore < 40) primaryConcerns.push(`Trans-Epidermal Dehydration (${metrics.moistureScore}/100)`);
    if (metrics.poreScore > 60) primaryConcerns.push(`Follicular Dilation / Pore Congestion (${metrics.poreScore}/100)`);
    if (metrics.wrinkleScore > 50) primaryConcerns.push(`Superficial & Deep Rhytids (${metrics.wrinkleScore}/100)`);
    if (metrics.darkCircleScore > 60) primaryConcerns.push(`Periorbital Hyperpigmentation / Melasma (${metrics.darkCircleScore}/100)`);

    // Barrier alert evaluation
    let barrierIntegrityAlert: string | null = null;
    if (metrics.barrierStatus === 'severely_damaged') {
      barrierIntegrityAlert = 'CRITICAL: Stratum corneum intercellular lipid matrix is severely compromised. Suspend all AHA/BHA/Retinoids immediately. Prioritize pure Ceramide NP and Centella Asiatica.';
    } else if (metrics.barrierStatus === 'compromised') {
      barrierIntegrityAlert = 'WARNING: Lipid barrier shows impaired barrier function. Limit harsh foaming cleansers and high-friction textiles.';
    }

    // Recommended chromatic balancing tones
    const recommendedChromaticTones: string[] = [];
    if (metrics.rednessScore > 50 || metrics.undertone === 'cool_fair') {
      recommendedChromaticTones.push('Muted Sage Green (#8A9A86)', 'Olive Green (#4B5320)', 'Slate Gray');
    } else if (metrics.moistureScore < 35 || metrics.undertone === 'neutral_medium') {
      recommendedChromaticTones.push('Midnight Deep Navy (#1B263B)', 'Charcoal', 'Warm Camel');
    } else {
      recommendedChromaticTones.push('Warm Terracotta (#C86D51)', 'Emerald Green', 'Deep Bronze');
    }

    const diagnosticSummary = `Clinical scan complete for skin age ${metrics.skinAge} (chronological: ${metrics.chronologicalAge}, undertone: ${metrics.undertone}). Barrier status: ${metrics.barrierStatus}. Detected ${primaryConcerns.length} key clinical priority vector(s).`;

    return {
      skinMetrics: metrics,
      diagnosticSummary,
      primaryConcerns,
      barrierIntegrityAlert,
      recommendedChromaticTones,
    };
  },
};
