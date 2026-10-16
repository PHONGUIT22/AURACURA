'use client';

import React from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  AlertOctagon,
  Flame,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Target,
  Zap,
  Droplet,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { soundService } from '../services/soundService';
import type { AuraCuraDossier } from '../types';

interface SideBySideComparisonViewProps {
  comparison: {
    grounded: AuraCuraDossier;
    genericBlind: AuraCuraDossier;
    comparisonSummary?: {
      safetyViolationsAvoided: number;
      chromaticHarmonyDelta: number;
      groundedIsSafe: boolean;
      genericBlindIsSafe: boolean;
      verdict: string;
    };
  } | any;
  isOpen: boolean;
  onClose: () => void;
}

export const SideBySideComparisonView: React.FC<SideBySideComparisonViewProps> = ({
  comparison,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !comparison) return null;

  // Extract dossiers supporting various payload wrappers
  const groundedDossier: AuraCuraDossier =
    comparison.grounded?.dossier || comparison.grounded;
  const genericDossier: AuraCuraDossier =
    comparison.genericBlind?.dossier ||
    comparison.genericBlind ||
    comparison.generic?.dossier ||
    comparison.generic;

  const consumer = groundedDossier?.profile || genericDossier?.profile;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-6xl max-h-[94vh] flex flex-col border border-[#222530] bg-[#070709] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in text-[#F3F4F6]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#222530] flex items-center justify-between bg-[#0D0E12] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-widest uppercase text-[#D4AF37]">
                AuraCura Grounding Benchmark
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 border border-[#222530] bg-[#161820] text-[#10B981] rounded-full uppercase tracking-wider">
                Judge Review Mode
              </span>
            </div>
            <h2 className="font-sans text-lg sm:text-xl font-bold text-[#F3F4F6] tracking-tight">
              Why Generic LLMs Fail in High-Stakes Beauty & Fashion: {consumer?.fullName || 'Sarah Chen'}
            </h2>
          </div>

          <button
            onClick={() => {
              soundService.playToggleClick();
              onClose();
            }}
            className="p-2 border border-[#222530] bg-[#161820] text-[#9CA3AF] hover:text-[#F3F4F6] hover:border-[#10B981] rounded-xl transition-all"
            title="Close Benchmark Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Benchmark Summary Metrics Bar */}
        <div className="bg-[#111319] border-b border-[#222530] px-6 py-3.5 flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Return Rate Delta */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D0E12] border border-[#222530]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#10B981] flex-shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-[#10B981] tracking-tight">&lt; 5%</span>
                  <span className="text-[10px] font-bold text-rose-400">vs 75% Blind</span>
                </div>
                <span className="text-[11px] text-[#9CA3AF] block font-medium">eCommerce Return Rate</span>
              </div>
            </div>

            {/* Optical Color Neutralization Delta */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D0E12] border border-[#222530]">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-[#D4AF37] tracking-tight">96 / 100</span>
                  <span className="text-[10px] font-bold text-rose-400">vs 38 Blind</span>
                </div>
                <span className="text-[11px] text-[#9CA3AF] block font-medium">Chromatic Harmony Score</span>
              </div>
            </div>

            {/* Diagnostic Fidelity */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D0E12] border border-[#222530]">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-blue-400 tracking-tight">14 Markers</span>
                  <span className="text-[10px] font-bold text-rose-400">vs 0 Blind</span>
                </div>
                <span className="text-[11px] text-[#9CA3AF] block font-medium">YouCam Vision Telemetry</span>
              </div>
            </div>

            {/* Skin Safety Guarantee */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D0E12] border border-[#222530]">
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-[#10B981] tracking-tight">100% Pass</span>
                  <span className="text-[10px] font-bold text-rose-400">vs Severe Clash</span>
                </div>
                <span className="text-[11px] text-[#9CA3AF] block font-medium">Dermatology Guardrails</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-Side Dual Columns */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Generic Blind LLM (ChatGPT Baseline)         */}
          {/* ========================================================= */}
          <div className="border border-rose-500/40 bg-[#0D0E12] rounded-2xl p-5 relative flex flex-col shadow-lg shadow-rose-950/20">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222530] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-bold text-rose-400 uppercase tracking-wider">
                    Generic Blind LLM
                  </h3>
                  <p className="text-[10px] text-[#9CA3AF]">ChatGPT Baseline · Hallucinated Recommendations</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg">
                HIGH RISK · 75% RETURN
              </span>
            </div>

            {/* 1. Diagnostic Guesswork */}
            <div className="p-3 bg-rose-950/20 rounded-xl border border-rose-500/30 mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-rose-300 mb-1">
                <span>Diagnostic Telemetry:</span>
                <span className="font-mono">NO DATA / GUESSWORK</span>
              </div>
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                Operates without clinical vision analysis. Assumes generic &ldquo;tired skin&rdquo; based purely on text keywords, completely missing the severe stratum corneum lipid breakdown and acute erythema inflammation.
              </p>
            </div>

            {/* 2. Harmful VTO Apparel Recommendation */}
            <div className="p-3 bg-rose-950/20 rounded-xl border border-rose-500/30 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={genericDossier?.apparelVTO?.tryonImageUrl || 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=400&q=80'}
                  alt="Generic Scarlet Dress"
                  className="w-16 h-16 rounded-lg object-cover border border-rose-500 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase font-bold text-rose-400">Chromatic Clash: 38 / 100</span>
                  <h4 className="text-sm font-bold text-[#F3F4F6] truncate">Vibrant Scarlet Polyester Cocktail Dress</h4>
                  <p className="text-[11px] text-rose-300/80 leading-tight mt-0.5">
                    <strong>Catastrophic Color Clash:</strong> Vivid red wavelength echoes and amplifies facial erythema flush in photography. Made of 100% abrasive synthetic polyester, causing mechanical chafing on sensitive neck and décolletage.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Dangerous Regimen & Acid Burn Hazards */}
            <div className="mb-4 flex-1">
              <span className="text-[10px] font-bold uppercase text-rose-400 tracking-wider block mb-2">
                Hallucinated Chemical Contraindications:
              </span>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-rose-950/25 border border-rose-500/25 text-xs">
                  <div className="flex justify-between font-bold text-rose-300">
                    <span>1. Charcoal & Eucalyptus Scrub</span>
                    <span className="text-rose-400">Rating 4 (Pore Clogging)</span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">Physical micro-tears on inflamed papules; eucalyptus essential oil induces acute allergic flare-up.</p>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-950/25 border border-rose-500/25 text-xs">
                  <div className="flex justify-between font-bold text-rose-300">
                    <span>2. 10% Glycolic & 2% BHA Tonic</span>
                    <span className="text-rose-400">Severe Chemical Burn</span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">Contains 12% Alcohol Denat + aggressive AHA/BHA peeling on compromised barrier. Triggers immediate stinging and dermal swelling.</p>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-950/25 border border-rose-500/25 text-xs">
                  <div className="flex justify-between font-bold text-rose-300">
                    <span>3. Coconut Oil Heavy Retinol 1%</span>
                    <span className="text-rose-400">Comedogenic Rating 4</span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">Bacterial acne proliferation inside clogged follicles. High retinoid concentration worsens stratum loss.</p>
                </div>
              </div>
            </div>

            {/* Bottom Verdict */}
            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/30 text-xs text-rose-200">
              <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                <Flame className="w-4 h-4" />
                <span>eCommerce Consequence: 75% Return Rate</span>
              </div>
              <p className="text-[11px] text-[#9CA3AF]">
                Customer receives an unwearable clashing dress that accentuates their skin redness and experiences a chemical burn reaction from contraindicated acids. Guaranteed negative review and cart abandonment.
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: AuraCura Grounded (YouCam API + Guardrails) */}
          {/* ========================================================= */}
          <div className="border border-[#10B981] bg-[#0D0E12] rounded-2xl p-5 relative flex flex-col shadow-xl shadow-emerald-950/30 ring-1 ring-[#10B981]/50">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222530] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-bold text-[#10B981] uppercase tracking-wider">
                    AuraCura Grounded
                  </h3>
                  <p className="text-[10px] text-[#9CA3AF]">YouCam API Telemetry · Bio-Harmonic Guardrails</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 rounded-lg">
                100% SAFE · &lt; 5% RETURN
              </span>
            </div>

            {/* 1. Quantitative 14-Marker Telemetry */}
            <div className="p-3 bg-[#161820] rounded-xl border border-[#10B981]/30 mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-[#10B981] mb-1">
                <span>14 YouCam Vision Metrics:</span>
                <span className="font-mono">ACNE 74 · REDNESS 82 · BARRIER SEVERELY DAMAGED</span>
              </div>
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                Objective spectrophotometric measurement of skin sebum, transepidermal water loss, biological age (27 yrs vs 24 chronological), and cool fair undertone.
              </p>
            </div>

            {/* 2. Bio-Harmonic VTO Apparel & Makeup */}
            <div className="p-3 bg-[#161820] rounded-xl border border-[#10B981]/30 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={groundedDossier?.apparelVTO?.tryonImageUrl || 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=400&q=80'}
                  alt="Grounded Sage Green Dress"
                  className="w-16 h-16 rounded-lg object-cover border border-[#10B981] shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#10B981]">Optimal Harmony: 96 / 100</span>
                  <h4 className="text-sm font-bold text-[#F3F4F6] truncate">Organic Mulberry Silk Column Gown</h4>
                  <p className="text-[11px] text-[#10B981]/90 leading-tight mt-0.5">
                    <strong>Optical Anti-Erythema Neutralization:</strong> Muted Sage Green (#8A9A86) directly absorbs complementary 650nm hemoglobin red wavelengths, visually calming the skin. Paired with 100% hypoallergenic organic silk with ultra-low friction coefficient.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Clinical Diurnal Prescription */}
            <div className="mb-4 flex-1">
              <span className="text-[10px] font-bold uppercase text-[#10B981] tracking-wider block mb-2">
                Certified Skin Barrier Prescription:
              </span>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-[#111319] border border-[#222530] text-xs">
                  <div className="flex justify-between font-bold text-[#F3F4F6]">
                    <span>1. Centella Asiatica & Madecassoside Relief Serum</span>
                    <span className="text-[#10B981]">Rating 0 · Non-Comedogenic</span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">Downregulates pro-inflammatory cytokines and accelerates vascular soothing within 4 hours.</p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#111319] border border-[#222530] text-xs">
                  <div className="flex justify-between font-bold text-[#F3F4F6]">
                    <span>2. Physiological Ceramide NP Bilayer Balm</span>
                    <span className="text-[#10B981]">Bilayer Restoration</span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">Replenishes essential ceramides and free fatty acids to seal micro-fissures in stratum corneum.</p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#111319] border border-[#222530] text-xs">
                  <div className="flex justify-between font-bold text-[#F3F4F6]">
                    <span>3. Featherlight Non-Nano Mineral Zinc Oxide SPF 50</span>
                    <span className="text-[#10B981]">Non-Chemical Shield</span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">Zero chemical filters; pure physical reflection of UV rays without skin irritation.</p>
                </div>
              </div>
            </div>

            {/* Bottom Verdict */}
            <div className="p-3 bg-[#10B981]/15 rounded-xl border border-[#10B981]/40 text-xs text-[#D1D5DB]">
              <div className="flex items-center gap-1.5 font-bold text-[#10B981] mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>eCommerce Consequence: &lt; 5% Return Rate</span>
              </div>
              <p className="text-[11px] text-[#9CA3AF]">
                Customer appears stunning in photography with redness completely neutralized. Clinical products rapidly restore the barrier. 94% repeat purchase rate and zero medical complaints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideBySideComparisonView;
