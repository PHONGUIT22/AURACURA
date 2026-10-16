'use client';

import React, { useState } from 'react';
import { Pill, Sun, Moon, ShieldCheck, AlertCircle, Sparkles, DollarSign, CheckCircle2 } from 'lucide-react';
import { soundService } from '../../services/soundService';
import type { SkincareStep } from '../../types';

interface ClinicalPrescriptionCardProps {
  skincareRegimen: SkincareStep[];
  shoppingCartSummary?: {
    totalCostUsd?: number;
    remainingBudgetUsd?: number;
  };
}

export const ClinicalPrescriptionCard: React.FC<ClinicalPrescriptionCardProps> = ({
  skincareRegimen,
  shoppingCartSummary,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'morning' | 'evening'>('all');

  const filteredSteps = skincareRegimen.filter((step) => {
    if (activeTab === 'all') return true;
    return step.phase === activeTab;
  });

  const morningCost = skincareRegimen
    .filter((s) => s.phase === 'morning')
    .reduce((sum, s) => sum + s.priceUsd, 0);

  const eveningCost = skincareRegimen
    .filter((s) => s.phase === 'evening')
    .reduce((sum, s) => sum + s.priceUsd, 0);

  const totalCost = shoppingCartSummary?.totalCostUsd ?? morningCost + eveningCost;

  const getComedogenicBadge = (rating: number) => {
    if (rating <= 1) {
      return {
        label: `Rating ${rating} · Non-Comedogenic`,
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
      };
    }
    if (rating === 2) {
      return {
        label: `Rating ${rating} · Low Clog Risk`,
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
      };
    }
    return {
      label: `Rating ${rating} · High Pore Clog Warning`,
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
    };
  };

  const getStepTypeBadge = (type: string) => {
    switch (type) {
      case 'cleanse':
        return { label: 'Gentle Cleanse', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'treat':
        return { label: 'Targeted Treatment', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'barrier_repair':
        return { label: 'Lipid Barrier Repair', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'protect':
        return { label: 'UV/Cellular Protect', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      default:
        return { label: type, color: 'text-gray-400 bg-gray-500/10 border-gray-500/30' };
    }
  };

  return (
    <div className="border border-[#222530] bg-[#0D0E12] rounded-2xl p-6 shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#222530]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center">
            <Pill className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h3 className="font-sans text-base font-bold text-[#F3F4F6] tracking-tight">
              Clinical Diurnal Skincare Prescription
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Physiological Stratum Corneum Restoration · 24-Hour Circadian Protocol
            </p>
          </div>
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#161820] border border-[#222530] rounded-xl">
          <button
            type="button"
            onClick={() => {
              soundService.playToggleClick();
              setActiveTab('all');
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-[#10B981] text-[#070709] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            24h Full Routine ({skincareRegimen.length})
          </button>
          <button
            type="button"
            onClick={() => {
              soundService.playToggleClick();
              setActiveTab('morning');
            }}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'morning'
                ? 'bg-[#D4AF37] text-[#070709] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span>Morning</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundService.playToggleClick();
              setActiveTab('evening');
            }}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'evening'
                ? 'bg-[#10B981] text-[#070709] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            <Moon className="w-3 h-3" />
            <span>Evening</span>
          </button>
        </div>
      </div>

      {/* Routine Steps Sequential Timeline */}
      <div className="my-6 space-y-4">
        {filteredSteps.map((step, idx) => {
          const comedoBadge = getComedogenicBadge(step.comedogenicRating);
          const stepTypeBadge = getStepTypeBadge(step.stepType);
          const isMorning = step.phase === 'morning';

          return (
            <div
              key={`${step.phase}-${step.stepNumber}-${idx}`}
              className="p-4 rounded-xl border border-[#222530] bg-[#111319] hover:border-[#10B981]/40 transition-all duration-200 relative group"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                {/* Left: Step indicator, Name, Brand & Actives */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Step Sequence Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isMorning
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#D4AF37]'
                        : 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
                    }`}
                  >
                    {isMorning ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#9CA3AF]">
                        Step {step.stepNumber} · {isMorning ? 'AM' : 'PM'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${stepTypeBadge.color}`}>
                        {stepTypeBadge.label}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${comedoBadge.bg} ${comedoBadge.text} ${comedoBadge.border}`}>
                        {comedoBadge.label}
                      </span>
                    </div>

                    <h4 className="font-sans text-sm md:text-base font-bold text-[#F3F4F6] truncate">
                      {step.productName}
                    </h4>
                    <p className="text-xs text-[#9CA3AF] mb-2">{step.brand}</p>

                    {/* Active Ingredients Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap my-2">
                      <span className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Key Actives:</span>
                      {step.keyActives?.map((active, aIdx) => (
                        <span
                          key={aIdx}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161820] text-[#D1D5DB] border border-[#222530]"
                        >
                          {active}
                        </span>
                      ))}
                    </div>

                    {/* Clinical Rationale */}
                    <p className="text-xs text-[#9CA3AF] leading-relaxed italic bg-[#070709]/60 p-2.5 rounded-lg border border-[#222530]/50 mt-2">
                      &ldquo;{step.clinicalRationale}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Right: Price */}
                <div className="shrink-0 md:text-right border-t md:border-t-0 md:border-l border-[#222530] pt-2 md:pt-0 md:pl-4">
                  <span className="text-[10px] text-[#9CA3AF] uppercase block">Price</span>
                  <span className="font-mono text-base font-bold text-[#D4AF37]">
                    ${step.priceUsd}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Routine Financial Summary Footer */}
      <div className="p-4 rounded-xl border border-[#222530] bg-[#161820] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[#9CA3AF] block text-[10px] uppercase">Morning AM Regimen</span>
            <span className="font-mono font-bold text-[#F3F4F6]">${morningCost}</span>
          </div>
          <div className="h-6 w-px bg-[#222530]" />
          <div>
            <span className="text-[#9CA3AF] block text-[10px] uppercase">Evening PM Regimen</span>
            <span className="font-mono font-bold text-[#F3F4F6]">${eveningCost}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-[#9CA3AF] uppercase block">Complete 24h Regimen</span>
            <span className="font-mono text-lg font-extrabold text-[#10B981]">
              ${totalCost}
            </span>
          </div>
          <button
            type="button"
            onClick={() => soundService.playMechanicalClick()}
            className="px-4 py-2 bg-[#10B981]/15 hover:bg-[#10B981] text-[#10B981] hover:text-[#070709] border border-[#10B981]/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            Add All to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicalPrescriptionCard;
