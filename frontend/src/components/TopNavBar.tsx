'use client';

import React, { useState } from 'react';
import { Sparkles, SplitSquareVertical, Download, Zap, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { soundService } from '../services/soundService';
import { AuraCuraLogo } from './AuraCuraLogo';
import type { AuraCuraExecutionMode, AuraCuraDossier } from '../types';

interface TopNavBarProps {
  executionMode: AuraCuraExecutionMode;
  onToggleMode: (mode: AuraCuraExecutionMode) => void;
  onOpenSideBySide: () => void;
  onExportPdf?: () => void;
  activeDossier: AuraCuraDossier | null;
  youcamLiveStatus?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  executionMode,
  onToggleMode,
  onOpenSideBySide,
  onExportPdf,
  activeDossier,
  youcamLiveStatus = true,
}) => {
  const isGrounded = executionMode === 'auracura_grounded';
  const [isMuted, setIsMuted] = useState(soundService.isMuted());

  return (
    <header className="w-full bg-[#070709] border-b border-[#222530] px-6 py-4 sticky top-0 z-30 backdrop-blur-md">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Crest & Subtitle */}
        <div className="flex items-center gap-4 flex-wrap">
          <AuraCuraLogo size="md" />
          <div className="hidden lg:block h-8 w-px bg-[#222530]" />
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              01 / Aesthetic Director
            </span>
            <span className="text-[#374151] text-xs">·</span>
            <span className="text-xs font-medium text-[#10B981] uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span>Bio-Harmonic Engine Active</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-mono font-semibold tracking-wide">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>Official Perfect Corp YouCam API Hackathon 2026 Entry</span>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Grounding Engine Segmented Toggle */}
          <div className="flex items-center p-1 rounded-xl border border-[#222530] bg-[#0D0E12]">
            <button
              onClick={() => {
                soundService.playToggleClick();
                onToggleMode('auracura_grounded');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wide transition-all rounded-lg ${
                isGrounded
                  ? 'bg-[#10B981] text-[#070709] font-bold shadow-md shadow-emerald-500/20'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6] font-medium'
              }`}
              title="Ground curation in YouCam skin metrics & dermatological guardrails"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AuraCura Grounded</span>
            </button>

            <button
              onClick={() => {
                soundService.playToggleClick();
                onToggleMode('generic_llm');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wide transition-all rounded-lg ${
                !isGrounded
                  ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6] font-medium'
              }`}
              title="Switch to ungrounded generic baseline LLM"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Generic Blind LLM</span>
            </button>
          </div>

          {/* Benchmark Side-by-Side Button */}
          <button
            onClick={() => {
              soundService.playMechanicalClick();
              onOpenSideBySide();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide border border-[#222530] bg-[#111319] text-[#F3F4F6] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all rounded-xl shadow-sm"
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Benchmark</span>
          </button>

          {/* Export PDF Summary */}
          {activeDossier && (
            <button
              onClick={() => {
                soundService.playMechanicalClick();
                onExportPdf?.();
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide bg-[#10B981] text-[#070709] hover:bg-[#34D399] transition-all rounded-xl shadow-md font-bold"
              title="Export Clinical Lookbook Summary"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>
          )}

          {/* Audio Feedback Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              const muted = soundService.toggleMute();
              setIsMuted(muted);
            }}
            className={`p-2 border rounded-xl transition-all shadow-sm ${
              !isMuted
                ? 'border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981]'
                : 'border-[#222530] bg-[#111319] text-[#6B7280] hover:text-[#F3F4F6]'
            }`}
            title={isMuted ? 'Muted: Click to enable audio feedback' : 'Unmuted: Click to mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
