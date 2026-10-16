import { pdfService } from '../src/services/pdfService.ts';
import fs from 'node:fs';

console.log('=== TESTING AURACURA VECTOR PDF GENERATION ===');

const mockDossier = {
  profile: {
    id: 'sarah-chen',
    fullName: 'Sarah Chen',
    age: 24,
    eventContext: 'Black Tie Charity Gala at SF MOMA (Acute Erythema Crisis)',
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
  apparelVTO: {
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
  skincareRegimen: [
    {
      stepNumber: 1,
      phase: 'morning',
      stepType: 'cleanse',
      productName: 'Gentle Calming Centella Cleanser',
      brand: 'Aura Derma Lab',
      keyActives: ['Centella Asiatica', 'Glycerin'],
      comedogenicRating: 0,
      clinicalRationale: 'Soothes vascular dilation and removes impurities without stripping sebum.',
      priceUsd: 32,
    },
    {
      stepNumber: 2,
      phase: 'morning',
      stepType: 'treat',
      productName: 'Madecassoside 0.5% & Ceramide NP Repair Serum',
      brand: 'Aura Derma Lab',
      keyActives: ['Madecassoside 0.5%', 'Ceramide NP', 'Panthenol 5%'],
      comedogenicRating: 0,
      clinicalRationale: 'Rebuilds intercellular lipid matrix and downregulates erythema.',
      priceUsd: 48,
    },
    {
      stepNumber: 3,
      phase: 'morning',
      stepType: 'protect',
      productName: 'Non-Nano Mineral Zinc Oxide SPF 50',
      brand: 'Aura Derma Lab',
      keyActives: ['Zinc Oxide 20%', 'Bisabolol'],
      comedogenicRating: 1,
      clinicalRationale: 'Pure physical UVA/UVB barrier without chemical heat sensation.',
      priceUsd: 42,
    },
    {
      stepNumber: 4,
      phase: 'evening',
      stepType: 'barrier_repair',
      productName: 'Bilayer Lipid Recovery Night Balm',
      brand: 'Aura Derma Lab',
      keyActives: ['Ceramides EOP/NS/NP', 'Phytosphingosine'],
      comedogenicRating: 0,
      clinicalRationale: 'Seals nocturnal moisture and repairs stratum corneum fissures.',
      priceUsd: 64,
    },
  ],
  safetyAudit: {
    isSafe: true,
    checks: [
      { id: 'comedogenic', status: 'pass', detail: '0 high-comedogenic ingredients found' },
      { id: 'active_clash', status: 'pass', detail: '0 contraindicated direct acid conflicts' },
      { id: 'barrier_safety', status: 'pass', detail: 'Alcohol Denat 0%, 0 allergens detected' },
      { id: 'fabric_friction', status: 'pass', detail: 'Mulberry silk verified ultra-low friction' },
    ],
    summary: 'Clinical prescription and silk gown 100% cleared for acute barrier flare-up.',
  },
  eventLookbookAdvice: 'Pair with featherlight mineral foundation and organic mulberry silk gown.',
  executionMode: 'auracura_grounded',
  generatedAt: new Date().toISOString(),
};

try {
  const doc = pdfService.createAuraCuraDossierPdfDoc(mockDossier);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  const outputPath = 'frontend/scripts/test_output_lookbook.pdf';
  fs.writeFileSync(outputPath, pdfBuffer);

  console.log(`\n✅ Generated PDF File: ${outputPath}`);
  console.log(`File Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

  // Verify PDF header magic bytes '%PDF'
  const isPdf = pdfBuffer.slice(0, 4).toString() === '%PDF';
  console.log(`Valid %PDF header: ${isPdf}`);

  if (!isPdf || pdfBuffer.length < 5000) {
    console.error('❌ PDF generation failed validation!');
    process.exit(1);
  }

  console.log('✅ ALL PDF VERIFICATION CRITERIA PASSED CLEANLY!\n');
} catch (err) {
  console.error('Fatal PDF export error:', err);
  process.exit(1);
}
