'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { TopNavBar } from '../components/TopNavBar';
import { ConsumerRosterRail } from '../components/ConsumerRosterRail';
import { AuraCuraAgentConsole } from '../components/AuraCuraAgentConsole';
import { RichCardsContainer } from '../components/RichCardsContainer';
import { SideBySideComparisonView } from '../components/SideBySideComparisonView';
import { GuidedJudgeTour } from '../components/GuidedJudgeTour';
import { AmbientGlow, GlowState } from '../components/AmbientGlow';
import { soundService } from '../services/soundService';
import { pdfService } from '../services/pdfService';
import type {
  AgentTraceStep,
  AuraCuraExecutionMode,
  AuraCuraDossier,
  ConsumerBeautyProfile,
} from '../types';

export default function Home() {
  const [profiles, setProfiles] = useState<ConsumerBeautyProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ConsumerBeautyProfile | null>(null);
  const [activeDossier, setActiveDossier] = useState<AuraCuraDossier | null>(null);
  const [activeTrace, setActiveTrace] = useState<AgentTraceStep[]>([]);
  const [executionMode, setExecutionMode] = useState<AuraCuraExecutionMode>('auracura_grounded');
  const [isLoading, setIsLoading] = useState(false);
  const [glowState, setGlowState] = useState<GlowState>('idle');
  const [activeSection, setActiveSection] = useState<'console' | 'roster' | 'dossier' | 'benchmark'>('console');

  // Side-by-side benchmark state
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // 1. Fetch Dossier with SSE Streaming ReAct Trace
  const fetchDossierStream = useCallback(
    async (
      profileId: string,
      mode: AuraCuraExecutionMode = executionMode,
      eventBrief?: string
    ) => {
      setIsLoading(true);
      setGlowState('reasoning');
      setActiveTrace([]);

      try {
        const response = await fetch(`${API_BASE_URL}/api/dossier/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            consumerId: profileId,
            eventContext: eventBrief,
            executionMode: mode,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE stream failed with status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';

          for (const block of blocks) {
            const trimmed = block.trim();
            if (!trimmed) continue;

            let dataStr = '';
            for (const line of trimmed.split('\n')) {
              if (line.startsWith('data:')) {
                dataStr = line.replace('data:', '').trim();
              }
            }

            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === 'progress' && parsed.step) {
                  setActiveTrace((prev) => [...prev, parsed.step]);
                } else if (parsed.type === 'complete' && parsed.dossier) {
                  setActiveDossier(parsed.dossier);
                  if (parsed.trace) {
                    setActiveTrace(parsed.trace);
                  }
                }
              } catch {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }

        setGlowState('complete');
        soundService.playSuccessChime();
        setTimeout(() => setGlowState('idle'), 1500);
      } catch (err) {
        console.error('Failed to stream dossier from backend:', err);
        setGlowState('error');
        setTimeout(() => setGlowState('idle'), 2000);
      } finally {
        setIsLoading(false);
      }
    },
    [executionMode, API_BASE_URL]
  );

  // 2. Load Clinical Profiles on Mount
  useEffect(() => {
    async function loadProfiles() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/profiles`);
        if (res.ok) {
          const data = await res.json();
          const list: ConsumerBeautyProfile[] = Array.isArray(data) ? data : data.profiles || [];
          if (list.length > 0) {
            setProfiles(list);
            setSelectedProfile(list[0]);
          }
        }
      } catch (err) {
        console.warn('Backend offline or starting up, using fallback client state:', err);
      }
    }
    loadProfiles();
  }, [API_BASE_URL]);

  const handleSelectProfile = (profile: ConsumerBeautyProfile) => {
    soundService.playMechanicalClick();
    setSelectedProfile(profile);
    setActiveDossier(null);
    setActiveTrace([]);
  };

  const handleToggleMode = (newMode: AuraCuraExecutionMode) => {
    soundService.playToggleClick();
    setExecutionMode(newMode);
    if (selectedProfile && activeDossier) {
      fetchDossierStream(selectedProfile.id, newMode);
    }
  };

  const handleOpenBenchmark = async () => {
    if (!selectedProfile) return;
    setActiveSection('benchmark');
    setIsLoading(true);
    setGlowState('reasoning');

    try {
      const res = await fetch(`${API_BASE_URL}/api/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          eventContext: selectedProfile.eventContext,
        }),
      });

      if (!res.ok) throw new Error(`Benchmark failed: ${res.status}`);
      const data = await res.json();
      setComparisonData(data);
      setIsComparisonOpen(true);
      setGlowState('complete');
      setTimeout(() => setGlowState('idle'), 1000);
    } catch (err) {
      console.error('Benchmark request failed:', err);
      setGlowState('error');
      setTimeout(() => setGlowState('idle'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (activeDossier) {
      soundService.playSuccessChime();
      pdfService.exportAuraCuraDossierPdf(activeDossier);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#070709] text-[#F3F4F6] flex flex-row relative selection:bg-[#10B981]/25 selection:text-[#10B981]">
      {/* Left Obsidian & Emerald Sidebar */}
      <AppSidebar
        onOpenBenchmark={handleOpenBenchmark}
        onNavigateConsole={() => setActiveSection('console')}
        onNavigateRoster={() => setActiveSection('roster')}
        onNavigateDossier={() => setActiveSection('dossier')}
        activeSection={activeSection}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Luxury Nav Bar */}
        <TopNavBar
          executionMode={executionMode}
          onToggleMode={handleToggleMode}
          onOpenSideBySide={handleOpenBenchmark}
          onExportPdf={handleExportPdf}
          activeDossier={activeDossier}
        />

        {/* Workspace Canvas */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Patient & Client Directory Roster */}
            <ConsumerRosterRail
              profiles={profiles}
              selectedProfileId={selectedProfile?.id || null}
              onSelectProfile={handleSelectProfile}
            />

            {/* Main Orchestration & Rich Cards Arena */}
            <div className="flex-1 min-w-0">
              {/* Agent Orchestrator Console */}
              <AuraCuraAgentConsole
                selectedProfile={selectedProfile}
                onRunSynthesis={async (brief) => {
                  if (selectedProfile) {
                    await fetchDossierStream(selectedProfile.id, executionMode, brief);
                  }
                }}
                isLoading={isLoading}
                traceSteps={activeTrace}
                executionMode={executionMode}
                onSelectPresetPersona={(presetId) => {
                  const found = profiles.find((p) => p.id === presetId || p.id === presetId.replace('-', '_'));
                  if (found) {
                    handleSelectProfile(found);
                  }
                }}
              />

              {/* The 4 Rich Cards Visualizer */}
              <div id="rich-cards-section">
                <RichCardsContainer
                  dossier={activeDossier}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Side-by-Side Competitive Benchmark Modal */}
      <SideBySideComparisonView
        comparison={comparisonData}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
      />

      {/* 60-Second Quick Demo Tour for Judge Wendy Yen */}
      <GuidedJudgeTour
        onSelectPatient={(patientId) => {
          const found = profiles.find((p) => p.id === patientId || p.id === patientId.replace('-', '_'));
          if (found) {
            handleSelectProfile(found);
          }
        }}
        onRunDiagnostics={async () => {
          if (selectedProfile) {
            await fetchDossierStream(selectedProfile.id, executionMode);
          }
        }}
        onOpenBenchmark={handleOpenBenchmark}
        onExportPdf={handleExportPdf}
      />

      {/* Bottom Ambient Glow Line */}
      <AmbientGlow state={glowState} />
    </div>
  );
}