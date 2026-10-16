/**
 * MCP Tool: YouCam VTO Stylist
 * Generates generative Apparel Virtual Try-On (VTO) assets and computes chromatic harmony
 * between apparel color swatches and consumer skin tone/redness indicators.
 */

import { z } from 'zod';
import { youcamClient } from '../services/youcamClient.js';
import { dermatologyGuardrailService } from '../services/dermatologyGuardrailService.js';
import type { ApparelCategory, SkinToneUndertone, SkinMetrics, ApparelVTOItem } from '../types/index.js';

export const YoucamVtoStylistInputSchema = z.object({
  personImageUrl: z.string().describe('URL of consumer selfie or body portrait photo.'),
  garmentImageUrl: z.string().describe('URL of apparel product asset to simulate in VTO.'),
  garmentCategory: z.enum(['evening_gown', 'business_blazer', 'resort_wear', 'cocktail_dress']).describe('Apparel category.'),
  garmentName: z.string().optional().default('Bio-Harmonic Couturier Piece'),
  garmentBrand: z.string().optional().default('Aura Atelier'),
  garmentColorHex: z.string().describe('Primary garment hex code (e.g. #8A9A86, #1B263B).'),
  garmentColorName: z.string().describe('Human readable color description (e.g. Muted Sage Green, Midnight Navy).'),
  fabricComposition: z.array(z.string()).default(['100% Organic Mulberry Silk']),
  priceUsd: z.number().default(450),
  productUrl: z.string().optional().default('https://auracura.luxury/collections'),
  skinUndertone: z.enum(['cool_fair', 'neutral_medium', 'warm_deep', 'olive']).default('cool_fair'),
  rednessScore: z.number().min(0).max(100).default(50),
});

export type YoucamVtoStylistInput = z.infer<typeof YoucamVtoStylistInputSchema>;

export interface YoucamVtoStylistResult {
  tryonImageUrl: string;
  apparelItem: ApparelVTOItem;
  chromaticHarmonyScore: number;
  chromaticRationale: string;
  stylingAdvice: string;
  fabricFrictionVerdict: string;
}

export const youcamVtoStylistTool = {
  definition: {
    name: 'youcam_vto_stylist',
    description:
      'Synthesizes an apparel Virtual Try-On (VTO) simulation rendering and evaluates optical chromatic harmony against user facial erythema and undertone (e.g. Sage Green canceling redness wavelengths).',
    inputSchema: {
      type: 'object',
      properties: {
        personImageUrl: {
          type: 'string',
          description: 'URL of the consumer portrait or selfie.',
        },
        garmentImageUrl: {
          type: 'string',
          description: 'URL of the garment product image to superimpose.',
        },
        garmentCategory: {
          type: 'string',
          enum: ['evening_gown', 'business_blazer', 'resort_wear', 'cocktail_dress'],
          description: 'Fashion category of the garment.',
        },
        garmentName: { type: 'string', description: 'Display title of the apparel piece.' },
        garmentBrand: { type: 'string', description: 'Designer brand or fashion house.' },
        garmentColorHex: { type: 'string', description: 'Primary hex color code (e.g. "#8A9A86").' },
        garmentColorName: { type: 'string', description: 'Color description (e.g. "Muted Sage Green").' },
        fabricComposition: {
          type: 'array',
          items: { type: 'string' },
          description: 'Materials composition (e.g. ["100% Organic Mulberry Silk"]).',
        },
        priceUsd: { type: 'number', description: 'Retail price in USD.' },
        productUrl: { type: 'string', description: 'Link to purchase or reserve garment.' },
        skinUndertone: {
          type: 'string',
          enum: ['cool_fair', 'neutral_medium', 'warm_deep', 'olive'],
          description: 'User skin undertone classification.',
        },
        rednessScore: {
          type: 'number',
          description: 'Facial redness/erythema severity (0-100).',
        },
      },
      required: ['personImageUrl', 'garmentImageUrl', 'garmentCategory', 'garmentColorHex', 'garmentColorName'],
    },
  },

  async handler(args: YoucamVtoStylistInput): Promise<YoucamVtoStylistResult> {
    const validated = YoucamVtoStylistInputSchema.parse(args);

    // 1. Generate Virtual Try-On Asset via YouCam client or Fallback
    const tryonImageUrl = await youcamClient.generateApparelTryOn(
      validated.personImageUrl,
      validated.garmentImageUrl
    );

    // 2. Synthesize Apparel item
    const apparelItem: ApparelVTOItem = {
      id: `vto_${Date.now()}`,
      name: validated.garmentName,
      brand: validated.garmentBrand,
      category: validated.garmentCategory as ApparelCategory,
      colorHex: validated.garmentColorHex,
      colorName: validated.garmentColorName,
      fabricComposition: validated.fabricComposition,
      chromaticHarmonyScore: 85,
      priceUsd: validated.priceUsd,
      productUrl: validated.productUrl,
      tryonImageUrl,
    };

    // 3. Compute Chromatic Harmony using Dermatology Guardrail Service
    const mockMetrics: SkinMetrics = {
      acneScore: 30,
      rednessScore: validated.rednessScore,
      moistureScore: 50,
      poreScore: 40,
      wrinkleScore: 20,
      darkCircleScore: 30,
      skinAge: 28,
      chronologicalAge: 28,
      undertone: validated.skinUndertone as SkinToneUndertone,
      barrierStatus: validated.rednessScore > 60 ? 'severely_damaged' : 'healthy',
    };

    const harmony = dermatologyGuardrailService.computeChromaticHarmony(mockMetrics, apparelItem);
    apparelItem.chromaticHarmonyScore = harmony.score;

    // 4. Fabric Friction Verification
    const fabricAudit = dermatologyGuardrailService.auditFabricFriction(mockMetrics, apparelItem);

    return {
      tryonImageUrl,
      apparelItem,
      chromaticHarmonyScore: harmony.score,
      chromaticRationale: harmony.rationale,
      stylingAdvice: `${harmony.recommendation} Styling Lookbook: Silhouette balances skin tone with structural drape.`,
      fabricFrictionVerdict: fabricAudit.detail,
    };
  },
};
