'use client';

import React, { useState } from 'react';
import { Sparkles, Eye, Sliders, ExternalLink, ShieldCheck, Palette, ShoppingBag, Layers } from 'lucide-react';
import { soundService } from '../../services/soundService';
import type { ApparelVTOItem } from '../../types';

interface ApparelAndMakeupVTOCardProps {
  apparelItem: ApparelVTOItem;
  userSelfieUrl?: string;
  eventContext?: string;
}

export const ApparelAndMakeupVTOCard: React.FC<ApparelAndMakeupVTOCardProps> = ({
  apparelItem,
  userSelfieUrl,
  eventContext,
}) => {
  // Slider position from 0 to 100%
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'split'>('slider');

  const beforeImage = userSelfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
  const afterImage = apparelItem.tryonImageUrl || 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80';

  const harmonyScore = apparelItem.chromaticHarmonyScore || 94;

  const getHarmonyClassification = (score: number) => {
    if (score >= 90) return { label: 'Optimal Bio-Harmonic Neutralization', color: 'text-[#10B981]', border: 'border-[#10B981]/40' };
    if (score >= 75) return { label: 'Moderate Chromatic Balance', color: 'text-[#D4AF37]', border: 'border-[#D4AF37]/40' };
    return { label: 'Chromatic Clash Detected', color: 'text-rose-400', border: 'border-rose-500/40' };
  };

  const harmonyInfo = getHarmonyClassification(harmonyScore);

  return (
    <div className="border border-[#222530] bg-[#0D0E12] rounded-2xl p-6 shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#222530]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="font-sans text-base font-bold text-[#F3F4F6] tracking-tight">
              Autonomous Bio-Harmonic VTO Simulation
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Before & After Optical Erythema Neutralization · Generative Try-On
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-[#161820] border border-[#222530] rounded-xl">
          <button
            type="button"
            onClick={() => {
              soundService.playToggleClick();
              setViewMode('slider');
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'slider'
                ? 'bg-[#10B981] text-[#070709] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            Interactive Slider
          </button>
          <button
            type="button"
            onClick={() => {
              soundService.playToggleClick();
              setViewMode('split');
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'split'
                ? 'bg-[#10B981] text-[#070709] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            Side-by-Side Split
          </button>
        </div>
      </div>

      {/* Main Visual Arena: Before / After Comparison */}
      <div className="my-6">
        {viewMode === 'slider' ? (
          /* Interactive Drag Slider View */
          <div className="relative w-full h-[400px] md:h-[460px] rounded-2xl overflow-hidden border border-[#222530] select-none bg-black">
            {/* After (VTO Try-On) Image (Full Background) */}
            <img
              src={afterImage}
              alt="After AI Try-On"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-[#070709]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37] flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AFTER: Bio-Harmonic VTO</span>
            </div>

            {/* Before (Original Diagnostic Selfie) Clipped Image */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={beforeImage}
                alt="Before Flare-Up Selfie"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', height: '100%', objectPosition: 'left center' }}
              />
              <div className="absolute top-3 left-3 bg-[#070709]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center gap-1.5 shadow-lg">
                <Eye className="w-3.5 h-3.5" />
                <span>BEFORE: Diagnostic Baseline</span>
              </div>
            </div>

            {/* Divider Line & Handle */}
            <div
              className="absolute inset-y-0 w-0.5 bg-white cursor-ew-resize shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-2xl border-2 border-[#10B981]">
                <Sliders className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* Hidden native input range for smooth dragging / touch */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              aria-label="Before and After VTO Comparison Slider"
            />
          </div>
        ) : (
          /* Side-by-Side Split View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative h-80 rounded-2xl overflow-hidden border border-[#222530] group">
              <img src={beforeImage} alt="Before Selfie" className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-[#070709]/85 backdrop-blur-md px-3 py-1 rounded-lg border border-rose-500/30 text-xs font-semibold text-rose-300">
                BEFORE: Raw Diagnostic Selfie
              </div>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden border border-[#D4AF37]/40 group shadow-lg">
              <img src={afterImage} alt="After AI VTO" className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-[#070709]/85 backdrop-blur-md px-3 py-1 rounded-lg border border-[#D4AF37]/50 text-xs font-semibold text-[#D4AF37] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AFTER: Couture Simulation</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chromatic Harmony Gauge Bar */}
      <div className={`p-4 rounded-xl border ${harmonyInfo.border} bg-[#161820]/90 mb-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider">
              Optical Chromatic Harmony Index
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9CA3AF] font-medium">{harmonyInfo.label}</span>
            <span className="font-mono text-sm font-bold text-[#F3F4F6]">
              {harmonyScore} / 100
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-[#070709] overflow-hidden p-0.5 border border-[#222530]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${harmonyScore}%`,
              background: 'linear-gradient(90deg, #10B981 0%, #D4AF37 100%)',
            }}
          />
        </div>

        <p className="text-[11px] text-[#9CA3AF] mt-2 leading-relaxed">
          Complementary optical spectrum: The curated <strong className="text-[#F3F4F6]">{apparelItem.colorName}</strong> ({apparelItem.colorHex}) absorbs excess 650nm light wave reflectance, neutralizing acute redness in flash photography.
        </p>
      </div>

      {/* Garment Details & Fabric Safety Specification */}
      <div className="p-4 rounded-xl border border-[#222530] bg-[#111319] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
              {apparelItem.category.replace('_', ' ')}
            </span>
            <span className="text-xs text-[#9CA3AF]">by {apparelItem.brand}</span>
          </div>

          <h4 className="font-sans text-base font-bold text-[#F3F4F6] truncate">
            {apparelItem.name}
          </h4>

          {/* Color & Fabric Composition Chips */}
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#161820] border border-[#222530]">
              <span
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: apparelItem.colorHex }}
              />
              <span className="text-[11px] font-mono text-[#D1D5DB]">{apparelItem.colorHex}</span>
            </div>

            {apparelItem.fabricComposition?.map((fabric, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2 py-0.5 bg-[#161820] text-[#9CA3AF] border border-[#222530] rounded-md flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                <span>{fabric}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-[#222530] pt-3 md:pt-0 md:pl-5">
          <div>
            <span className="text-[10px] text-[#9CA3AF] uppercase block">Retail Valuation</span>
            <span className="font-mono text-xl font-extrabold text-[#D4AF37]">
              ${apparelItem.priceUsd?.toLocaleString()}
            </span>
          </div>

          <a
            href={apparelItem.productUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundService.playMechanicalClick()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-[#34D399] text-[#070709] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-emerald-500/25"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order Piece</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApparelAndMakeupVTOCard;
