'use client';

import React from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { ComplianceAuditResult } from '../../types';

interface ComplianceAuditCardProps {
  audit: ComplianceAuditResult;
}

export const ComplianceAuditCard: React.FC<ComplianceAuditCardProps> = ({ audit }) => {
  const isCompliant = audit.isCompliant;

  return (
    <div className="border border-[#183D33]/15 bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-[#EBE6DD]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#183D33]">
              Governance & Guardrails
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 border border-[#E5E0D6] bg-[#FAF8F5] text-[#6B736D] rounded-full uppercase tracking-wide">
              FCPA Audited
            </span>
          </div>
          <h3 className="text-2xl font-semibold text-[#161A18] tracking-tight">
            Compliance & Taboo Verification Ledger
          </h3>
        </div>

        <div
          className={`w-9 h-9 border rounded-lg flex items-center justify-center ${
            isCompliant
              ? 'border-[#C8DCD1] bg-[#EDF4F0] text-[#1D5A4A]'
              : 'border-[#F8B4B4] bg-[#FDF2F2] text-[#C53030]'
          }`}
        >
          {isCompliant ? <ShieldCheck className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
        </div>
      </div>

      {/* Hero Status Banner */}
      <div
        className={`p-5 mb-5 border rounded-xl flex items-start gap-3.5 shadow-2xs ${
          isCompliant
            ? 'border-[#C8DCD1] bg-[#EDF4F0] text-[#1D5A4A]'
            : 'border border-rose-200 bg-rose-50/50 text-[#C53030]'
        }`}
      >
        {isCompliant ? (
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#10B981]" />
        ) : (
          <AlertOctagon className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#C53030]" />
        )}
        <div>
          <h4 className="font-sans text-sm font-semibold uppercase tracking-wider">
            {isCompliant
              ? '100% FCPA & Taboo Compliant'
              : 'Compliance Hold Flagged / Governance Review Required'}
          </h4>
          <p className="text-sm text-[#323835] mt-1 font-sans leading-relaxed">
            {audit.auditNotes}
          </p>
        </div>
      </div>

      {/* Real-time Precedent Confirmation Banner if precedent check is active */}
      {audit.checks.some((c) => c.id === 'precedent' && (c.detail.includes('Precedent registered') || c.detail.includes('committed'))) && (
        <div className="p-4 mb-5 border border-amber-300 bg-amber-50/60 rounded-xl flex items-start gap-3 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold uppercase tracking-wider text-amber-900 block mb-0.5">
              Curation Precedent Recorded in Ledger
            </span>
            <p className="text-amber-800 leading-relaxed font-sans">
              Archival gift / dining commission confirmed via MCP Tool. Future duplicate proposals for this principal are automatically intercepted by policy guardrails.
            </p>
          </div>
        </div>
      )}

      {/* Audit Checklist Table with Soft Modern Hover Rows */}
      <div className="divide-y divide-[#EBE6DD] border border-[#E5E0D6] bg-white rounded-xl mb-5 overflow-hidden">
        {audit.checks.map((check) => {
          const isPass = check.status === 'pass';
          const isWarn = check.status === 'warn';
          const isPrecedentLogged = check.id === 'precedent' && (check.detail.includes('Precedent registered') || check.detail.includes('committed'));

          return (
            <div
              key={check.id}
              className={`py-3.5 px-4 flex items-start justify-between gap-3 text-sm transition-colors ${
                isPrecedentLogged ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {isPrecedentLogged ? (
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                  ) : isPass ? (
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-4 h-4 text-[#B45309]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#C53030]" />
                  )}
                </div>
                <div>
                  <span className="font-semibold text-[#161A18] block">{check.label}</span>
                  <span className="text-xs text-[#6B736D] font-sans">{check.detail}</span>
                </div>
              </div>

              {/* Status Pill Badge */}
              {isPrecedentLogged ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Precedent Logged</span>
                </span>
              ) : isPass ? (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pass</span>
                </span>
              ) : isWarn ? (
                <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Warn</span>
                </span>
              ) : (
                <span className="bg-rose-50 text-rose-800 border border-rose-200/80 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Flagged</span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Blocked Items (if any) */}
      {audit.blockedItems && audit.blockedItems.length > 0 && (
        <div className="p-5 border border-[#F8B4B4] bg-[#FDF2F2] rounded-xl shadow-2xs">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase text-[#C53030]">
            <AlertOctagon className="w-4 h-4" />
            <span>Blocked Proposals & Intercepted Violations ({audit.blockedItems.length})</span>
          </div>

          <div className="space-y-2.5">
            {audit.blockedItems.map((item, idx) => (
              <div key={idx} className="text-sm p-3.5 border border-[#E5E0D6] bg-white rounded-lg shadow-2xs">
                <div className="font-semibold text-[#161A18] mb-1">{item.itemName}</div>
                <div className="text-xs text-[#C53030] font-sans font-medium">
                  {item.reasons.join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
