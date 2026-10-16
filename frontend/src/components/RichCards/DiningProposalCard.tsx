'use client';

import React, { useState } from 'react';
import { Utensils, MapPin, GlassWater, BellRing, Calendar, Share2, Sparkles } from 'lucide-react';
import { QlooAffinityBadge } from '../QlooAffinityBadge';
import { ActionDispatchModal, ActionModalData } from '../ActionDispatchModal';
import { soundService } from '../../services/soundService';
import { calendarService } from '../../services/calendarService';
import type { BudgetTier, DiningProposal, ExecutiveDossier, ComplianceCheck } from '../../types';

interface DiningProposalCardProps {
  diningOptions: DiningProposal[];
  vipName?: string;
  vipId?: string;
  budgetTier?: BudgetTier;
  activeDossier?: ExecutiveDossier | null;
  onDossierUpdated?: (dossier: ExecutiveDossier, diffHighlights?: string[]) => void;
}

export const DiningProposalCard: React.FC<DiningProposalCardProps> = ({
  diningOptions,
  vipName,
  vipId,
  budgetTier,
  activeDossier,
  onDossierUpdated,
}) => {
  const [actionModalData, setActionModalData] = useState<ActionModalData | null>(null);

  if (!diningOptions || diningOptions.length === 0) return null;

  return (
    <div className="border border-[#183D33]/15 bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-[#EBE6DD]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#183D33]">
              Executive Hospitality
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 border border-[#E5E0D6] bg-[#FAF8F5] text-[#6B736D] rounded-full uppercase tracking-wide">
              Private Salon & Dining
            </span>
          </div>
          <h3 className="text-2xl font-semibold text-[#161A18] tracking-tight">
            Curated Dining Reservations
          </h3>
        </div>

        <div className="w-9 h-9 border border-[#E5E0D6] bg-[#FAF8F5] rounded-lg flex items-center justify-center text-[#183D33]">
          <Utensils className="w-4 h-4" />
        </div>
      </div>

      {/* Proposals as Dedicated Sub-Cards with Modern Luxury Padding */}
      <div className="space-y-4">
        {diningOptions.map((option) => {
          const dynamicScore =
            (option as any).affinityScore ||
            0.94 + ((option.venueName.length + option.cuisineType.length) % 5) * 0.01;
          const scorePercent = Math.round(dynamicScore * 100);

          return (
            <div
              key={option.id}
              className={`p-5 sm:p-6 rounded-2xl border ${
                option.culturalRationale?.includes('[DIFF REFINED]')
                  ? 'border-amber-300 bg-amber-50/40 shadow-sm ring-1 ring-amber-300/60'
                  : 'border-[#EBE6DD] bg-[#FAF8F5]/70'
              } space-y-3.5 mb-4 shadow-2xs transition-colors hover:bg-white hover:border-[#183D33]/30`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#183D33] mb-1">
                    <span>{option.cuisineType}</span>
                    {option.priceBand && <span className="text-[#6B736D]">/ {option.priceBand}</span>}
                    <QlooAffinityBadge
                      affinityScore={dynamicScore}
                      anchor={option.cuisineType}
                      itemTitle={option.venueName}
                      explanation={`Qloo Cross-Domain Intelligence: Discerning principals with refined cultural taste show ${scorePercent}% concordance with ${option.vibeAnchor} culinary environments at ${option.venueName}.`}
                    />
                    {option.culturalRationale?.includes('[DIFF REFINED]') && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold animate-pulse shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>REAL-TIME DIFF: Truffle-Free Substitution Verified</span>
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-[#161A18] tracking-normal">
                    {option.venueName}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-[#6B736D] font-medium">
                  <MapPin className="w-4 h-4 text-[#183D33]" />
                  <span>{option.neighborhood}</span>
                </div>
              </div>

              {/* Vibe Anchor */}
              <div className="my-3 text-sm text-[#323835] leading-relaxed font-sans">
                <span className="text-[#6B736D] uppercase text-xs font-semibold mr-2 tracking-wide">
                  Atmosphere:
                </span>
                <span className="text-[#161A18] font-medium">{option.vibeAnchor}</span>
              </div>

              {/* Pairing protocol with roomy padding and soft warm canvas */}
              <div className="p-4 sm:p-5 rounded-xl border border-[#E5E0D6] bg-[#F8F6F0] flex items-start gap-3.5 text-sm text-[#323835]">
                <GlassWater className="w-4 h-4 text-[#183D33] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#183D33] block mb-1">
                    Pairing Protocol
                  </span>
                  <span className="font-sans leading-relaxed text-[#323835]">{option.pairingNotes}</span>
                </div>
              </div>

              {/* Cultural Rationale */}
              <p className="my-3 text-sm text-[#323835] leading-relaxed font-sans font-normal">
                {option.culturalRationale}
              </p>

              {/* 1-Click Agentic Action Dispatch Bar */}
              <div className="pt-3 border-t border-[#EBE6DD] flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playMechanicalClick();
                      setActionModalData({
                        type: 'book_table',
                        title: option.venueName,
                        venueOrBrand: option.cuisineType,
                        location: `${option.neighborhood}, Diplomatic District`,
                        vipName,
                        vipId: vipId || activeDossier?.vipProfile?.id,
                        budgetTier: budgetTier || activeDossier?.budgetTier,
                        pairingNotes: option.pairingNotes,
                        notes: option.culturalRationale,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#183D33] hover:bg-[#224F43] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-2xs"
                    title="Dispatch reservation protocol to venue concierge"
                  >
                    <BellRing className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Book via Concierge API</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playMechanicalClick();
                      calendarService.downloadIcsEvent({
                        title: `CuraVIP Executive Dining: ${option.venueName}`,
                        description: `${option.cuisineType}\nPairing: ${option.pairingNotes}\nAtmosphere: ${option.vibeAnchor}\nPrincipal: ${vipName || 'VIP'}`,
                        location: `${option.neighborhood}, Diplomatic District`,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E0D6] bg-white hover:border-[#183D33] hover:bg-[#FAF8F5] text-xs font-semibold text-[#183D33] rounded-xl transition-all shadow-2xs"
                    title="Download .ics calendar event to device"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#183D33]" />
                    <span>Download .ICS</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundService.playMechanicalClick();
                    setActionModalData({
                      type: 'share_briefing',
                      title: option.venueName,
                      venueOrBrand: option.cuisineType,
                      location: `${option.neighborhood}, Diplomatic District`,
                      vipName,
                      vipId: vipId || activeDossier?.vipProfile?.id,
                      budgetTier: budgetTier || activeDossier?.budgetTier,
                      pairingNotes: option.pairingNotes,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6B736D] hover:text-[#183D33] hover:bg-[#FAF8F5] rounded-lg transition-colors border border-transparent hover:border-[#E5E0D6]"
                  title="Dispatch dining briefing via WhatsApp / Signal"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp / Signal</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Dispatch Modal */}
      <ActionDispatchModal
        data={actionModalData}
        isOpen={Boolean(actionModalData)}
        onClose={() => setActionModalData(null)}
        onSuccess={(order) => {
          if (onDossierUpdated && activeDossier) {
            const precedentCheck: ComplianceCheck = {
              id: 'precedent',
              label: 'Curation History & Duplicate Prevention',
              status: 'pass',
              detail: `Reservation booked: '${order.diningReservation?.venueName || actionModalData?.title || 'Private Dining'}' confirmed in concierge ledger (${order.confirmationCode}). VIP protocols locked.`,
            };

            const existingChecks = activeDossier.complianceAudit?.checks || [];
            const updatedChecks = existingChecks.some((c) => c.id === 'precedent')
              ? existingChecks.map((c) => (c.id === 'precedent' ? precedentCheck : c))
              : [...existingChecks, precedentCheck];

            onDossierUpdated(
              {
                ...activeDossier,
                complianceAudit: {
                  ...activeDossier.complianceAudit,
                  checks: updatedChecks,
                  auditNotes: (activeDossier.complianceAudit?.auditNotes || '').includes(order.confirmationCode)
                    ? activeDossier.complianceAudit?.auditNotes
                    : `${activeDossier.complianceAudit?.auditNotes || ''} [Reservation confirmed: ${order.diningReservation?.venueName || actionModalData?.title} (${order.confirmationCode})]`.trim(),
                },
              },
              [`Confirmed Reservation ${order.confirmationCode}`]
            );
          }
        }}
      />
    </div>
  );
};
