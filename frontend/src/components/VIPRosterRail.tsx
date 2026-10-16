'use client';

import React from 'react';
import { User, MapPin, Plus } from 'lucide-react';
import type { VIPProfile } from '../types';

interface VIPRosterRailProps {
  profiles: VIPProfile[];
  selectedVipId: string | null;
  onSelectVip: (profile: VIPProfile) => void;
  onOpenCreateVip?: () => void;
}

export const VIPRosterRail: React.FC<VIPRosterRailProps> = ({
  profiles,
  selectedVipId,
  onSelectVip,
  onOpenCreateVip,
}) => {
  return (
    <aside className="w-full lg:w-80 flex-shrink-0">
      <div className="border border-[#E5E0D6]/80 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#EBE6DD] bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#183D33]" />
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#161A18]">
              Principal Roster
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpenCreateVip}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-[#183D33] text-white hover:bg-[#224F43] rounded-lg transition-colors shadow-2xs"
            title="Create custom VIP profile"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Principal</span>
          </button>
        </div>

        {/* Directory List with 1px Hairline Dividers */}
        <div className="divide-y divide-[#EBE6DD]">
          {profiles.map((vip) => {
            const isSelected = vip.id === selectedVipId;
            const hasTaboos = vip.taboos.alcohol || (vip.taboos.dietary && vip.taboos.dietary.length > 0);

            return (
              <button
                key={vip.id}
                type="button"
                onClick={() => onSelectVip(vip)}
                className={`w-full text-left transition-all p-5 ${
                  isSelected
                    ? 'bg-[#F4F1EA] border-l-4 border-l-[#183D33] pl-6'
                    : 'bg-white hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-sans text-base font-semibold text-[#161A18] tracking-tight">
                    {vip.fullName}
                  </h4>
                  <span className="font-sans font-semibold text-base text-[#183D33] tabular-nums">
                    ${vip.budgetLimitUsd}
                  </span>
                </div>

                <p className="text-sm text-[#6B736D] font-sans mb-2.5 leading-snug">
                  {vip.role} · {vip.organization}
                </p>

                <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#6B736D] mb-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8C938E]" />
                    <span>{vip.city}</span>
                  </div>

                  {hasTaboos && (
                    <span className="bg-[#183D33]/5 text-[#183D33] border border-[#183D33]/20 text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full tracking-wide">
                      Taboo Guard
                    </span>
                  )}
                </div>

                {/* Explicit Interests Ledger Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {vip.explicitInterests.slice(0, 3).map((interest, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium uppercase px-2 py-1 border border-[#E5E0D6] bg-[#FAF8F5] text-[#323835] rounded-md"
                    >
                      {interest}
                    </span>
                  ))}
                  {vip.explicitInterests.length > 3 && (
                    <span className="text-xs font-medium px-1.5 py-1 text-[#6B736D]">
                      +{vip.explicitInterests.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
