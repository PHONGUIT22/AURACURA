'use client';

import React from 'react';
import { Menu, SlidersHorizontal, Users, FileText, SplitSquareVertical, Sparkles } from 'lucide-react';
import { soundService } from '../services/soundService';

interface AppSidebarProps {
  onOpenBenchmark?: () => void;
  onNavigateConsole?: () => void;
  onNavigateRoster?: () => void;
  onNavigateDossier?: () => void;
  activeSection?: 'console' | 'roster' | 'dossier' | 'benchmark';
  youcamLiveStatus?: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  onOpenBenchmark,
  onNavigateConsole,
  onNavigateRoster,
  onNavigateDossier,
  activeSection = 'console',
  youcamLiveStatus = true,
}) => {
  return (
    <aside className="w-16 md:w-18 flex-shrink-0 bg-[#070709] border-r border-[#222530] flex flex-col items-center justify-between py-5 z-40 select-none">
      {/* Top Navigation */}
      <div className="flex flex-col items-center gap-6 w-full">
        <button
          type="button"
          onClick={() => {
            soundService.playToggleClick();
            onNavigateConsole?.();
          }}
          className="w-10 h-10 flex items-center justify-center text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
          title="AuraCura Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Navigation Icons */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {/* Aesthetic Console */}
          <button
            type="button"
            onClick={() => {
              soundService.playToggleClick();
              onNavigateConsole?.();
            }}
            className={`w-10 h-10 flex items-center justify-center transition-all rounded-xl ${
              activeSection === 'console'
                ? 'bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#161820]'
            }`}
            title="Aesthetic Console"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Client Roster */}
          <button
            type="button"
            onClick={() => {
              soundService.playToggleClick();
              onNavigateRoster?.();
            }}
            className={`w-10 h-10 flex items-center justify-center transition-all rounded-xl ${
              activeSection === 'roster'
                ? 'bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#161820]'
            }`}
            title="Client Roster"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Clinical Dossier */}
          <button
            type="button"
            onClick={() => {
              soundService.playToggleClick();
              onNavigateDossier?.();
            }}
            className={`w-10 h-10 flex items-center justify-center transition-all rounded-xl ${
              activeSection === 'dossier'
                ? 'bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#161820]'
            }`}
            title="Clinical Dossier"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Benchmark Trigger */}
          <button
            type="button"
            onClick={() => {
              soundService.playMechanicalClick();
              onOpenBenchmark?.();
            }}
            className={`w-10 h-10 flex items-center justify-center transition-all rounded-xl ${
              activeSection === 'benchmark'
                ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#D4AF37] hover:bg-[#161820]'
            }`}
            title="Side-by-Side Benchmark"
          >
            <SplitSquareVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Monogram & Status */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-[#0D0E12] border border-[#222530] flex items-center justify-center text-[#D4AF37] font-bold text-xs tracking-wider shadow-sm">
          AC
        </div>
        <div
          className="flex flex-col items-center cursor-pointer group"
          title="YouCam Skin Diagnostics: 14 Bio-Markers · Fallback Vault Active"
        >
          <div className="relative w-2 h-2 mb-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
          </div>
          <span className="text-[9px] font-mono tracking-wider text-[#10B981] font-semibold">
            VTO 4K
          </span>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
