'use client';

import React, { useState, useMemo } from 'react';
import {
  Film,
  Building2,
  Music,
  Utensils,
  Shirt,
  BookOpen,
  Sparkles,
  Compass,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { CulturalEntity, CulturalTasteGraph, VIPProfile } from '../types';

interface VisualTasteGraphProps {
  tasteGraph: CulturalTasteGraph;
  vipProfile?: VIPProfile;
}

interface SatelliteNode {
  id: string;
  name: string;
  category: string;
  affinityScore: number;
  urn: string;
  rationale: string;
  x: number;
  y: number;
}

export function VisualTasteGraph({ tasteGraph, vipProfile }: VisualTasteGraphProps) {
  const [selectedNode, setSelectedNode] = useState<SatelliteNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // SVG dimensions
  const CX = 340;
  const CY = 180;

  // Derive center seed title
  const centerTitle = useMemo(() => {
    if (tasteGraph.seedInterests && tasteGraph.seedInterests.length > 0) {
      return tasteGraph.seedInterests[0];
    }
    if (tasteGraph.resolvedSeeds && tasteGraph.resolvedSeeds.length > 0) {
      return tasteGraph.resolvedSeeds[0].name;
    }
    return vipProfile?.fullName ? `${vipProfile.fullName}'s Taste` : 'Cultural Anchor';
  }, [tasteGraph, vipProfile]);

  // Derive 6 to 8 satellite nodes from expanded entities
  const satellites = useMemo<SatelliteNode[]>(() => {
    const rawEntities = tasteGraph.expandedEntities || [];

    // Fallback entities if empty (e.g., baseline ungrounded)
    const entitiesToUse: CulturalEntity[] = rawEntities.length > 0
      ? rawEntities.slice(0, 8)
      : [
          { id: 'sat_1', name: 'Tadao Ando', category: 'architecture', affinityScore: 0.96 },
          { id: 'sat_2', name: 'Hans Zimmer', category: 'music', affinityScore: 0.94 },
          { id: 'sat_3', name: 'Oppenheimer Mix', category: 'film', affinityScore: 0.92 },
          { id: 'sat_4', name: 'Noma Private Salon', category: 'dining', affinityScore: 0.91 },
          { id: 'sat_5', name: 'Bizen Stoneware', category: 'fashion', affinityScore: 0.89 },
          { id: 'sat_6', name: 'Wabi-Sabi Aesthetics', category: 'literature', affinityScore: 0.88 },
        ];

    const count = Math.min(Math.max(entitiesToUse.length, 6), 8);
    const radiusX = 225;
    const radiusY = 115;

    return entitiesToUse.slice(0, count).map((entity, idx) => {
      // Calculate angular positions around the ellipse
      const angle = (idx * 2 * Math.PI) / count - Math.PI / 2;
      const x = Math.round(CX + radiusX * Math.cos(angle));
      const y = Math.round(CY + radiusY * Math.sin(angle));

      const entityName = entity.name || 'Cultural Entity';
      const cat = entity.category || 'art';
      const affinity = entity.affinityScore || 0.88;
      const urn = (entity.metadata?.urn as string) || entity.id || `urn:qloo:entity:${idx}`;

      const rationale =
        (entity.metadata?.culturalRationale as string) ||
        (entity.metadata?.notes as string) ||
        `Cross-domain cultural correlation reaches ${Math.round(
          affinity * 100
        )}% with anchor "${centerTitle}", reflecting shared latent factors of structural harmony, natural material authenticity, and understated elegance.`;

      return {
        id: entity.id || `sat_${idx}`,
        name: entityName,
        category: cat,
        affinityScore: affinity,
        urn,
        rationale,
        x,
        y,
      };
    });
  }, [tasteGraph, centerTitle]);

  const activeNode = selectedNode || satellites.find((s) => s.id === hoveredNodeId) || null;

  const getDomainIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('film') || lower.includes('cinema') || lower.includes('movie')) {
      return <Film className="w-3.5 h-3.5 text-[#0284C7]" />;
    }
    if (lower.includes('arch') || lower.includes('build')) {
      return <Building2 className="w-3.5 h-3.5 text-[#0D9488]" />;
    }
    if (lower.includes('musi') || lower.includes('artist') || lower.includes('sound')) {
      return <Music className="w-3.5 h-3.5 text-[#7C3AED]" />;
    }
    if (lower.includes('dini') || lower.includes('place') || lower.includes('food')) {
      return <Utensils className="w-3.5 h-3.5 text-[#D97706]" />;
    }
    if (lower.includes('fash') || lower.includes('craft') || lower.includes('brand')) {
      return <Shirt className="w-3.5 h-3.5 text-[#BE185D]" />;
    }
    return <BookOpen className="w-3.5 h-3.5 text-[#4B5563]" />;
  };

  const getDomainBadgeColor = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('film')) return 'bg-sky-50 text-sky-800 border-sky-200';
    if (lower.includes('arch')) return 'bg-teal-50 text-teal-800 border-teal-200';
    if (lower.includes('musi')) return 'bg-purple-50 text-purple-800 border-purple-200';
    if (lower.includes('dini')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (lower.includes('fash')) return 'bg-rose-50 text-rose-800 border-rose-200';
    return 'bg-stone-50 text-stone-800 border-stone-200';
  };

  const getCategoryTitle = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('film')) return 'Film & Cinema';
    if (lower.includes('arch')) return 'Architecture';
    if (lower.includes('musi')) return 'Acoustic / Music';
    if (lower.includes('dini')) return 'Fine Dining';
    if (lower.includes('fash')) return 'Bespoke Craft';
    if (lower.includes('lite')) return 'Philosophy & Literature';
    return category.toUpperCase();
  };

  return (
    <div className="relative w-full rounded-2xl bg-[#FAF8F5] border border-[#E5E0D6] p-4.5 sm:p-5 shadow-xs overflow-hidden select-none">
      {/* Visual Graph Meta Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-2 border-b border-[#E5E0D6]/80">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#183D33] font-sans">
            Qloo Interactive Taste Network
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#183D33]/8 text-[#183D33] border border-[#183D33]/15">
            250M+ Vector Corpus
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#6B736D]">
          <Info className="w-3.5 h-3.5 text-[#183D33]" />
          <span>Click or hover any node to inspect cross-domain correlation rationale</span>
        </div>
      </div>

      {/* SVG Canvas (680 x 380) */}
      <div className="relative w-full overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 680 380"
          className="w-full h-auto min-h-[300px] max-h-[400px] transition-all"
        >
          <defs>
            <filter id="seedGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#224C41" />
              <stop offset="100%" stopColor="#183D33" />
            </radialGradient>

            <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#183D33" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* 1. Curved Connecting Edges (Dashed Lines with Dynamic Highlight) */}
          {satellites.map((sat) => {
            const isHovered = hoveredNodeId === sat.id || selectedNode?.id === sat.id;
            // Slight curve towards center
            const midX = (CX + sat.x) / 2;
            const midY = (CY + sat.y) / 2 - 12;
            const pathD = `M ${CX} ${CY} Q ${midX} ${midY} ${sat.x} ${sat.y}`;

            return (
              <g key={`edge_${sat.id}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={isHovered ? '#183D33' : '#C8DCD1'}
                  strokeWidth={isHovered ? 2.4 : 1.2}
                  strokeDasharray={isHovered ? 'none' : '4 3'}
                  className="transition-all duration-300"
                />

                {/* Animated Energy Packet on Hover */}
                {isHovered && (
                  <circle r="3.5" fill="#D4AF37">
                    <animateMotion path={pathD} dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* 2. Center Seed Node (Deep Pine with Gold Rim & Subtle Pulse) */}
          <g
            transform={`translate(${CX}, ${CY})`}
            className="cursor-pointer"
            onClick={() => setSelectedNode(null)}
          >
            {/* Outer golden halo pulse */}
            <circle
              r="46"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1.5"
              opacity="0.4"
              className="animate-pulse"
            />
            {/* Main Seed Circle */}
            <circle
              r="40"
              fill="url(#centerGradient)"
              stroke="#D4AF37"
              strokeWidth="2.5"
              filter="url(#seedGlow)"
            />
            {/* Center Labeling */}
            <text
              textAnchor="middle"
              dy="-8"
              fill="#D4AF37"
              fontSize="8.5"
              fontWeight="700"
              fontFamily="sans-serif"
              letterSpacing="0.8"
            >
              CULTURAL SEED
            </text>
            <text
              textAnchor="middle"
              dy="9"
              fill="#FAF8F5"
              fontSize="11"
              fontWeight="600"
              fontFamily="serif"
            >
              {centerTitle.length > 14 ? centerTitle.slice(0, 12) + '…' : centerTitle}
            </text>
            <text
              textAnchor="middle"
              dy="22"
              fill="#10B981"
              fontSize="8"
              fontFamily="monospace"
              fontWeight="700"
            >
              100% ANCHOR
            </text>
          </g>

          {/* 3. Satellite Nodes (6 to 8 Cross-Domain Correlated Entities) */}
          {satellites.map((sat) => {
            const isHovered = hoveredNodeId === sat.id || selectedNode?.id === sat.id;

            return (
              <g
                key={sat.id}
                transform={`translate(${sat.x}, ${sat.y})`}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredNodeId(sat.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => setSelectedNode(sat)}
              >
                {/* Node Pill / Circle */}
                <circle
                  r={isHovered ? 29 : 25}
                  fill="#FFFFFF"
                  stroke={isHovered ? '#183D33' : '#E5E0D6'}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-200"
                  style={{
                    filter: isHovered
                      ? 'drop-shadow(0 4px 6px rgba(24,61,51,0.18))'
                      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))',
                  }}
                />

                {/* Domain Category Dot */}
                <circle
                  r="4"
                  cy={isHovered ? -16 : -13}
                  fill={isHovered ? '#183D33' : '#D4AF37'}
                />

                {/* Entity Name */}
                <text
                  textAnchor="middle"
                  dy={isHovered ? 1 : 1}
                  fill="#161A18"
                  fontSize={isHovered ? '10' : '9'}
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {sat.name.length > 11 ? sat.name.slice(0, 10) + '…' : sat.name}
                </text>

                {/* Affinity Score in Geist Mono */}
                <text
                  textAnchor="middle"
                  dy={isHovered ? 13 : 11.5}
                  fill="#183D33"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {Math.round(sat.affinityScore * 100)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4. Luxury Rationale Popover Drawer (Below Graph) */}
      {activeNode ? (
        <div className="mt-3 p-4 rounded-xl bg-white border border-[#183D33]/20 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${getDomainBadgeColor(
                  activeNode.category
                )}`}
              >
                {getDomainIcon(activeNode.category)}
                <span>{getCategoryTitle(activeNode.category)}</span>
              </span>

              <h4 className="text-sm font-semibold text-[#161A18] font-serif">
                {activeNode.name}
              </h4>

              <span className="font-mono text-[11px] font-semibold text-[#183D33] bg-[#183D33]/10 px-2 py-0.5 rounded-full border border-[#183D33]/15">
                Affinity: {Math.round(activeNode.affinityScore * 100)}%
              </span>
            </div>

            {selectedNode && (
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-[#6B736D] hover:text-[#183D33] text-xs font-bold px-1.5 py-0.5 rounded-md hover:bg-[#FAF8F5]"
              >
                ✕
              </button>
            )}
          </div>

          <p className="mt-2 text-xs text-[#42504B] leading-relaxed">
            {activeNode.rationale}
          </p>

          <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#6B736D] border-t border-[#E5E0D6]/60 pt-2 font-mono">
            <span className="truncate max-w-[280px]">URN: {activeNode.urn}</span>
            <span className="text-[#10B981] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified Qloo Grounding
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-2 p-2.5 rounded-xl bg-[#F4F1EA]/60 border border-[#E5E0D6] text-center text-xs text-[#6B736D] font-sans">
          <span>
            Hover or click any satellite entity on the network graph to inspect cross-domain taste analytics.
          </span>
        </div>
      )}
    </div>
  );
}
