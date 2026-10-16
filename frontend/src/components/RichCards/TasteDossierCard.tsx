'use client';

import React, { useState } from 'react';
import { Compass, MessageSquareQuote, Layers, Share2, Sparkles, Activity } from 'lucide-react';
import { soundService } from '../../services/soundService';
import { VisualTasteGraph } from '../VisualTasteGraph';
import { InteractiveTasteNetworkGraph } from '../InteractiveTasteNetworkGraph';
import { QlooVectorXRayPanel } from '../QlooVectorXRayPanel';
import type { CulturalTasteGraph, VIPProfile } from '../../types';

interface TasteDossierCardProps {
  tasteGraph: CulturalTasteGraph;
  vipProfile: VIPProfile;
  iceBreakerScripts: string[];
}

const getCategoryLabel = (category: string): string => {
  const cat = category.toLowerCase();
  if (cat.includes('musi') || cat.includes('artist')) return 'Music';
  if (cat.includes('dini') || cat.includes('place') || cat.includes('culin')) return 'Dining';
  if (cat.includes('lite') || cat.includes('book')) return 'Literature';
  if (cat.includes('fash') || cat.includes('brand')) return 'Fashion';
  if (cat.includes('arch')) return 'Architecture';
  if (cat.includes('film') || cat.includes('cinema') || cat.includes('movie')) return 'Cinema';
  return category.charAt(0).toUpperCase() + category.slice(1);
};

