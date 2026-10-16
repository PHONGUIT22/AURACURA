/**
 * MCP Tool: Formulation & Fabric Safety Guardrail
 * Performs clinical multi-vector audits across Comedogenicity, Active Ingredient Clashes,
 * Barrier Integrity, and Fabric Friction Micro-abrasions.
 */

import { z } from 'zod';
import { dermatologyGuardrailService } from '../services/dermatologyGuardrailService.js';
import { beautyProfileRepo } from '../database/beautyProfileRepo.js';
import type {
  SkinMetrics,
  ApparelVTOItem,
  SkincareStep,
  SafetyAuditResult,
  ConsumerBeautyProfile,
} from '../types/index.js';

export const FormulationSafetyGuardrailInputSchema = z.object({
  consumerId: z.string().optional().describe('ID of ConsumerBeautyProfile to check allergies against.'),
  skinMetrics: z
    .object({
      acneScore: z.number().min(0).max(100),
      rednessScore: z.number().min(0).max(100),
      moistureScore: z.number().min(0).max(100),
      poreScore: z.number().min(0).max(100),
      wrinkleScore: z.number().min(0).max(100),
      darkCircleScore: z.number().min(0).max(100),
      skinAge: z.number(),
      chronologicalAge: z.number(),
      undertone: z.enum(['cool_fair', 'neutral_medium', 'warm_deep', 'olive']),
      barrierStatus: z.enum(['healthy', 'compromised', 'severely_damaged']),
    })
    .describe('Diagnostic skin metrics.'),
  apparel: z
    .object({
      id: z.string().default('apparel-01'),
      name: z.string(),
      brand: z.string(),
      category: z.enum(['evening_gown', 'business_blazer', 'resort_wear', 'cocktail_dress']),
      colorHex: z.string(),
      colorName: z.string(),
      fabricComposition: z.array(z.string()),
      chromaticHarmonyScore: z.number().default(85),
      priceUsd: z.number().default(500),
      productUrl: z.string().default('https://auracura.luxury'),
      tryonImageUrl: z.string().default(''),
    })
    .describe('Apparel piece being paired.'),
  skincareRegimen: z
    .array(
      z.object({
        stepNumber: z.number(),
        phase: z.enum(['morning', 'evening']),
        stepType: z.enum(['cleanse', 'treat', 'barrier_repair', 'protect']),
        productName: z.string(),
        brand: z.string(),
        keyActives: z.array(z.string()),
        comedogenicRating: z.number().min(0).max(5),
        clinicalRationale: z.string(),
        priceUsd: z.number(),
      })
    )
    .describe('Candidate daily skincare regimen steps to evaluate.'),
  knownAllergies: z.array(z.string()).optional().default([]),
});

export type FormulationSafetyGuardrailInput = z.infer<typeof FormulationSafetyGuardrailInputSchema>;

export const formulationSafetyGuardrailTool = {
  definition: {
    name: 'formulation_safety_guardrail',
    description:
      'Audits cosmetic product actives and garment fabric composition against clinical dermatology rules (Comedogenicity, Active Chemical Clash, Barrier Safety, and Fabric Micro-Friction).',
    inputSchema: {
      type: 'object',
      properties: {
        consumerId: {
          type: 'string',
          description: 'Optional ID of consumer beauty profile to cross-reference known allergies.',
        },
        skinMetrics: {
          type: 'object',
          description: 'Full clinical skin metrics of the consumer.',
          properties: {
            acneScore: { type: 'number' },
            rednessScore: { type: 'number' },
            moistureScore: { type: 'number' },
            poreScore: { type: 'number' },
            wrinkleScore: { type: 'number' },
            darkCircleScore: { type: 'number' },
            skinAge: { type: 'number' },
            chronologicalAge: { type: 'number' },
            undertone: { type: 'string', enum: ['cool_fair', 'neutral_medium', 'warm_deep', 'olive'] },
            barrierStatus: { type: 'string', enum: ['healthy', 'compromised', 'severely_damaged'] },
          },
          required: ['acneScore', 'rednessScore', 'moistureScore', 'undertone', 'barrierStatus'],
        },
        apparel: {
          type: 'object',
          description: 'Apparel piece evaluated for neckline friction and textile breathability.',
          properties: {
            name: { type: 'string' },
            brand: { type: 'string' },
            category: { type: 'string', enum: ['evening_gown', 'business_blazer', 'resort_wear', 'cocktail_dress'] },
            fabricComposition: { type: 'array', items: { type: 'string' } },
            colorHex: { type: 'string' },
            colorName: { type: 'string' },
          },
          required: ['name', 'category', 'fabricComposition'],
        },
        skincareRegimen: {
          type: 'array',
          description: 'List of proposed skincare steps evaluated for comedogenicity and active clashes.',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              phase: { type: 'string', enum: ['morning', 'evening'] },
              stepType: { type: 'string', enum: ['cleanse', 'treat', 'barrier_repair', 'protect'] },
              productName: { type: 'string' },
              brand: { type: 'string' },
              keyActives: { type: 'array', items: { type: 'string' } },
              comedogenicRating: { type: 'number' },
              clinicalRationale: { type: 'string' },
              priceUsd: { type: 'number' },
            },
            required: ['productName', 'phase', 'stepType', 'keyActives', 'comedogenicRating'],
          },
        },
        knownAllergies: {
          type: 'array',
          items: { type: 'string' },
          description: 'Documented allergies or contraindicated ingredients.',
        },
      },
      required: ['skinMetrics', 'apparel', 'skincareRegimen'],
    },
  },

  async handler(args: FormulationSafetyGuardrailInput): Promise<SafetyAuditResult> {
    const validated = FormulationSafetyGuardrailInputSchema.parse(args);

    let profile: ConsumerBeautyProfile = {
      id: validated.consumerId || 'anon_consumer',
      fullName: 'Anonymous Consumer',
      age: validated.skinMetrics.chronologicalAge,
      eventContext: 'Special Event',
      budgetLimitUsd: 1500,
      knownAllergies: validated.knownAllergies || [],
      userSelfieUrl: '',
      preferredStyle: 'Bio-Harmonic Luxury',
    };

    if (validated.consumerId) {
      const dbProfile = beautyProfileRepo.getProfile(validated.consumerId);
      if (dbProfile) {
        profile = {
          ...dbProfile,
          knownAllergies: Array.from(new Set([...dbProfile.knownAllergies, ...(validated.knownAllergies || [])])),
        };
      }
    }

    const auditResult = dermatologyGuardrailService.auditDermatologySafety(
      profile,
      validated.skinMetrics as SkinMetrics,
      validated.apparel as ApparelVTOItem,
      validated.skincareRegimen as SkincareStep[]
    );

    return auditResult;
  },
};
