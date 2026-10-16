'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  SplitSquareVertical,
  Activity,
  Download,
} from 'lucide-react';
import { soundService } from '../services/soundService';

interface GuidedJudgeTourProps {
  onSelectPatient: (patientId: string) => void;
  onRunDiagnostics: () => Promise<void>;
  onOpenBenchmark: () => void;
  onExportPdf?: () => void;
}

const WENDY_YEN_TOUR_STEPS = [
  {
    step: 1,
    badge: 'Step 1 of 4 · Emergency Client Profile',
    title: 'Select Sarah Chen (Acute Gala Flare-Up)',
    description:
      'Sarah Chen (24yo) has an emergency Black Tie Charity Gala at SF MOMA in 6 hours. Her facial barrier is severely compromised with active erythema (Redness Score 82) and inflammatory acne (Score 74).',
    actionText: '1. Select Sarah Chen',
    actionType: 'select_sarah',
  },
  {
    step: 2,
    badge: 'Step 2 of 4 · Clinical Vision Scan',
    title: 'Run YouCam Multi-Spectral Diagnostic Scan',
    description:
      'AuraCura triggers the YouCam Diagnostician to analyze 14 clinical markers. It detects TEWL moisture deficit and classifies skin undertone as Cool Fair (Type I-II).',
    actionText: '2. Run Diagnostics Scan',
    actionType: 'run_diagnostics',
  },
  {
    step: 3,
    badge: 'Step 3 of 4 · Bio-Harmonic Couture VTO',
    title: 'Simulate Sage Green Mulberry Silk Gown VTO',
    description:
      'Rather than clashing red, the AI Director pairs her with an Organic Mulberry Silk Gown in Muted Sage Green (#8A9A86) that optically cancels 650nm hemoglobin flush with a 96/100 Chromatic Harmony score.',
    actionText: '3. Inspect 4 Rich Cards',
    actionType: 'inspect_cards',
  },
  {
    step: 4,
    badge: 'Step 4 of 4 · Competitive Benchmark',
    title: 'Head-to-Head: AuraCura vs Generic ChatGPT',
    description:
      'Open the Grounding Benchmark. Demonstrates why Generic Blind LLMs produce a 75% return rate and cause chemical contact dermatitis, whereas AuraCura achieves 100% safety clearance and &lt; 5% returns.',
    actionText: '4. Open Benchmark Battle',
    actionType: 'open_benchmark',
  },
];

export const GuidedJudgeTour: React.FC<GuidedJudgeTourProps> = ({
  onSelectPatient,
  onRunDiagnostics,
  onOpenBenchmark,
  onExportPdf,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const currentStep = WENDY_YEN_TOUR_STEPS[currentStepIndex];

  const handleStartTour = () => {
    soundService.playMechanicalClick();
    setIsOpen(true);
    setCurrentStepIndex(0);
    // Automatically select Sarah Chen on open
    onSelectPatient('sarah-chen');
  };

  const executeActionForStep = async (stepIndex: number) => {
    soundService.playMechanicalClick();
    const action = WENDY_YEN_TOUR_STEPS[stepIndex].actionType;

    if (action === 'select_sarah') {
      onSelectPatient('sarah-chen');
    } else if (action === 'run_diagnostics') {
      await onRunDiagnostics();
    } else if (action === 'inspect_cards') {
      const el = document.getElementById('rich-cards-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (action === 'open_benchmark') {
      onOpenBenchmark();
    }
  };

  const handleNext = async () => {
    soundService.playMechanicalClick();
    if (currentStepIndex < WENDY_YEN_TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      await executeActionForStep(nextIdx);
    } else {
      soundService.playSuccessChime();
      setIsOpen(false);
    }
  };

  const handlePrev = () => {
    soundService.playMechanicalClick();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Full 60-Second Automated Sequence for Judge Wendy Yen
  const handleRunFullAutomatedTour = async () => {
    soundService.playSuccessChime();
    setIsAutoPlaying(true);
    setIsOpen(true);

    try {
      // Step 1: Select Sarah Chen
      setCurrentStepIndex(0);
      onSelectPatient('sarah-chen');
      await new Promise((r) => setTimeout(r, 2000));

      // Step 2: Run Diagnostics & ReAct Stream
      setCurrentStepIndex(1);
      await onRunDiagnostics();
      await new Promise((r) => setTimeout(r, 3000));

      // Step 3: Inspect Cards
      setCurrentStepIndex(2);
      const el = document.getElementById('rich-cards-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await new Promise((r) => setTimeout(r, 3000));

      // Step 4: Open Grounding Benchmark
      setCurrentStepIndex(3);
      onOpenBenchmark();
    } finally {
      setIsAutoPlaying(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button for Judge Wendy Yen */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleStartTour}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3.5 rounded-full bg-[#0D0E12] text-[#F3F4F6] border border-[#10B981] shadow-2xl hover:bg-[#161820] hover:shadow-emerald-500/25 transition-all group scale-100 hover:scale-105"
          title="Launch 60-Second Guided Tour for Judge Wendy Yen"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]"></span>
          </span>
          <Sparkles className="w-4 h-4 text-[#D4AF37] group-hover:rotate-12 transition-transform" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6]">
              Quick Demo Tour (60s)
            </span>
            <span className="text-[10px] text-[#10B981] font-mono">
              Judge Wendy Yen Experience
            </span>
          </div>
        </button>
      )}

      {/* Floating Interactive Guide Card */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[460px] bg-[#0D0E12] border border-[#10B981]/50 rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col text-[#F3F4F6]">
          {/* Card Top Banner */}
          <div className="bg-[#161820] px-5 py-3.5 flex items-center justify-between border-b border-[#222530]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
                {currentStep.badge}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                soundService.playMechanicalClick();
                setIsOpen(false);
              }}
              className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
              title="Close Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Indicator Track */}
          <div className="w-full bg-[#070709] h-1.5 flex gap-1 px-2 py-0.5">
            {WENDY_YEN_TOUR_STEPS.map((step, idx) => (
              <div
                key={step.step}
                className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                  idx <= currentStepIndex
                    ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                    : 'bg-[#222530]'
                }`}
              />
            ))}
          </div>

          {/* Card Body */}
          <div className="p-5 space-y-3.5 bg-gradient-to-b from-[#0D0E12] to-[#070709]">
            <h3 className="font-sans text-base font-bold text-[#F3F4F6] leading-snug">
              {currentStep.title}
            </h3>

            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              {currentStep.description}
            </p>

            {/* Step Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => executeActionForStep(currentStepIndex)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161820] border border-[#10B981]/40 text-xs font-bold text-[#10B981] hover:bg-[#10B981] hover:text-[#070709] transition-all"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>{currentStep.actionText}</span>
              </button>

              <button
                type="button"
                onClick={handleRunFullAutomatedTour}
                disabled={isAutoPlaying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#070709] transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isAutoPlaying ? 'Auto-Playing...' : '⚡ 60s Auto-Demo'}</span>
              </button>
            </div>
          </div>

          {/* Stepper Navigation Footer */}
          <div className="px-5 py-3.5 bg-[#111319] border-t border-[#222530] flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                currentStepIndex === 0
                  ? 'text-[#4B5563] cursor-not-allowed'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <span className="text-[11px] font-mono text-[#D4AF37] font-semibold">
              {currentStepIndex + 1} / {WENDY_YEN_TOUR_STEPS.length}
            </span>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#34D399] text-[#070709] text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              <span>{currentStepIndex === WENDY_YEN_TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GuidedJudgeTour;