export const TasteDossierCard: React.FC<TasteDossierCardProps> = ({
  tasteGraph,
  vipProfile,
  iceBreakerScripts,
}) => {
  const [viewMode, setViewMode] = useState<'network' | 'graph' | 'list'>('network');
  const [isXRayOpen, setIsXRayOpen] = useState(false);
  const isGrounded = tasteGraph.source !== 'none';
  const entities = tasteGraph.expandedEntities || [];

  // Determine the 3 structured ledger points dynamically from taste graph and VIP profile
  const getLedgerPoints = () => {
    const themes = tasteGraph.crossDomainThemes || [];
    const entityList = tasteGraph.expandedEntities || [];

    // Find specific category entities
    const archEntity = entityList.find((e) =>
      ['architecture', 'design', 'art'].some((c) => e.category?.toLowerCase().includes(c))
    );
    const musicEntity = entityList.find((e) =>
      ['music', 'artist', 'audio', 'sonic'].some((c) => e.category?.toLowerCase().includes(c))
    );
    const tactileEntity = entityList.find((e) =>
      ['fashion', 'brand', 'craft', 'culinary', 'dining', 'place'].some((c) =>
        e.category?.toLowerCase().includes(c)
      )
    );

    const interests = vipProfile.explicitInterests || tasteGraph.seedInterests || [];

    // Primary Aesthetic
    const primaryAesthetic =
      themes[0] ||
      (archEntity
        ? `${archEntity.name} & Spatial Proportion`
        : interests[0]
        ? `${interests[0]} & Architectural Form`
        : 'Curatorial Precision & Monolithic Scale');

    // Sonic Palette
    const sonicPalette =
      themes[1] ||
      (musicEntity
        ? `${musicEntity.name} Resonance & Acoustic Cadence`
        : interests.find((p) => /jazz|sound|music|opera|ambient/i.test(p))
        ? `${interests.find((p) => /jazz|sound|music|opera|ambient/i.test(p))} & Analog Resonance`
        : 'Micro-Mechanical Frequencies & Modal Cadence');

    // Tactile Resonance
    const tactileResonance =
      themes[2] ||
      (tactileEntity
        ? `${tactileEntity.name} Materiality & Hand-Finished Textures`
        : interests[1]
        ? `Raw ${interests[1]} Finishes & Artisanal Fiber`
        : 'Artisanal Stoneware, Raw Fiber & Engineered Metals');

    return [
      { label: 'Primary Aesthetic', value: primaryAesthetic },
      { label: 'Sonic Palette', value: sonicPalette },
      { label: 'Tactile Resonance', value: tactileResonance },
    ];
  };

  const ledgerPoints = getLedgerPoints();

  return (
    <div className="border border-[#183D33]/15 bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
      {/* Ledger Section Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-4 mb-4 border-b border-[#EBE6DD]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#183D33] whitespace-nowrap">
              Archival Taste Graph
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 border rounded-full uppercase tracking-wide whitespace-nowrap ${
                isGrounded
                  ? 'border-[#C8DCD1] bg-[#EDF4F0] text-[#1D5A4A]'
                  : 'border-[#E5E0D6] bg-[#FAF8F5] text-[#6B736D]'
              }`}
            >
              {isGrounded ? 'Qloo Grounded' : 'Ungrounded Baseline'}
            </span>
          </div>
          <h3 className="font-sans font-semibold text-lg sm:text-xl text-[#161A18] tracking-tight">
            {vipProfile.fullName}{' '}
            <span className="font-sans text-xs sm:text-sm text-[#6B736D] font-normal">
              / Cultural Affinity Ledger
            </span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Qloo Vector X-Ray Inspector Toggle Button (Dedicated for CTO Mike Diolosa) */}
          <button
            type="button"
            onClick={() => {
              soundService.playMechanicalClick();
              setIsXRayOpen(!isXRayOpen);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold tracking-wide transition-all shadow-2xs whitespace-nowrap flex-shrink-0 ${
              isXRayOpen
                ? 'bg-[#183D33] text-[#D4AF37] border-[#D4AF37]/50 ring-1 ring-[#D4AF37]/30'
                : 'bg-[#FAF8F5] border-[#D5CEBF] text-[#183D33] hover:border-[#183D33] hover:bg-white'
            }`}
            title="Inspect Qloo Latent Vector Transformation & URN Entity Routing"
          >
            <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>⚡ Qloo Vector X-Ray</span>
          </button>

          {/* View Mode Toggle: [ Interactive Network ] ⇄ [ Visual Graph ] ⇄ [ Ledger Matrix ] */}
          <div className="flex items-center p-1 rounded-xl border border-[#E5E0D6] bg-[#FAF8F5] flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                soundService.playToggleClick();
                setViewMode('network');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                viewMode === 'network'
                  ? 'bg-[#183D33] text-white shadow-2xs'
                  : 'text-[#6B736D] hover:text-[#161A18]'
              }`}
              title="Interactive Taste Network Graph"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Interactive Network</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playToggleClick();
                setViewMode('graph');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                viewMode === 'graph'
                  ? 'bg-[#183D33] text-white shadow-2xs'
                  : 'text-[#6B736D] hover:text-[#161A18]'
              }`}
              title="Visual Taste Graph"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visual Graph</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playToggleClick();
                setViewMode('list');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                viewMode === 'list'
                  ? 'bg-[#183D33] text-white shadow-2xs'
                  : 'text-[#6B736D] hover:text-[#161A18]'
              }`}
              title="Ledger Cards (List View)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ledger Matrix</span>
            </button>
          </div>

          <div className="w-9 h-9 border border-[#E5E0D6] bg-[#FAF8F5] rounded-xl flex items-center justify-center text-[#183D33] flex-shrink-0">
            <Compass className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Qloo Vector X-Ray Expandable Inspector (Dedicated for CTO Mike Diolosa) */}
      {isXRayOpen && (
        <QlooVectorXRayPanel tasteGraph={tasteGraph} vipProfile={vipProfile} />
      )}

      {/* Dynamic View Body: Interactive Network vs Visual Taste Graph vs Matrix/List */}
      {viewMode === 'network' ? (
        <div className="mb-6">
          <InteractiveTasteNetworkGraph tasteGraph={tasteGraph} vipProfile={vipProfile} />
        </div>
      ) : viewMode === 'graph' ? (
        <div className="mb-6">
          <VisualTasteGraph tasteGraph={tasteGraph} vipProfile={vipProfile} />
        </div>
      ) : (
        <>
          {/* 3 Crisp Ledger Points (Anti-Slop: Structured Ledger Points) */}
          <div className="border border-[#E5E0D6] bg-[#FAF8F5] p-5 mb-6 rounded-xl shadow-2xs">
            <div className="flex items-center gap-2 mb-2.5 text-[#183D33] text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#183D33]" />
              <span>Synthesized Cross-Domain Theme</span>
            </div>
            <div className="space-y-2 font-sans text-sm">
              {ledgerPoints.map((pt, idx) => (
                <div key={idx} className="flex items-baseline gap-2.5 text-[#161A18]">
                  <span className="text-[#183D33] font-bold">•</span>
                  <span className="font-semibold text-[#6B736D]">{pt.label}:</span>
                  <span className="text-[#161A18] font-normal">{pt.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cultural Entity Nodes Grid */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase text-[#6B736D] tracking-wider">
              <Layers className="w-4 h-4 text-[#183D33]" />
              <span>Correlated Taste Nodes</span>
            </div>

            {entities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {entities.map((entity) => (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between p-3.5 border border-[#E5E0D6] bg-[#FAF8F5] hover:bg-white hover:border-[#183D33]/40 rounded-xl transition-all shadow-2xs"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-sans text-xs text-[#183D33] font-semibold tracking-wide block mb-0.5">
                        {getCategoryLabel(entity.category)}
                      </span>
                      <span className="font-sans text-xs font-semibold text-[#161A18] line-clamp-2 leading-relaxed block">
                        {entity.name}
                      </span>
                    </div>
                    <span className="font-sans tabular-nums text-sm font-semibold text-[#183D33] flex-shrink-0">
                      {Math.round(entity.affinityScore * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-[#E5E0D6] bg-[#FAF8F5] rounded-xl text-center text-sm font-medium text-[#6B736D]">
                No correlated nodes surfaced in ungrounded baseline mode.
              </div>
            )}
          </div>
        </>
      )}

      {/* Strategic Conversational Openings (Diplomatic Ice-Breakers) */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase text-[#183D33] tracking-wider">
          <MessageSquareQuote className="w-4 h-4" />
          <span>Strategic Conversational Openings</span>
        </div>

        <div className="divide-y divide-[#EBE6DD] border border-[#E5E0D6] bg-[#FAF8F5] rounded-xl overflow-hidden shadow-2xs">
          {iceBreakerScripts.map((script, idx) => (
            <div key={idx} className="p-4 text-sm leading-relaxed">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="font-sans text-xs text-[#183D33] font-semibold">
                  [{String(idx + 1).padStart(2, '0')}]
                </span>
                <span className="font-sans text-xs text-[#6B736D] uppercase tracking-wider font-semibold">
                  Executive Opening Script
                </span>
              </div>
              <p className="font-sans text-sm text-[#323835] pl-6 leading-relaxed">
                {script}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
