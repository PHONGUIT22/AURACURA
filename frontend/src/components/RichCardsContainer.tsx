'use client';

import React from 'react';
import { SkinDiagnosticsCard } from './RichCards/SkinDiagnosticsCard';
import { ApparelAndMakeupVTOCard } from './RichCards/ApparelAndMakeupVTOCard';
import { ClinicalPrescriptionCard } from './RichCards/ClinicalPrescriptionCard';
import { SafetyAuditCard } from './RichCards/SafetyAuditCard';
import { EmeraldSkeleton } from './EmeraldSkeleton';
import { Sparkles, ShieldCheck } from 'lucide-react';
import type { AuraCuraDossier } from '../types';

interface RichCardsContainerProps {
  dossier: AuraCuraDossier | null;
  isLoading?: boolean;
}

export const RichCardsContainer: React.FC<RichCardsContainerProps> = ({
  dossier,
  isLoading = false,
}) => {
  if (isLoading) {
    return <EmeraldSkeleton />;
  }

  if (!dossier) {
    return (
      <div className="border border-[#222530] bg-[#0D0E12] rounded-2xl p-12 text-center shadow-xl">
        <div className="w-14 h-14 mx-auto mb-4 border border-[#10B981]/30 bg-[#10B981]/10 rounded-2xl flex items-center justify-center shadow-emerald-glow">
          <Sparkles className="w-7 h-7 text-[#10B981]" />
        </div>
        <h3 className="font-sans text-lg font-bold text-[#F3F4F6] mb-2 tracking-tight">
          No Clinical Dossier Generated
        </h3>
        <p className="text-sm text-[#9CA3AF] max-w-md mx-auto leading-relaxed font-sans mb-4">
          Select a patient or client from the roster rail and initiate the ReAct Autonomous Orchestrator to generate clinical diagnostics, optical VTO try-on, and skin-safe prescriptions.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161820] border border-[#222530] text-xs text-[#D4AF37]">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span>Multi-Vector Dermatology & Fabric Friction Guardrails Active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Multi-Spectral Clinical Skin Diagnostics Card */}
      <SkinDiagnosticsCard
        skinMetrics={dossier.skinMetrics}
        profile={dossier.profile}
      />

      {/* 2. Before/After VTO Simulation & Chromatic Harmony Card */}
      <ApparelAndMakeupVTOCard
        apparelItem={dossier.apparelVTO}
        userSelfieUrl={dossier.profile?.userSelfieUrl}
        eventContext={dossier.profile?.eventContext}
      />

      {/* 3. Clinical Diurnal Skincare Prescription Card */}
      <ClinicalPrescriptionCard
        skincareRegimen={dossier.skincareRegimen}
      />

      {/* 4. Dermatology & Fabric Friction Safety Audit Card */}
      <SafetyAuditCard
        safetyAudit={dossier.safetyAudit}
      />
    </div>
  );
};

export default RichCardsContainer;
