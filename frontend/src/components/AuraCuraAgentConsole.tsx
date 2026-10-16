'use client';

import React, { useState } from 'react';
import { Sparkles, Terminal, Activity, ShieldCheck, Play, Send, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { soundService } from '../services/soundService';
import type { AgentTraceStep, ConsumerBeautyProfile, AuraCuraExecutionMode } from '../types';

interface AuraCuraAgentConsoleProps {
  selectedProfile: ConsumerBeautyProfile | null;
  onRunSynthesis: (message?: string) => Promise<void>;
  isLoading: boolean;
  traceSteps: AgentTraceStep[];
  executionMode: AuraCuraExecutionMode;
  onSelectPresetPersona?: (personaId: string) => void;
}

interface PersonaPreset {
  id: string;
  badge: string;
  title: string;
  patient: string;
  brief: string;
}

const PRESET_SCENARIOS: PersonaPreset[] = [
  {
    id: 'sarah-chen',
    badge: '🚨 Acute Gala Crisis',
    title: 'Sarah Chen · Charity Gala',
    patient: 'Acne 74 · Redness 82 · Damaged Barrier',
    brief: 'Patient has acute facial flare-up 6 hours before black-tie gala. Urgent need for anti-erythema optical gown and 100% barrier repair.',
  },
  {
    id: 'marcus-reed',
    badge: '👔 Keynote Speaker',
    title: 'Marcus Reed · Tech Summit',
    patient: 'Dehydration 28 · Wrinkles 68 · Compromised',
    brief: '42yo keynote speaker under studio lighting. Extreme stratum dehydration. Pair midnight navy blazer with multi-molecular HA infusion.',
  },
  {
    id: 'elena-gomez',
    badge: '☀️ Beach Wedding',
    title: 'Elena Gomez · Resort Gala',
    patient: 'Melasma 78 · Healthy Barrier · UPF 50+',
    brief: 'Sun-drenched seaside celebration. Needs UPF 50+ terracotta maxi dress with non-comedogenic physical zinc oxide sun shield.',
  },
];

export const AuraCuraAgentConsole: React.FC<AuraCuraAgentConsoleProps> = ({
  selectedProfile,
  onRunSynthesis,
  isLoading,
  traceSteps,
  executionMode,
  onSelectPresetPersona,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playMechanicalClick();
    onRunSynthesis(customPrompt || undefined);
    setCustomPrompt('');
  };

  const getPhaseBadge = (phase: string) => {
    switch (phase) {
      case 'diagnose':
        return { label: 'Phase 1: Diagnose', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'audit_safety':
        return { label: 'Phase 2: Audit Safety', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'vto_simulation':
        return { label: 'Phase 3: VTO Simulation', color: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30' };
      case 'synthesize_regimen':
        return { label: 'Phase 4: Synthesize Regimen', color: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30' };
      default:
        return { label: phase, color: 'text-gray-400 bg-gray-500/10 border-gray-500/30' };
    }
  };

  return (
    <div className="border border-[#222530] bg-[#0D0E12] rounded-2xl p-6 shadow-xl mb-6">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#222530]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h3 className="font-sans text-base font-bold text-[#F3F4F6] tracking-tight">
              AuraCura Autonomous Orchestrator
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              ReAct 4-Phase Loop · YouCam Diagnostic Engine · Multi-Vector Guardrails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9CA3AF]">Engine:</span>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
              executionMode === 'auracura_grounded'
                ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
            }`}
          >
            {executionMode === 'auracura_grounded' ? 'GROUNDED_CLINICAL' : 'GENERIC_UNBOUND'}
          </span>
        </div>
      </div>

      {/* Preset Clinical Scenarios */}
      <div className="my-5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-2">
          Clinical Presets:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_SCENARIOS.map((preset) => {
            const isSelected = selectedProfile?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  soundService.playMechanicalClick();
                  onSelectPresetPersona?.(preset.id);
                }}
                className={`text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-[#10B981] bg-[#161820] shadow-emerald-glow'
                    : 'border-[#222530] bg-[#111319] hover:border-[#10B981]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#F3F4F6]">{preset.badge}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                </div>
                <div className="text-xs font-semibold text-[#D4AF37]">{preset.title}</div>
                <div className="text-[11px] text-[#9CA3AF] mt-0.5">{preset.patient}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Command Dispatcher */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={`Instruct AI Director (e.g. "Prescribe anti-erythema evening look for ${selectedProfile?.fullName || 'patient'}")`}
          className="flex-1 bg-[#111319] border border-[#222530] text-[#F3F4F6] placeholder-[#6B7280] text-xs md:text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#10B981] transition-colors"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-3 bg-[#10B981] hover:bg-[#34D399] disabled:opacity-50 text-[#070709] font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-md shadow-emerald-500/20"
        >
          {isLoading ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              <span>Orchestrating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Synthesis</span>
            </>
          )}
        </button>
      </form>

      {/* Real-Time SSE ReAct Streaming Trace Panel */}
      {traceSteps.length > 0 && (
        <div className="border border-[#222530] bg-[#070709]/80 rounded-xl p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#222530]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6]">
                ReAct Execution Trace ({traceSteps.length} Steps Dispatched)
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#9CA3AF]">Server-Sent Events (SSE)</span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {traceSteps.map((step) => {
              const badge = getPhaseBadge(step.phase);
              return (
                <div
                  key={step.id}
                  className="p-2.5 rounded-lg bg-[#111319] border border-[#222530] text-xs flex items-start gap-3"
                >
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 mt-0.5 ${badge.color}`}>
                    {badge.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F3F4F6]">{step.title}</span>
                      <span className="font-mono text-[10px] text-[#9CA3AF]">{step.durationMs}ms</span>
                    </div>
                    <p className="text-[#9CA3AF] text-[11px] mt-0.5 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuraCuraAgentConsole;
