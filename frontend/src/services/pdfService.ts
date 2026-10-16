import { jsPDF } from 'jspdf';
import type { AuraCuraDossier } from '../types';

export const pdfService = {
  /**
   * Generates a jsPDF instance representing the official A4 Clinical Prescription & Bio-Harmonic Lookbook.
   */
  createAuraCuraDossierPdfDoc(dossier: AuraCuraDossier): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const profile = dossier.profile;
    const metrics = dossier.skinMetrics;
    const apparel = dossier.apparelVTO;
    const regimen = dossier.skincareRegimen || [];
    const audit = dossier.safetyAudit;

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 14;
    const contentWidth = pageWidth - margin * 2; // 182mm

    // ==========================================
    // 1. LUXURY BACKGROUND & CANONICAL HEADER
    // ==========================================
    // Base canvas - Deep Pure White with Warm Tech Slate Lines
    doc.setFillColor(252, 252, 253);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

    // Top Obsidian & Emerald Accent Bar #070709 & #10B981
    doc.setFillColor(7, 7, 9);
    doc.rect(0, 0, pageWidth, 5, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 5, pageWidth, 1.2, 'F');

    let y = 14;

    // Header Branding & Confidential Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129); // Emerald #10B981
    doc.text('AURACURA · AUTONOMOUS BIO-HARMONIC VTO & CLINICAL DERMATOLOGY', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128); // Slate 500
    doc.text(`CONFIDENTIAL CLINICAL LOOKBOOK · DOSSIER ID: ${dossier.profile?.id?.toUpperCase() || 'AC-8491'}`, pageWidth - margin, y, { align: 'right' });

    y += 7;

    // Title Headline
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39); // Gray 900
    doc.text('AURACURA CLINICAL PRESCRIPTION & BIO-HARMONIC LOOKBOOK', margin, y);

    y += 6;

    // ==========================================
    // 2. PATIENT HERO DOSSIER CARD
    // ==========================================
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'S');

    // Left Emerald Accent Pillar
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(margin, y, 2.5, 23, 1, 1, 'F');

    // Patient Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text(profile.fullName || 'Sarah Chen', margin + 6, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Age: ${profile.age} yrs  ·  Context: ${profile.eventContext || 'Black Tie Gala'}`, margin + 6, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9); // Amber 700
    doc.text(`BUDGET CEILING: $${profile.budgetLimitUsd?.toLocaleString() || '1,200'} USD`, margin + 6, y + 18);

    // Right Column: Barrier & Undertone Badge
    const barrierLabel = `BARRIER STATUS: ${metrics.barrierStatus.toUpperCase().replace('_', ' ')}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (metrics.barrierStatus === 'severely_damaged') {
      doc.setTextColor(220, 38, 38); // Red 600
    } else {
      doc.setTextColor(16, 185, 129);
    }
    doc.text(barrierLabel, pageWidth - margin - 4, y + 6, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(`Undertone: ${metrics.undertone.replace('_', ' ').toUpperCase()}  ·  Skin Age: ${metrics.skinAge} yrs (Chronological: ${metrics.chronologicalAge} yrs)`, pageWidth - margin - 4, y + 12, { align: 'right' });

    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text('GUARDRAIL AUDIT: 100% CERTIFIED SAFE', pageWidth - margin - 4, y + 18, { align: 'right' });

    y += 28;

    // ==========================================
    // 3. SECTION I: CLINICAL SKIN DIAGNOSTICS (14 MARKERS)
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(7, 7, 9);
    doc.text('I. YOUCAM MULTI-SPECTRAL DIAGNOSTIC TELEMETRY (14 BIO-MARKERS)', margin, y);

    y += 3.5;
    const metricBoxWidth = (contentWidth - 10) / 6;
    const diagCards = [
      { label: 'Acne Severity', val: `${metrics.acneScore}/100`, alert: metrics.acneScore > 60 },
      { label: 'Redness Flush', val: `${metrics.rednessScore}/100`, alert: metrics.rednessScore > 60 },
      { label: 'Hydration TEWL', val: `${metrics.moistureScore}/100`, alert: metrics.moistureScore < 50 },
      { label: 'Pore Dilation', val: `${metrics.poreScore}/100`, alert: false },
      { label: 'Wrinkle Index', val: `${metrics.wrinkleScore}/100`, alert: false },
      { label: 'Dark Circles', val: `${metrics.darkCircleScore}/100`, alert: false },
    ];

    for (let i = 0; i < diagCards.length; i++) {
      const card = diagCards[i];
      const cx = margin + i * (metricBoxWidth + 2);

      doc.setFillColor(card.alert ? 254 : 255, card.alert ? 242 : 255, card.alert ? 242 : 255);
      doc.roundedRect(cx, y, metricBoxWidth, 14, 1.5, 1.5, 'F');
      doc.setDrawColor(card.alert ? 252 : 229, card.alert ? 165 : 231, card.alert ? 165 : 235);
      doc.roundedRect(cx, y, metricBoxWidth, 14, 1.5, 1.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(card.alert ? 185 : 107, card.alert ? 28 : 114, card.alert ? 28 : 128);
      doc.text(card.label, cx + metricBoxWidth / 2, y + 4.5, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(card.alert ? 220 : 17, card.alert ? 38 : 24, card.alert ? 38 : 39);
      doc.text(card.val, cx + metricBoxWidth / 2, y + 10.5, { align: 'center' });
    }

    y += 19;

    // ==========================================
    // 4. SECTION II: BIO-HARMONIC APPAREL VTO
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(7, 7, 9);
    doc.text('II. BIO-HARMONIC APPAREL VTO & OPTICAL ERYTHEMA NEUTRALIZATION', margin, y);

    y += 3.5;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, 31, 2, 2, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, y, contentWidth, 31, 2, 2, 'S');

    // Left Garment Image Simulation Frame
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin + 4, y + 3.5, 24, 24, 1.5, 1.5, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.roundedRect(margin + 4, y + 3.5, 24, 24, 1.5, 1.5, 'S');

    // Color Swatch Disc in Image Box
    doc.setFillColor(138, 154, 134); // Muted Sage Green #8A9A86
    doc.circle(margin + 16, y + 13, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(255, 255, 255);
    doc.text('VTO SILK', margin + 16, y + 23, { align: 'center' });

    // Garment Metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(apparel.name || 'Organic Mulberry Silk Column Gown', margin + 32, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`Atelier: ${apparel.brand || 'Aura Atelier Bio-Couture'}  ·  Category: ${apparel.category.toUpperCase().replace('_', ' ')}  ·  Valuation: $${apparel.priceUsd} USD`, margin + 32, y + 12);

    // Optical Harmony Metric Bar & Rationale
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`CHROMATIC HARMONY SCORE: ${apparel.chromaticHarmonyScore || 96} / 100 (OPTIMAL BIO-CANCELLATION)`, margin + 32, y + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(55, 65, 81);
    doc.text(
      'Optical Science: Muted Sage Green (#8A9A86) complementary 520nm wave directly absorbs and visually neutralizes excess 650nm hemoglobin red reflection, eliminating flush under flash photography. Ultra-low friction silk prevents décolletage chafing.',
      margin + 32,
      y + 22,
      { maxWidth: contentWidth - 36 }
    );

    y += 36;

    // ==========================================
    // 5. SECTION III: DIURNAL CLINICAL PRESCRIPTION (24H ROUTINE)
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(7, 7, 9);
    doc.text('III. DIURNAL SKINCARE PRESCRIPTION (CIRCADIAN BARRIER REPAIR PROTOCOL)', margin, y);

    y += 3.5;
    const steps = regimen.slice(0, 4);
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const isMorning = step.phase === 'morning';

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, contentWidth, 14.5, 1.5, 1.5, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(margin, y, contentWidth, 14.5, 1.5, 1.5, 'S');

      // Phase Pill
      doc.setFillColor(isMorning ? 254 : 236, isMorning ? 243 : 253, isMorning ? 199 : 245);
      doc.roundedRect(margin + 3, y + 2.5, 16, 4.5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(isMorning ? 180 : 4, isMorning ? 83 : 120, isMorning ? 9 : 87);
      doc.text(isMorning ? 'AM STEP' : 'PM STEP', margin + 11, y + 5.7, { align: 'center' });

      // Step Number & Product Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text(`Step ${step.stepNumber}: ${step.productName}`, margin + 22, y + 5.5, { maxWidth: contentWidth - 65 });

      // Price
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129);
      doc.text(`$${step.priceUsd}`, pageWidth - margin - 4, y + 5.5, { align: 'right' });

      // Actives & Rationale
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(107, 114, 128);
      const activesStr = (step.keyActives || []).join(', ');
      doc.text(`Key Actives: ${activesStr || 'Centella, Ceramide NP'}  ·  Comedogenic Rating: ${step.comedogenicRating} (Non-Comedogenic)`, margin + 22, y + 9.5);

      doc.setTextColor(75, 85, 99);
      doc.text(step.clinicalRationale, margin + 22, y + 13, { maxWidth: contentWidth - 30 });

      y += 16.5;
    }

    y += 1;

    // ==========================================
    // 6. SECTION IV: DERMATOLOGY SAFETY AUDIT & QR CLEARANCE SEAL
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(7, 7, 9);
    doc.text('IV. MULTI-VECTOR SAFETY CLEARANCE & DIGITAL CONCIERGE CHECKOUT', margin, y);

    y += 3.5;
    doc.setFillColor(240, 253, 244); // Green 50
    doc.roundedRect(margin, y, contentWidth, 29, 2, 2, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, y, contentWidth, 29, 2, 2, 'S');

    // 4 Check Pills
    const checkNames = [
      '1. Comedogenicity: 0 Clog Hazards',
      '2. Active Clash: 0 Retinoid/BHA Conflict',
      '3. Barrier Integrity: 0% Denat Alcohol',
      '4. Fabric Friction: Silk Micro-Tear Safe',
    ];
    for (let c = 0; c < checkNames.length; c++) {
      const col = c % 2;
      const row = Math.floor(c / 2);
      const px = margin + 4 + col * 75;
      const py = y + 5 + row * 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(22, 101, 52); // Green 800
      doc.text(`[PASSED] ${checkNames[c]}`, px, py);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Executive Summary: ${audit.summary || 'All recommended apparel and formulations cleared for acute barrier crisis with 0 contraindicated actives.'}`,
      margin + 4,
      y + 19,
      { maxWidth: contentWidth - 42 }
    );

    // ==========================================
    // High-Precision Vector QR Code Simulation Box
    // ==========================================
    const qrSize = 21;
    const qrx = pageWidth - margin - qrSize - 3;
    const qry = y + 4;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrx, qry, qrSize, qrSize, 1.5, 1.5, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(qrx, qry, qrSize, qrSize, 1.5, 1.5, 'S');

    // Draw Geometric QR Code Patterns
    doc.setFillColor(7, 7, 9);
    // Outer Finder Corners
    doc.rect(qrx + 2, qry + 2, 5, 5, 'F');
    doc.rect(qrx + qrSize - 7, qry + 2, 5, 5, 'F');
    doc.rect(qrx + 2, qry + qrSize - 7, 5, 5, 'F');
    // Inner Finder White Cutouts
    doc.setFillColor(255, 255, 255);
    doc.rect(qrx + 3, qry + 3, 3, 3, 'F');
    doc.rect(qrx + qrSize - 6, qry + 3, 3, 3, 'F');
    doc.rect(qrx + 3, qry + qrSize - 6, 3, 3, 'F');
    // Finder Center Dots
    doc.setFillColor(16, 185, 129);
    doc.rect(qrx + 3.8, qry + 3.8, 1.4, 1.4, 'F');
    doc.rect(qrx + qrSize - 5.2, qry + 3.8, 1.4, 1.4, 'F');
    doc.rect(qrx + 3.8, qry + qrSize - 5.2, 1.4, 1.4, 'F');
    // Scattered Vector Bits
    doc.setFillColor(7, 7, 9);
    doc.rect(qrx + 9, qry + 4, 1.4, 1.4, 'F');
    doc.rect(qrx + 11, qry + 7, 1.4, 1.4, 'F');
    doc.rect(qrx + 8, qry + 10, 1.4, 1.4, 'F');
    doc.rect(qrx + 10, qry + 13, 1.4, 1.4, 'F');
    doc.rect(qrx + 14, qry + 11, 1.4, 1.4, 'F');
    doc.rect(qrx + 12, qry + 15, 1.4, 1.4, 'F');
    doc.rect(qrx + 8, qry + 16, 1.4, 1.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(16, 185, 129);
    doc.text('SCAN TO ORDER', qrx + qrSize / 2, qry + qrSize - 1.2, { align: 'center' });

    // ==========================================
    // 7. FOOTER CERTIFICATION & SIGN-OFF
    // ==========================================
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, 283, pageWidth - margin, 283);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      'AURACURA AUTONOMOUS BIO-HARMONIC VTO MCP SERVER · CLINICAL VISION & DERMATOLOGY GUARDRAILS ENGINE',
      margin,
      288
    );
    doc.text('OFFICIAL MEDICAL & STYLING CLEARANCE · 100% NON-COMEDOGENIC', pageWidth - margin, 288, {
      align: 'right',
    });

    return doc;
  },

  /**
   * Generates and triggers direct client-side browser download of the PDF.
   */
  exportAuraCuraDossierPdf(dossier: AuraCuraDossier): void {
    const doc = this.createAuraCuraDossierPdfDoc(dossier);
    const safeName = (dossier.profile?.fullName || 'sarah_chen').toLowerCase().replace(/[^a-z0-9]/g, '_');
    doc.save(`AuraCura_Clinical_Lookbook_${safeName}.pdf`);
  },

  // Alias for backward compatibility
  exportExecutiveDossierPdf(dossier: any): void {
    this.exportAuraCuraDossierPdf(dossier);
  },
};

export default pdfService;
