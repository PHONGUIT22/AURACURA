'use client';

import React from 'react';
import { Sparkles, DollarSign, Calendar, ShieldAlert, Plus, CheckCircle2 } from 'lucide-react';
import { soundService } from '../services/soundService';
import type { ConsumerBeautyProfile } from '../types';

interface ConsumerRosterRailProps {
  profiles: ConsumerBeautyProfile[];
  selectedProfileId: string | null;
  onSelectProfile: (profile: ConsumerBeautyProfile) => void;
  onOpenCreateProfile?: () => void;
}

export const ConsumerRosterRail: React.FC<ConsumerRosterRailProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onOpenCreateProfile,
}) => {
  const handleSelect = (profile: ConsumerBeautyProfile) => {
    soundService.playMechanicalClick();
    onSelectProfile(profile);
  };

  const handleCreateClick = () => {
    soundService.playToggleClick();
    onOpenCreateProfile?.();
  };

  return (
    <aside className="w-full lg:w-80 flex-shrink-0">
      <div className="border border-[#222530] bg-[#0D0E12]/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all">
        {/* Section Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#222530] bg-[#161820]/90">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10B981]" />
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#F3F4F6]">
              Client & Patient Roster
            </h3>
          </div>
          {onOpenCreateProfile && (
            <button
              type="button"
              onClick={handleCreateClick}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981] hover:text-[#070709] border border-[#10B981]/30 rounded-lg transition-all shadow-sm"
              title="Add custom client profile"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Client</span>
            </button>
          )}
        </div>

        {/* Directory List with Dark Luxury Obsidian & Emerald Styling */}
        <div className="divide-y divide-[#222530]/60 overflow-y-auto max-h-[750px]">
          {profiles.map((profile) => {
            const isSelected = profile.id === selectedProfileId;
            const hasAllergies = profile.knownAllergies && profile.knownAllergies.length > 0;

            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleSelect(profile)}
                className={`w-full text-left transition-all p-4 relative group ${
                  isSelected
                    ? 'bg-[#161820] border-l-4 border-l-[#10B981] pl-5'
                    : 'bg-[#0D0E12] hover:bg-[#161820]/60'
                }`}
              >
                {/* Header: Avatar, Name, Age & Budget */}
                <div className="flex items-start gap-3 mb-2">
                  <div className="relative shrink-0">
                    <img
                      src={profile.userSelfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                      alt={profile.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-[#222530] group-hover:border-[#10B981]/50 transition-colors"
                    />
                    {isSelected && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#10B981] rounded-full flex items-center justify-center ring-2 ring-[#0D0E12]">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#070709]" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-sans text-sm font-semibold text-[#F3F4F6] truncate tracking-tight">
                        {profile.fullName}
                      </h4>
                      <span className="font-mono text-xs font-semibold text-[#D4AF37] tabular-nums shrink-0">
                        ${profile.budgetLimitUsd?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF] mt-0.5">
                      <span>{profile.age} years old</span>
                      <span className="text-[#374151]">·</span>
                      <span className="truncate text-[#D4AF37]/90">{profile.preferredStyle}</span>
                    </div>
                  </div>
                </div>

                {/* Event Context */}
                <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mb-2.5 bg-[#070709]/60 px-2.5 py-1.5 rounded-lg border border-[#222530]/50">
                  <Calendar className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span className="truncate text-[11px]">{profile.eventContext}</span>
                </div>

                {/* Allergies / Contraindications Pills */}
                {hasAllergies && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <ShieldAlert className="w-3 h-3 text-[#F87171] shrink-0" />
                    {profile.knownAllergies.slice(0, 2).map((allergy, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 bg-[#F87171]/10 text-[#FCA5A5] border border-[#F87171]/20 rounded-md"
                      >
                        {allergy}
                      </span>
                    ))}
                    {profile.knownAllergies.length > 2 && (
                      <span className="text-[10px] font-medium text-[#9CA3AF]">
                        +{profile.knownAllergies.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default ConsumerRosterRail;
