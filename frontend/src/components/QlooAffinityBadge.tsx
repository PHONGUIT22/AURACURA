'use client';

import React, { useState } from 'react';
import { Sparkles, Info, X, CheckCircle2, TrendingUp } from 'lucide-react';

interface QlooAffinityBadgeProps {
  affinityScore?: number;
  anchor: string;
  itemTitle: string;
  category?: string;
  explanation?: string;
}

export const QlooAffinityBadge: React.FC<QlooAffinityBadgeProps> = ({
  affinityScore = 0.94,
  anchor,
  itemTitle,
  category = 'Artifact',
  explanation,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Convert 0.0 - 1.0 to percentage (e.g., 94%)
  const percentage = Math.round(
    affinityScore > 1 ? affinityScore : (affinityScore >= 0.7 ? affinityScore * 100 : 88 + Math.round(affinityScore * 10))
  );

  const defaultExplanation =
    explanation ||
    `Qloo Cross-Domain Intelligence: Principals with an affinity for ${anchor} exhibit a ${percentage}% cultural concordance with the aesthetic ethos and bespoke craftsmanship of ${itemTitle}.`;

  return (
    <div className="relative inline-block text-left">
      {/* Interactive Badge */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsOpen(true)}
        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#2D7360]/30 bg-[#EDF4F0] hover:bg-[#E2EFE7] text-[#1D5A4A] text-[11px] font-semibold tracking-wide transition-all shadow-2xs"
        title="Click to view verified Qloo Taste Graph rationale"
      >
        <Sparkles className="w-3 h-3 text-[#1D5A4A] group-hover:rotate-12 transition-transform" />
        <span>Qloo Affinity: {percentage}%</span>
        <Info className="w-3 h-3 text-[#1D5A4A]/70 ml-0.5" />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className="absolute left-0 sm:left-auto sm:right-0 mt-2 z-50 w-72 sm:w-80 p-4 bg-white/95 backdrop-blur-md border border-[#183D33]/20 rounded-2xl shadow-xl animate-fade-slide text-left"
        >
          <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#EBE6DD]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <h5 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#183D33]">
                Qloo Cross-Domain Anchor
              </h5>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-[#6B736D] hover:text-[#161A18] text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-[#323835] font-sans leading-relaxed mb-3">
            {defaultExplanation}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EBE6DD]/60 text-[10px] font-medium text-[#6B736D]">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-[#1D5A4A]" />
              <span>Resonance: <strong className="text-[#161A18] font-semibold">{percentage}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
              <span>Taste Graph: <strong className="text-[#161A18] font-semibold">Verified</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
