'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, XCircle, Sparkles, Droplet, Layers, FileCheck } from 'lucide-react';
import { soundService } from '../../services/soundService';
import type { SafetyCheck } from '../../types';

interface SafetyAuditCardProps {
  safetyAudit: {
    isSafe: boolean;
    checks: SafetyCheck[];
    summary: string;
  };
}

export const SafetyAuditCard: React.FC<SafetyAuditCardProps> = ({ safetyAudit }) => {
  const { isSafe, checks, summary } = safetyAudit;

  const checkMeta: Record<
    string,
    { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    comedogenic: {
      title: 'Comedogenicity Pore-Clog Audit',
      subtitle: 'Screening for heavy waxes, Coconut Oil, and Isopropyl Myristate',
      icon: Droplet,
    },
    active_clash: {
      title: 'Active Ingredient Clash Engine',
      subtitle: 'Contradiction screening between high-strength acids and retinoids',
      icon: AlertTriangle,
    },
    barrier_safety: {
      title: 'Stratum Corneum & Allergen Clearance',
      subtitle: 'Filtering out Denatured Alcohol, synthetic fragrances, and known patient allergens',
      icon: ShieldCheck,
    },
    fabric_friction: {
      title: 'Fabric Tactile Friction & Shear Audit',
      subtitle: 'Verifying low tactile friction coefficient across collar, neckline, and body',
      icon: Layers,
    },
  };

  const getStatusBadge = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return {
          label: 'CLEARED · PASS',
          bg: 'bg-emerald-500/15',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          icon: CheckCircle,
        };
      case 'warn':
        return {
          label: 'CAUTION · WARN',
          bg: 'bg-amber-500/15',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          icon: AlertTriangle,
        };
      case 'fail':
        return {
          label: 'CONTRAINDICATED · FAIL',
          bg: 'bg-rose-500/15',
          text: 'text-rose-400',
          border: 'border-rose-500/30',
          icon: XCircle,
        };
    }
  };

  return (
    <div className="border border-[#222530] bg-[#0D0E12] rounded-2xl p-6 shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#222530]">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isSafe
                ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            }`}
          >
            {isSafe ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-sans text-base font-bold text-[#F3F4F6] tracking-tight">
              Dermatology & Fabric Safety Audit
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Multi-Vector Clinical Guardrails · Formulation & Micro-Abrasion Screening
            </p>
          </div>
        </div>

        {/* Global Safety Certification Seal */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${
            isSafe
              ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>{isSafe ? 'Clinical Clearance Pass' : 'Safety Veto Triggered'}</span>
        </div>
      </div>

      {/* Executive Summary Banner */}
      <div
        className={`my-5 p-4 rounded-xl border ${
          isSafe
            ? 'border-[#10B981]/30 bg-[#10B981]/5 text-[#D1D5DB]'
            : 'border-rose-500/30 bg-rose-500/5 text-[#D1D5DB]'
        } text-xs leading-relaxed`}
      >
        <span className="font-bold text-[#F3F4F6] block mb-1">Audit Finding:</span>
        {summary}
      </div>

      {/* 4 Multi-Vector Safety Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checks.map((check) => {
          const meta = checkMeta[check.id] || {
            title: check.id,
            subtitle: 'Safety verification vector',
            icon: ShieldCheck,
          };
          const Icon = meta.icon;
          const badge = getStatusBadge(check.status);
          const BadgeIcon = badge.icon;

          return (
            <div
              key={check.id}
              onClick={() => soundService.playToggleClick()}
              className="p-4 rounded-xl border border-[#222530] bg-[#111319] hover:border-[#10B981]/40 transition-all duration-200 cursor-default"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#161820] border border-[#222530] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#10B981]" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-bold text-[#F3F4F6]">
                      {meta.title}
                    </h4>
                    <p className="text-[10px] text-[#9CA3AF] leading-tight">{meta.subtitle}</p>
                  </div>
                </div>

                {/* Status Pill */}
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  <BadgeIcon className="w-3 h-3" />
                  <span>{badge.label}</span>
                </div>
              </div>

              {/* Detailed Finding */}
              <p className="text-xs text-[#9CA3AF] leading-relaxed mt-2.5 pt-2 border-t border-[#222530]/60">
                {check.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SafetyAuditCard;
