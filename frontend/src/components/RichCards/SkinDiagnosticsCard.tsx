'use client';

import React, { useState } from 'react';
import { Activity, ShieldCheck, AlertTriangle, Droplets, Flame, Sparkles, User, Info } from 'lucide-react';
import { soundService } from '../../services/soundService';
import type { SkinMetrics, ConsumerBeautyProfile, SkinToneUndertone } from '../../types';

interface SkinDiagnosticsCardProps {
  skinMetrics: SkinMetrics;
  profile?: ConsumerBeautyProfile;
}

export const SkinDiagnosticsCard: React.FC<SkinDiagnosticsCardProps> = ({
  skinMetrics,
  profile,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const undertoneConfig: Record<SkinToneUndertone, { label: string; swatch: string; advice: string }> = {
    cool_fair: {
      label: 'Cool Fair (Type I-II)',
      swatch: '#F8D9CE',
      advice: 'Prone to rapid erythema flare-ups. Complemented by muted sage greens and silver tones.',
    },
    neutral_medium: {
      label: 'Neutral Medium (Type III)',
      swatch: '#E0B594',
      advice: 'Balanced chromatic absorption. Versatile across emerald, terracotta, and jewel tones.',
    },
    warm_deep: {
      label: 'Warm Deep (Type V-VI)',
      swatch: '#633B24',
      advice: 'Rich melanin baseline. Enhanced by high-saturation amber, cobalt, and champagne gold.',
    },
    olive: {
      label: 'Olive / Mediterranean (Type IV)',
      swatch: '#C29B72',
      advice: 'Greenish-yellow undertones. Neutralizes well with terracotta, rose gold, and navy.',
    },
  };

  const undertone = undertoneConfig[skinMetrics.undertone] || undertoneConfig.neutral_medium;

  // Radar chart calculation for 6 core metrics
  const radarMetrics = [
    { key: 'acne', label: 'Acne Severity', score: skinMetrics.acneScore, color: '#F87171' },
    { key: 'redness', label: 'Redness / Erythema', score: skinMetrics.rednessScore, color: '#FB7185' },
    { key: 'moisture', label: 'Stratum Hydration', score: skinMetrics.moistureScore, color: '#60A5FA' },
    { key: 'pores', label: 'Pore Congestion', score: skinMetrics.poreScore, color: '#FBBF24' },
    { key: 'wrinkles', label: 'Elasticity / Wrinkles', score: skinMetrics.wrinkleScore, color: '#A78BFA' },
    { key: 'darkCircle', label: 'Periorbital Pigment', score: skinMetrics.darkCircleScore, color: '#34D399' },
  ];

  // SVG Radar coordinates (center: 100, 100, radius: 75)
  const cx = 100;
  const cy = 100;
  const radius = 75;
  const totalSides = radarMetrics.length;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / totalSides) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const polygonPoints = radarMetrics
    .map((m, i) => {
      const { x, y } = getCoordinates(i, m.score);
      return `${x},${y}`;
    })
    .join(' ');

  const ageDelta = skinMetrics.skinAge - (skinMetrics.chronologicalAge || profile?.age || 24);

  const barrierStyles = {
    healthy: {
      border: 'border-[#10B981]/40',
      bg: 'bg-[#10B981]/10',
      text: 'text-[#10B981]',
      badge: 'Healthy & Intact',
      icon: ShieldCheck,
      desc: 'Stratum corneum lipid bilayers intact. Suitable for targeted active cosmeceuticals.',
    },
    compromised: {
      border: 'border-[#F59E0B]/40',
      bg: 'bg-[#F59E0B]/10',
      text: 'text-[#F59E0B]',
      badge: 'Compromised Barrier',
      icon: AlertTriangle,
      desc: 'Elevated transepidermal water loss (TEWL). High acid concentrations contraindicated.',
    },
    severely_damaged: {
      border: 'border-[#EF4444]/50',
      bg: 'bg-[#EF4444]/15',
      text: 'text-[#EF4444]',
      badge: 'Severely Damaged Barrier',
      icon: Flame,
      desc: 'Critical stratum corneum breakdown. Retinoids, scrubs, and direct acids strictly forbidden.',
    },
  }[skinMetrics.barrierStatus] || {
    border: 'border-[#F59E0B]/40',
    bg: 'bg-[#F59E0B]/10',
    text: 'text-[#F59E0B]',
    badge: 'Compromised Barrier',
    icon: AlertTriangle,
    desc: 'Barrier sensitivity detected.',
  };

  const BarrierIcon = barrierStyles.icon;

  return (
    <div className="border border-[#222530] bg-[#0D0E12] rounded-2xl p-6 shadow-xl transition-all duration-300">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#222530]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h3 className="font-sans text-base font-bold text-[#F3F4F6] tracking-tight">
              Clinical Skin Diagnostics
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Multi-spectral YouCam Vision Analysis · 14 Bio-Markers
            </p>
          </div>
        </div>

        {/* YouCam S2S v2.0 API & Undertone Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            Powered by YouCam S2S v2.0 Skin Analysis API
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161820] border border-[#222530] rounded-xl">
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner"
              style={{ backgroundColor: undertone.swatch }}
            />
            <span className="text-xs font-medium text-[#F3F4F6]">{undertone.label}</span>
          </div>
        </div>
      </div>

      {/* Barrier Integrity & Aging Alert Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
        {/* Barrier Status Pill */}
        <div className={`md:col-span-2 border ${barrierStyles.border} ${barrierStyles.bg} rounded-xl p-4 flex items-start gap-3`}>
          <BarrierIcon className={`w-5 h-5 ${barrierStyles.text} shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${barrierStyles.text}`}>
                {barrierStyles.badge}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-gray-300 font-mono">
                Barrier Index
              </span>
            </div>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              {barrierStyles.desc}
            </p>
          </div>
        </div>

        {/* Biological vs Chronological Age */}
        <div className="border border-[#222530] bg-[#161820] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-2">
            <span>Biological Skin Age</span>
            <User className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#F3F4F6]">
              {skinMetrics.skinAge}
            </span>
            <span className="text-xs text-[#9CA3AF]">years</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md font-mono ${
                ageDelta > 0
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {ageDelta > 0 ? `+${ageDelta} yrs` : `${ageDelta} yrs`}
            </span>
          </div>

          <p className="text-[11px] text-[#9CA3AF] mt-1.5">
            Chronological: <span className="text-[#F3F4F6] font-medium">{skinMetrics.chronologicalAge || profile?.age || 24} yrs</span>
          </p>
        </div>
      </div>

      {/* Main Diagnostic Body: Radar Chart + Quantitative Metric Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
        {/* SVG Hexagonal Radar Visual */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 bg-[#161820]/60 border border-[#222530] rounded-2xl">
          <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible select-none">
            {/* Background concentric rings (25%, 50%, 75%, 100%) */}
            {[0.25, 0.5, 0.75, 1].map((pct, idx) => (
              <polygon
                key={idx}
                points={Array.from({ length: totalSides })
                  .map((_, i) => {
                    const { x, y } = getCoordinates(i, pct * 100);
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#222530"
                strokeWidth="1"
                strokeDasharray={pct === 1 ? 'none' : '2 2'}
              />
            ))}

            {/* Spokes from center to edge */}
            {radarMetrics.map((_, i) => {
              const { x, y } = getCoordinates(i, 100);
              return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#222530" strokeWidth="1" />;
            })}

            {/* Filled Polygon representing user profile */}
            <polygon
              points={polygonPoints}
              fill="rgba(16, 185, 129, 0.25)"
              stroke="#10B981"
              strokeWidth="2"
              className="transition-all duration-500"
            />

            {/* Vertex points */}
            {radarMetrics.map((m, i) => {
              const { x, y } = getCoordinates(i, m.score);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={m.color}
                  stroke="#0D0E12"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:scale-125 transition-transform"
                  onClick={() => {
                    soundService.playToggleClick();
                    setSelectedMetric(m.key);
                  }}
                />
              );
            })}
          </svg>

          <span className="text-[11px] text-[#9CA3AF] mt-2 font-mono">
            Hexagonal Clinical Biome Polygon
          </span>
        </div>

        {/* Itemized Diagnostic Scores */}
        <div className="lg:col-span-7 space-y-3.5">
          {radarMetrics.map((metric) => {
            const isHigh = metric.score >= 60;
            const isLowHydration = metric.key === 'moisture' && metric.score < 50;
            const isFlagged = isHigh || isLowHydration;

            return (
              <div
                key={metric.key}
                onClick={() => {
                  soundService.playMechanicalClick();
                  setSelectedMetric(metric.key);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  selectedMetric === metric.key
                    ? 'border-[#10B981] bg-[#161820]'
                    : 'border-[#222530] bg-[#111319]/80 hover:border-[#10B981]/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    <span className="font-medium text-[#F3F4F6]">{metric.label}</span>
                    {isFlagged && (
                      <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                        {metric.key === 'moisture' ? 'Deficit' : 'Acute'}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-[#F3F4F6]">
                    {metric.score} / 100
                  </span>
                </div>

                {/* Progress Meter Bar */}
                <div className="w-full h-2 rounded-full bg-[#1F2430] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${metric.score}%`,
                      backgroundColor: metric.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SkinDiagnosticsCard;
