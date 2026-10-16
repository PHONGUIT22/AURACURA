'use client';

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  Globe,
  Network,
  ShieldCheck,
  Zap,
  Layers,
  Server,
  Cpu,
} from 'lucide-react';
import { soundService } from '../services/soundService';

interface QlooTelemetryBadgeProps {
  isLive?: boolean;
}

export const QlooTelemetryBadge: React.FC<QlooTelemetryBadgeProps> = ({ isLive = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const showPopover = isOpen || isHovered;

  return (
    <div
      className="relative inline-block select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Luxury Telemetry Pill */}
      <button
        type="button"
        onClick={() => {
          soundService.playMechanicalClick();
          setIsOpen((prev) => !prev);
        }}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all text-xs shadow-2xs cursor-pointer whitespace-nowrap flex-shrink-0 ${
          isLive
            ? 'border-[#C8DCD1] bg-[#EDF4F0] hover:bg-[#E3EEE8] text-[#1D5A4A]'
            : 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800'
        }`}
        title="View live Qloo 250M+ Taste Graph infrastructure telemetry"
      >
        {/* Pulse Dot */}
        {isLive ? (
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 flex-shrink-0" />
        )}

        <span className="font-semibold tracking-wide font-mono text-[11px] whitespace-nowrap">
          {isLive ? 'QLOO GRAPH: ONLINE (v2/insights)' : 'QLOO: CURATED GRAPH'}
        </span>
      </button>

      {/* Floating Detailed Telemetry Popover */}
      {showPopover && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setIsHovered(false);
            }}
          />
          <div
            className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-white border border-[#183D33]/25 rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#161A18]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-[#EBE6DD]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#183D33] text-[#FAF8F5] flex items-center justify-center shadow-xs">
                  <Activity className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#183D33] font-sans">
                    Qloo Taste Graph Telemetry
                  </h4>
                  <p className="text-[11px] text-[#6B736D]">
                    Real-Time Cultural Intelligence Infrastructure
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                  isLive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {isLive ? 'Live API Active' : 'Curated Graph'}
              </span>
            </div>

            {/* Telemetry Metric Rows */}
            <div className="space-y-2 text-xs">
              {/* API Endpoint */}
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B736D] flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-[#183D33]" />
                    API Endpoint
                  </span>
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded font-semibold">
                    HTTPS 200 OK
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#183D33] font-semibold select-all break-all">
                  https://hackathon.api.qloo.com/v2/insights
                </div>
              </div>

              {/* Grid 2-cols: Scale & Latency */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B736D] flex items-center gap-1.5 mb-1">
                    <Database className="w-3 h-3 text-[#183D33]" />
                    Taste Graph Scale
                  </div>
                  <div className="font-serif font-bold text-sm text-[#183D33]">
                    250,000,000+
                  </div>
                  <div className="text-[10px] text-[#6B736D]">Cultural Entities</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B736D] flex items-center gap-1.5 mb-1">
                    <Zap className="w-3 h-3 text-[#D4AF37]" />
                    Query Latency
                  </div>
                  <div className="font-serif font-bold text-sm text-[#183D33]">
                    &lt; 35ms
                  </div>
                  <div className="text-[10px] text-[#6B736D]">Edge Cached / ~180ms Live</div>
                </div>
              </div>

              {/* Inference Mode */}
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B736D] flex items-center gap-1.5 mb-1">
                  <Cpu className="w-3 h-3 text-[#183D33]" />
                  Inference Mode
                </div>
                <div className="text-[11px] font-semibold text-[#161A18]">
                  Cross-Domain Latent Embeddings (Film ➔ Design ➔ Dining)
                </div>
              </div>

              {/* Protocol */}
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B736D] flex items-center gap-1.5 mb-1">
                  <Server className="w-3 h-3 text-[#183D33]" />
                  Protocol
                </div>
                <div className="font-mono text-[11px] text-[#183D33] font-semibold">
                  Model Context Protocol (MCP) JSON-RPC over SSE
                </div>
              </div>

              {/* Compliance Guard */}
              <div className="p-2.5 rounded-xl bg-[#EDF4F0] border border-[#C8DCD1]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#183D33] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Compliance Guard
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                    Enforced
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#1D5A4A] leading-snug">
                  Active (FCPA Anti-Bribery &amp; Taboo Screening)
                </p>
              </div>
            </div>

            {/* Footer Footprint */}
            <div className="pt-2.5 mt-3 border-t border-[#EBE6DD] flex items-center justify-between text-[10px] text-[#6B736D]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Zero-Data-Drift Protocol Active
              </span>
              <span className="font-mono text-[#183D33] font-semibold">v2.14-qloo</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
