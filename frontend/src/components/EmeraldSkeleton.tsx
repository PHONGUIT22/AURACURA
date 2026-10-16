'use client';

import React from 'react';
import { Activity, Sparkles } from 'lucide-react';

export const EmeraldSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Reasoning Indicator */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-[#222530] bg-[#0D0E12]/90 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
            <Activity className="w-4 h-4 animate-spin text-[#10B981]" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6] flex items-center gap-2">
              <span>Synthesizing Bio-Harmonic VTO & Diurnal Regimen</span>
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
            </h4>
            <p className="text-xs text-[#9CA3AF]">
              Conducting 14-marker YouCam vision scan, calculating 650nm erythema absorption, and screening active clashes...
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#10B981] bg-[#161820] px-3 py-1.5 rounded-full border border-[#222530]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
          <span>RE-ACT_CLINICAL_ORCHESTRATION</span>
        </div>
      </div>

      {/* Shimmer Card 1: Diagnostics */}
      <div className="border border-[#222530] rounded-2xl p-6 bg-[#0D0E12] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222530]">
          <div className="h-5 w-48 rounded-lg bg-gradient-to-r from-[#161820] via-[#222530] to-[#161820] bg-[length:200%_100%] animate-pulse" />
          <div className="h-6 w-24 rounded-full bg-gradient-to-r from-[#161820] via-[#222530] to-[#161820] bg-[length:200%_100%] animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-[#111319] border border-[#222530] animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Shimmer Card 2: VTO Simulation */}
      <div className="border border-[#222530] rounded-2xl p-6 bg-[#0D0E12] space-y-4">
        <div className="h-64 rounded-xl bg-[#111319] border border-[#222530] animate-pulse" />
      </div>
    </div>
  );
};

export default EmeraldSkeleton;
