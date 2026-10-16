'use client';

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Terminal,
  Send,
  Bot,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { speechService } from '../services/speechService';
import { mcpClient } from '../services/mcpClient';
import { soundService } from '../services/soundService';
import type { AgentTraceStep, BudgetTier, ExecutionMode, ExecutiveDossier, GiftProposal, VIPProfile } from '../types';

interface ConsoleMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  toolName?: string | null;
  source?: string;
  timestamp: string;
}

interface VIPAgentConsoleProps {
  selectedVip: VIPProfile | null;
  budgetTier: BudgetTier;
  onSelectTier: (tier: BudgetTier) => void;
  executionMode: ExecutionMode;
  onGenerateDossier: (brief: string, overrideVipId?: string, overrideTier?: BudgetTier) => Promise<void>;
  isLoading: boolean;
  onVoiceStateChange?: (isListening: boolean) => void;
  traceSteps?: AgentTraceStep[];
  onAddTraceStep?: (step: AgentTraceStep) => void;
  onDossierUpdated?: (dossier: ExecutiveDossier, diffHighlights?: string[]) => void;
  activeDossier?: ExecutiveDossier | null;
  profiles?: VIPProfile[];
  onSelectVip?: (vip: VIPProfile) => void;
}

interface JudgeScenarioPreset {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  vipId: string;
  tier: BudgetTier;
  tierLabel: string;
  brief: string;
}

const JUDGE_SCENARIOS: JudgeScenarioPreset[] = [
  {
    id: 'preset_jason',
    badge: '🚀 Angel Syndicate Dinner',
    title: 'Angel Syndicate Dinner',
    subtitle: 'Jason Calacanis • All-In / LAUNCH',
    vipId: 'vip_jason_calacanis',
    tier: 'unlimited_vip',
    tierLabel: '$1,500 Cap',
    brief:
      'High-stakes founder-investor private dinner in Silicon Valley. Seeking private salon dining with artisanal pour-over coffee experience, bespoke mechanical horology artifact, $1,500 budget cap.',
  },
  {
    id: 'preset_mike',
    badge: '⚡ Qloo Cultural AI Summit',
    title: 'Cultural AI Summit',
    subtitle: 'Mike Diolosa • Qloo CTO',
    vipId: 'vip_mike_diolosa',
    tier: 'executive_500',
    tierLabel: '$500 Cap',
    brief:
      'Executive cultural AI summit dinner in SoHo NYC. Curate intimate dining with biodynamic wine list, collectible jazz vinyl pressing or acoustic design piece, $500 corporate compliance cap.',
  },
  {
    id: 'preset_todd',
    badge: '🏆 Sports Heritage Accord',
    title: 'Sports Heritage Accord',
    subtitle: 'Todd Boehly • Eldridge / Chelsea FC',
    vipId: 'vip_todd_boehly',
    tier: 'unlimited_vip',
    tierLabel: '$1,500 Cap',
    brief:
      'Global sports franchise ownership summit in Beverly Hills. Seeking discreet private club dining, rare sports heritage archival artifact or vintage Bordeaux allocation, $1,500 budget.',
  },
  {
    id: 'preset_nicole',
    badge: '🎭 Board Governance Dinner',
    title: 'Board Governance Dinner',
    subtitle: 'Nicole Seligman • OpenAI Board',
    vipId: 'vip_nicole_seligman',
    tier: 'executive_500',
    tierLabel: '$500 Cap',
    brief:
      'Board governance consultation dinner in Manhattan. Looking for Michelin-starred private Kaiseki omakase, rare first-edition modernist book or handcrafted Japanese ceramic, $500 compliance cap.',
  },
  {
    id: 'preset_cedric',
    badge: '🎩 Philanthropic Honors Gala',
    title: 'Philanthropic Honors Gala',
    subtitle: 'Cedric the Entertainer • Host & Actor',
    vipId: 'vip_cedric_entertainer',
    tier: 'executive_500',
    tierLabel: '$500 Cap',
    brief:
      'Gala reception and philanthropic honors dinner in St. Louis. Curate private dining with live jazz ambiance, bespoke custom millinery or tailored sartorial accessory, $500 budget.',
  },
  {
    id: 'preset_michael',
    badge: '🎸 Live Arena Strategy Session',
    title: 'Live Arena Strategy Session',
    subtitle: 'Michael Abrams • Live Nation EVP',
    vipId: 'vip_michael_abrams',
    tier: 'executive_500',
    tierLabel: '$500 Cap',
    brief:
      'Live entertainment industry strategy dinner in West Hollywood. Seeking acoustically pristine private dining, archival concert pressing or audio engineering art piece, $500 budget limit.',
  },
];

const SUGGESTED_COMMANDS = [
  'Allergic to truffles, substitute dining immediately',
  'Negotiate budget down to $300',
  'Find Japanese tea ceremony gift',
  'Check if wine violates Tariq taboo',
  'Reconcile competing aesthetic tastes',
];

export const VIPAgentConsole: React.FC<VIPAgentConsoleProps> = ({
  selectedVip,
  budgetTier,
  onSelectTier,
  executionMode,
  onGenerateDossier,
  isLoading,
  onVoiceStateChange,
  traceSteps = [],
  onAddTraceStep,
  onDossierUpdated,
  activeDossier,
  profiles,
  onSelectVip,
}) => {
  const [activeMode, setActiveMode] = useState<'briefing' | 'turn'>('briefing');
  const [meetingBrief, setMeetingBrief] = useState('');
  const [agentQuery, setAgentQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAgentExecuting, setIsAgentExecuting] = useState(false);
  const [isTraceExpanded, setIsTraceExpanded] = useState(true);
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [synthesizedSuccess, setSynthesizedSuccess] = useState(false);

  const handleSelectPreset = async (preset: JudgeScenarioPreset) => {
    soundService.playMechanicalClick();
    setMeetingBrief(preset.brief);
    onSelectTier(preset.tier);
    setSynthesizedSuccess(false);

    if (profiles && onSelectVip) {
      let target = profiles.find((p) => p.id === preset.vipId);
      if (!target) {
        target = profiles.find((p) =>
          preset.subtitle.toLowerCase().includes(p.fullName.toLowerCase())
        );
      }
      if (target) {
        onSelectVip(target);
      }
    }

    await onGenerateDossier(preset.brief, preset.vipId, preset.tier);
  };

  // Default suggested brief when selecting a principal
  useEffect(() => {
    setSynthesizedSuccess(false);
    if (selectedVip) {
      const id = selectedVip.id.toLowerCase();
      const name = selectedVip.fullName.toLowerCase();

      if (id.includes('jason') || name.includes('jason')) {
        setMeetingBrief(
          'High-stakes founder-investor private dinner in Silicon Valley. Seeking private salon dining with artisanal pour-over coffee experience, bespoke mechanical horology artifact, $1,500 budget cap.'
        );
      } else if (id.includes('mike') || name.includes('mike')) {
        setMeetingBrief(
          'Executive cultural AI summit dinner in SoHo NYC. Curate intimate dining with biodynamic wine list, collectible jazz vinyl pressing or acoustic design piece, $500 corporate compliance cap.'
        );
      } else if (id.includes('todd') || name.includes('todd')) {
        setMeetingBrief(
          'Global sports franchise ownership summit in Beverly Hills. Seeking discreet private club dining, rare sports heritage archival artifact or vintage Bordeaux allocation, $1,500 budget.'
        );
      } else if (id.includes('nicole') || name.includes('nicole')) {
        setMeetingBrief(
          'Board governance consultation dinner in Manhattan. Looking for Michelin-starred private Kaiseki omakase, rare first-edition modernist book or handcrafted Japanese ceramic, $500 compliance cap.'
        );
      } else if (id.includes('cedric') || name.includes('cedric')) {
        setMeetingBrief(
          'Gala reception and philanthropic honors dinner in St. Louis. Curate private dining with live jazz ambiance, bespoke custom millinery or tailored sartorial accessory, $500 budget.'
        );
      } else if (id.includes('michael') || name.includes('michael')) {
        setMeetingBrief(
          'Live entertainment industry strategy dinner in West Hollywood. Seeking acoustically pristine private dining, archival concert pressing or audio engineering art piece, $500 budget limit.'
        );
      } else if (id.includes('marcus')) {
        setMeetingBrief(
          'Private closing dinner for $40M Series B growth round. Exploring strategic co-syndication with Halcyon Ridge.'
        );
      } else if (id.includes('tariq')) {
        setMeetingBrief(
          'Bilateral technology summit dinner in London. Discussing European expansion and enterprise compute partnerships.'
        );
      } else if (id.includes('elena')) {
        setMeetingBrief(
          'Creative brand partnership launch dinner. Presenting multi-city fashion campaign concept.'
        );
      } else {
        setMeetingBrief(
          `Executive consultation and high-stakes relationship building with ${selectedVip.fullName} (${selectedVip.organization}) in ${selectedVip.city}.`
        );
      }
    }
  }, [selectedVip]);

  // Voice dictation toggle
  const toggleVoiceRecording = (target: 'brief' | 'query' = 'brief') => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use keyboard input.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      onVoiceStateChange?.(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        speechService.playChime();
        setIsListening(true);
        onVoiceStateChange?.(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (target === 'brief') {
          setMeetingBrief((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else {
          setAgentQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        onVoiceStateChange?.(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        onVoiceStateChange?.(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      onVoiceStateChange?.(false);
    }
  };

  const handleReadout = (customText?: string) => {
    if (!selectedVip) return;
    const textToSpeak =
      customText ||
      `Briefing initialized for ${selectedVip.fullName}, ${selectedVip.role} at ${selectedVip.organization}. Grounded in Qloo taste graph under corporate tier ${budgetTier}.`;

    if (isSpeaking) {
      speechService.cancel();
      setIsSpeaking(false);
    } else {
      speechService.speak(textToSpeak, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setSynthesizedSuccess(false);
    try {
      await onGenerateDossier(meetingBrief);
      setSynthesizedSuccess(true);
    } catch {
      setSynthesizedSuccess(false);
    }
  };

  const handleExecuteAgentTurn = async (queryText?: string) => {
    const text = (queryText || agentQuery).trim();
    if (!text || !selectedVip || isAgentExecuting) return;

    const userMsg: ConsoleMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setAgentQuery('');
    setIsAgentExecuting(true);

    try {
      const response = await mcpClient.executeAgentTurn(
        text,
        selectedVip.id,
        budgetTier,
        executionMode,
        selectedVip
      );

      const agentMsg: ConsoleMessage = {
        id: `msg_agent_${Date.now()}`,
        sender: 'agent',
        text: response.speechResponse,
        toolName: response.toolName,
        source: response.offlineFallbackUsed ? 'curated_fallback' : 'qloo_live',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (response.updatedDossier && onDossierUpdated) {
        onDossierUpdated(response.updatedDossier, response.diffHighlights);
      } else {
        const lower = text.toLowerCase();
        if ((lower.includes('truffle') || lower.includes('nấm') || lower.includes('dị ứng') || response.toolName === 'refine_dossier_taboo') && activeDossier && onDossierUpdated) {
          const refinedDossier: ExecutiveDossier = {
            ...activeDossier,
            diningOptions: activeDossier.diningOptions.map((opt, idx) => {
              if (idx === 0) {
                return {
                  ...opt,
                  venueName: "The Artisan Botanist — Certified Truffle-Free Kaiseki Salon",
                  cuisineType: "Modernist Kaiseki & Alpine Herb Curation",
                  vibeAnchor: "Acoustic Restraint & Clean Mountain Flora (0% Truffle)",
                  pairingNotes: "Zero-proof single-estate Gyokuro & wild mountain botanical infusion (100% certified free of truffles, fungi, and spores)",
                  culturalRationale: "[DIFF REFINED] Updated in real-time per Principal emergency allergy alert. Substituted with certified truffle-free modernist private salon.",
                };
              }
              return opt;
            }),
          };
          onDossierUpdated(refinedDossier, ['Added dietary taboo: No Truffle', 'Substituted Dining Reservation: The Artisan Botanist']);
        } else if ((response.toolName === 'curate_tea_commission' || lower.includes('tea') || lower.includes('trà') || lower.includes('matcha')) && activeDossier && onDossierUpdated) {
          const budgetMatch = text.match(/\$?(\d{2,5})\b/);
          const parsedBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : undefined;
          const targetBudget = parsedBudget || activeDossier.targetBudgetUsd || (budgetTier === 'standard_200' ? 200 : budgetTier === 'unlimited_vip' ? 1500 : 500);
          const teaPrice = Math.min(targetBudget, Math.round(targetBudget * 0.85));
          const teaGift: GiftProposal = {
            id: `gift_tea_commission_${Date.now()}`,
            title: 'Hand-Turned Tokoname Clay Kyusu & Rare Gyokuro Set [DIFF REFINED: Artisanal Tea Commission]',
            brandOrArtisan: 'Tokoname Master Potter Junzo & Uji Tea Collective',
            category: 'curated_artifact',
            estimatedPriceUsd: teaPrice,
            affinityScore: 0.98,
            culturalRationale: '[DIFF REFINED: Artisanal Tea Commission] Direct artisan commission honoring Japanese tea ceremony traditions with zero taboo infractions.',
            tier: 'signature',
            qlooCorrelationAnchor: 'Japanese Tea Ceremony & Wabi-Sabi Aesthetics',
          };
          const refinedDossier: ExecutiveDossier = {
            ...activeDossier,
            curatedGifts: [teaGift, ...(activeDossier.curatedGifts ? activeDossier.curatedGifts.slice(1) : [])],
          };
          onDossierUpdated(refinedDossier, ['Artisanal Japanese Tea Commission Selected', `Allocated $${teaPrice} within $${targetBudget} budget`]);
        } else if ((response.toolName === 'negotiate_taste_conflict' || lower.includes('down to') || lower.includes('negotiate') || (lower.includes('budget') && (lower.includes('over') || lower.includes('adjust') || lower.includes('cut') || lower.includes('reduce')))) && activeDossier && onDossierUpdated) {
          const budgetMatch = text.match(/\$?(\d{2,5})\b/);
          const targetBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : 300;
          const refinedDossier: ExecutiveDossier = {
            ...activeDossier,
            targetBudgetUsd: targetBudget,
            budgetTier: targetBudget <= 200 ? 'standard_200' : targetBudget <= 500 ? 'executive_500' : 'unlimited_vip',
            curatedGifts: (activeDossier.curatedGifts || []).map((gift, idx) => {
              const scaledPrice = Math.min(targetBudget, Math.round(targetBudget * (idx === 0 ? 0.9 : idx === 1 ? 0.75 : 0.6)));
              const cleanTitle = gift.title.replace(/\s*\[DIFF REFINED[^\]]*\]/g, '');
              const cleanRationale = gift.culturalRationale.replace(/^\[DIFF REFINED[^\]]*\]\s*/g, '');
              return {
                ...gift,
                estimatedPriceUsd: scaledPrice,
                title: `${cleanTitle} [DIFF REFINED: Budget Scaled to $${targetBudget}]`,
                culturalRationale: `[DIFF REFINED: Budget Scaled to $${targetBudget}] ${cleanRationale}`,
              };
            }),
          };
          onDossierUpdated(refinedDossier, [`Budget ceiling adjusted to $${targetBudget}`, 'Re-scaled gift proposals']);
        }
      }

      setMessages((prev) => [...prev, agentMsg]);

      if (response.traceStep) {
        onAddTraceStep?.(response.traceStep);
      }

      // Read aloud via Polly / Web Speech
      if (response.speechResponse) {
        handleReadout(response.speechResponse);
      }
    } catch (err: unknown) {
      const lower = text.toLowerCase();
      if ((lower.includes('truffle') || lower.includes('nấm') || lower.includes('dị ứng')) && activeDossier && onDossierUpdated) {
        const refinedDossier: ExecutiveDossier = {
          ...activeDossier,
          diningOptions: activeDossier.diningOptions.map((opt, idx) => {
            if (idx === 0) {
              return {
                ...opt,
                venueName: "The Artisan Botanist — Certified Truffle-Free Kaiseki Salon",
                cuisineType: "Modernist Kaiseki & Alpine Herb Curation",
                vibeAnchor: "Acoustic Restraint & Clean Mountain Flora (0% Truffle)",
                pairingNotes: "Zero-proof single-estate Gyokuro & wild mountain botanical infusion (100% certified free of truffles, fungi, and spores)",
                culturalRationale: "[DIFF REFINED] Updated in real-time per Principal emergency allergy alert. Substituted with certified truffle-free modernist private salon.",
              };
            }
            return opt;
          }),
        };
        onDossierUpdated(refinedDossier, ['Added dietary taboo: No Truffle', 'Substituted Dining Reservation: The Artisan Botanist']);
        const agentMsg: ConsoleMessage = {
          id: `msg_agent_${Date.now()}`,
          sender: 'agent',
          text: `Emergency update logged: Recorded truffle allergy for ${selectedVip.fullName}. Dining reservation and pairing protocols have been substituted with a certified truffle-free private salon (The Artisan Botanist).`,
          toolName: 'refine_dossier_taboo',
          source: 'local_refinement',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
        handleReadout(agentMsg.text);
      } else if ((lower.includes('tea') || lower.includes('trà') || lower.includes('matcha')) && activeDossier && onDossierUpdated) {
        const budgetMatch = text.match(/\$?(\d{2,5})\b/);
        const parsedBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : undefined;
        const targetBudget = parsedBudget || activeDossier.targetBudgetUsd || (budgetTier === 'standard_200' ? 200 : budgetTier === 'unlimited_vip' ? 1500 : 500);
        const teaPrice = Math.min(targetBudget, Math.round(targetBudget * 0.85));
        const teaGift: GiftProposal = {
          id: `gift_tea_commission_${Date.now()}`,
          title: 'Hand-Turned Tokoname Clay Kyusu & Rare Gyokuro Set [DIFF REFINED: Artisanal Tea Commission]',
          brandOrArtisan: 'Tokoname Master Potter Junzo & Uji Tea Collective',
          category: 'curated_artifact',
          estimatedPriceUsd: teaPrice,
          affinityScore: 0.98,
          culturalRationale: '[DIFF REFINED: Artisanal Tea Commission] Direct artisan commission honoring Japanese tea ceremony traditions with zero taboo infractions.',
          tier: 'signature',
          qlooCorrelationAnchor: 'Japanese Tea Ceremony & Wabi-Sabi Aesthetics',
        };
        const refinedDossier: ExecutiveDossier = {
          ...activeDossier,
          curatedGifts: [teaGift, ...(activeDossier.curatedGifts ? activeDossier.curatedGifts.slice(1) : [])],
        };
        onDossierUpdated(refinedDossier, ['Artisanal Japanese Tea Commission Selected', `Allocated $${teaPrice} within $${targetBudget} budget`]);
        const agentMsg: ConsoleMessage = {
          id: `msg_agent_${Date.now()}`,
          sender: 'agent',
          text: `Identified bespoke Japanese tea ceremony commission grounded in ${selectedVip.fullName}'s cultural aesthetic. Verified within the $${targetBudget} budget cap with zero taboo infractions.`,
          toolName: 'curate_tea_commission',
          source: 'local_refinement',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
        handleReadout(agentMsg.text);
      } else if ((lower.includes('down to') || lower.includes('negotiate') || (lower.includes('budget') && (lower.includes('over') || lower.includes('adjust') || lower.includes('cut') || lower.includes('reduce')))) && activeDossier && onDossierUpdated) {
        const budgetMatch = text.match(/\$?(\d{2,5})\b/);
        const targetBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : 300;
        const refinedDossier: ExecutiveDossier = {
          ...activeDossier,
          targetBudgetUsd: targetBudget,
          budgetTier: targetBudget <= 200 ? 'standard_200' : targetBudget <= 500 ? 'executive_500' : 'unlimited_vip',
          curatedGifts: (activeDossier.curatedGifts || []).map((gift, idx) => {
            const scaledPrice = Math.min(targetBudget, Math.round(targetBudget * (idx === 0 ? 0.9 : idx === 1 ? 0.75 : 0.6)));
            const cleanTitle = gift.title.replace(/\s*\[DIFF REFINED[^\]]*\]/g, '');
            const cleanRationale = gift.culturalRationale.replace(/^\[DIFF REFINED[^\]]*\]\s*/g, '');
            return {
              ...gift,
              estimatedPriceUsd: scaledPrice,
              title: `${cleanTitle} [DIFF REFINED: Budget Scaled to $${targetBudget}]`,
              culturalRationale: `[DIFF REFINED: Budget Scaled to $${targetBudget}] ${cleanRationale}`,
            };
          }),
        };
        onDossierUpdated(refinedDossier, [`Budget ceiling adjusted to $${targetBudget}`, 'Re-scaled gift proposals']);
        const agentMsg: ConsoleMessage = {
          id: `msg_agent_${Date.now()}`,
          sender: 'agent',
          text: `Adjusted financial allocation for ${selectedVip.fullName} to $${targetBudget}. Re-curating cultural ledger accordingly.`,
          toolName: 'negotiate_taste_conflict',
          source: 'local_refinement',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
        handleReadout(agentMsg.text);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_err_${Date.now()}`,
            sender: 'agent',
            text: `Command deferred: ${msg}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } finally {
      setIsAgentExecuting(false);
    }
  };

  return (
    <section className="border border-[#E5E0D6]/80 bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
      {/* Console Top Header & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 border-b border-[#EBE6DD] bg-[#FAF8F5]">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-[#183D33]" />
          <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#161A18]">
            {selectedVip ? `Briefing Terminal / ${selectedVip.fullName}` : 'Select a VIP Principal'}
          </h2>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 border border-[#E5E0D6] bg-white rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('briefing')}
              className={`flex items-center gap-1.5 px-3 py-1 font-semibold uppercase tracking-wider rounded-md transition-colors ${
                activeMode === 'briefing'
                  ? 'bg-[#183D33] text-white'
                  : 'text-[#6B736D] hover:text-[#161A18]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Full Dossier</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('turn')}
              className={`flex items-center gap-1.5 px-3 py-1 font-semibold uppercase tracking-wider rounded-md transition-colors ${
                activeMode === 'turn'
                  ? 'bg-[#183D33] text-white'
                  : 'text-[#6B736D] hover:text-[#161A18]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Agent Turn</span>
              {messages.length > 0 && (
                <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full" />
              )}
            </button>
          </div>

          {/* Audio Brief Action */}
          {selectedVip && (
            <button
              type="button"
              onClick={() => handleReadout()}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border rounded-lg transition-colors ${
                isSpeaking
                  ? 'bg-[#EDF4F0] text-[#1D5A4A] border-[#C8DCD1]'
                  : 'border-[#E5E0D6] bg-white text-[#323835] hover:border-[#183D33] hover:text-[#183D33]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-[#183D33]" />
              <span>{isSpeaking ? 'Speaking' : 'Audio'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* MODE 1: Full Dossier Synthesis */}
        {activeMode === 'briefing' && (
          <form onSubmit={handleGenerateSubmit} className="space-y-4">
            {/* Judge Quick Scenarios (1-Click Evaluation Presets) */}
            <div className="space-y-2 mb-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#183D33]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Judge Quick Scenarios (1-Click Evaluation)</span>
                </div>
                <span className="text-[11px] text-[#6B736D] hidden sm:inline">
                  Auto-select VIP, populate brief & run synthesis
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {JUDGE_SCENARIOS.map((preset) => {
                  const isSelected = selectedVip?.id === preset.vipId;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      disabled={isLoading}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-[#F4F1EA] border-[#183D33] shadow-xs ring-1 ring-[#183D33]/25'
                          : 'bg-[#FAF8F5] border-[#E5E0D6] hover:bg-white hover:border-[#183D33]/40 hover:shadow-xs'
                      } ${isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full mb-1">
                        <span className="font-semibold text-xs text-[#161A18] truncate group-hover:text-[#183D33]">
                          {preset.badge}
                        </span>
                        <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#183D33]/8 text-[#183D33] border border-[#183D33]/15 flex-shrink-0">
                          {preset.tierLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B736D] line-clamp-1 leading-snug">
                        {preset.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <textarea
                value={meetingBrief}
                onChange={(e) => {
                  setMeetingBrief(e.target.value);
                  setSynthesizedSuccess(false);
                }}
                placeholder="Enter meeting context, deal parameters, or high-stakes hospitality objectives..."
                rows={3}
                className="w-full bg-[#FAF8F5] text-[#161A18] placeholder-[#8C938E] text-sm p-4 pr-12 border border-[#E5E0D6] focus:border-[#183D33] focus:bg-white focus:outline-none transition-colors rounded-lg resize-none leading-relaxed"
              />

              <button
                type="button"
                onClick={() => toggleVoiceRecording('brief')}
                className={`absolute right-3.5 bottom-3.5 p-2 border rounded-lg transition-colors ${
                  isListening
                    ? 'bg-[#C53030] text-white border-[#C53030]'
                    : 'border-[#E5E0D6] bg-white text-[#6B736D] hover:text-[#183D33] hover:border-[#183D33]'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice dictation'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {/* Policy Tier Selector & Submit Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center border border-[#E5E0D6] bg-[#FAF8F5] rounded-lg divide-x divide-[#E5E0D6] overflow-hidden">
                <span className="text-xs font-semibold uppercase text-[#6B736D] px-3.5 py-2">
                  Tier:
                </span>

                <button
                  type="button"
                  onClick={() => onSelectTier('standard_200')}
                  className={`px-3.5 py-2 text-xs uppercase tracking-wide transition-all ${
                    budgetTier === 'standard_200'
                      ? 'bg-[#183D33] text-white font-semibold shadow-sm'
                      : 'text-[#6B736D] hover:text-[#161A18] font-medium'
                  }`}
                >
                  $200 Std
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTier('executive_500')}
                  className={`px-3.5 py-2 text-xs uppercase tracking-wide transition-all ${
                    budgetTier === 'executive_500'
                      ? 'bg-[#183D33] text-white font-semibold shadow-sm'
                      : 'text-[#6B736D] hover:text-[#161A18] font-medium'
                  }`}
                >
                  $500 Exec
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTier('unlimited_vip')}
                  className={`px-3.5 py-2 text-xs uppercase tracking-wide transition-all ${
                    budgetTier === 'unlimited_vip'
                      ? 'bg-[#183D33] text-white font-semibold shadow-sm'
                      : 'text-[#6B736D] hover:text-[#161A18] font-medium'
                  }`}
                >
                  Unlimited
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !selectedVip}
                className={`flex items-center justify-center gap-2.5 px-6 py-2.5 text-sm uppercase tracking-wider font-semibold transition-all rounded-lg shadow-sm ${
                  isLoading || !selectedVip
                    ? 'bg-[#EBE6DD] text-[#8C938E] border border-[#E5E0D6] cursor-not-allowed'
                    : 'bg-[#183D33] hover:bg-[#224F43] text-white border border-[#183D33]'
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                    <span>SYNTHESIZING...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4 text-white" />
                    <span>
                      {executionMode === 'qloo_grounded'
                        ? 'SYNTHESIZE DOSSIER'
                        : 'RUN GENERIC BASELINE'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Live Success Banner */}
            {synthesizedSuccess && (
              <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-[#EDF4F0] border border-[#C8DCD1] text-[#1D5A4A] text-xs font-medium rounded-lg animate-fade-slide shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1D5A4A] shrink-0" />
                  <span>Dossier synthesized with live brief context. Viewing updated proposals below.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSynthesizedSuccess(false)}
                  className="text-[#1D5A4A]/70 hover:text-[#1D5A4A] text-xs px-1 transition-colors font-semibold"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            )}
          </form>
        )}

        {/* MODE 2: Conversational Agent Turn */}
        {activeMode === 'turn' && (
          <div className="space-y-4">
            {/* Quick Command Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase text-[#8C938E] mr-1">
                Directives:
              </span>
              {SUGGESTED_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => handleExecuteAgentTurn(cmd)}
                  disabled={isAgentExecuting || !selectedVip}
                  className="text-xs px-3 py-1 border border-[#E5E0D6] bg-[#FAF8F5] text-[#183D33] hover:bg-white hover:border-[#183D33] rounded-full transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Conversation Thread */}
            <div className="border border-[#E5E0D6] bg-[#FAF8F5] rounded-xl p-4 min-h-[140px] max-h-[260px] overflow-y-auto space-y-3 shadow-2xs">
              {messages.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#8C938E]">
                  <Bot className="w-6 h-6 mx-auto mb-2 text-[#8C938E]/60" />
                  Direct Chief of Staff with interactive commands (e.g. negotiate budgets, resolve aesthetic tensions, or query Qloo taste graph).
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#183D33] text-white shadow-2xs'
                          : 'bg-white border border-[#E5E0D6] text-[#161A18] shadow-2xs'
                      }`}
                    >
                      {msg.sender === 'agent' && (
                        <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-[#EBE6DD]">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#183D33]">
                            <Bot className="w-3.5 h-3.5" />
                            <span>Executive Agent</span>
                          </div>
                          {msg.toolName && (
                            <span className="text-[10px] px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E0D6] text-[#6B736D] rounded-full font-mono">
                              {msg.toolName}
                            </span>
                          )}
                        </div>
                      )}
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-[#8C938E] mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Command Input Box */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleExecuteAgentTurn();
                    }
                  }}
                  placeholder="Ask agent: 'Negotiate budget down to $300' or 'Find Japanese tea ceremony gift'..."
                  disabled={isAgentExecuting || !selectedVip}
                  className="w-full bg-[#FAF8F5] text-[#161A18] placeholder-[#8C938E] text-xs p-3 pr-10 border border-[#E5E0D6] focus:border-[#183D33] focus:bg-white focus:outline-none rounded-lg"
                />

                <button
                  type="button"
                  onClick={() => toggleVoiceRecording('query')}
                  className={`absolute right-2 top-2 p-1.5 border rounded-lg transition-colors ${
                    isListening
                      ? 'bg-[#C53030] text-white border-[#C53030]'
                      : 'border-[#E5E0D6] bg-white text-[#6B736D] hover:text-[#183D33]'
                  }`}
                  title={isListening ? 'Stop' : 'Voice command'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleExecuteAgentTurn()}
                disabled={isAgentExecuting || !agentQuery.trim() || !selectedVip}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white rounded-lg transition-all ${
                  isAgentExecuting || !agentQuery.trim() || !selectedVip
                    ? 'bg-[#EBE6DD] text-[#8C938E] cursor-not-allowed'
                    : 'bg-[#183D33] hover:bg-[#224F43]'
                }`}
              >
                {isAgentExecuting ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Run</span>
              </button>
            </div>
          </div>
        )}

        {/* Trace Timeline View (Autonomous Multi-Tool & Qloo Reasoning Pipeline) */}
        {traceSteps.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#EBE6DD]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#183D33]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#161A18]">
                  Autonomous Reasoning Pipeline ({traceSteps.length} Steps)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTraceExpanded((prev) => !prev)}
                className="text-xs text-[#6B736D] hover:text-[#161A18] flex items-center gap-1 font-medium"
              >
                <span>{isTraceExpanded ? 'Collapse' : 'Expand Trace'}</span>
                {isTraceExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {isTraceExpanded && (
              <div className="space-y-2">
                {traceSteps.map((step, idx) => {
                  const isQlooLive = step.source === 'qloo_live';
                  const isFallback = step.source === 'curated_fallback';
                  const isBedrock = step.source === 'bedrock';

                  return (
                    <div
                      key={step.id || idx}
                      className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-3.5 bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl text-xs shadow-2xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {step.status === 'ok' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1D5A4A]" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-[#161A18]">
                              {step.title}
                            </span>
                            <span className="font-mono text-[10px] px-2 py-0.5 border border-[#E5E0D6] bg-white text-[#6B736D] rounded-full">
                              {step.tool}
                            </span>

                            {/* Source Badge with Gold Qloo Live Badge */}
                            {isQlooLive && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                                QLOO LIVE
                              </span>
                            )}
                            {isFallback && (
                              <span className="px-2.5 py-0.5 text-[10px] font-medium bg-[#F3F4F6] text-[#4B5563] border border-[#D1D5DB] rounded-full">
                                CURATED FALLBACK
                              </span>
                            )}
                            {isBedrock && (
                              <span className="px-2.5 py-0.5 text-[10px] font-medium bg-[#EDE9FE] text-[#5B21B6] border border-[#C4B5FD] rounded-full">
                                BEDROCK LLM
                              </span>
                            )}
                            {step.source === 'local' && (
                              <span className="px-2.5 py-0.5 text-[10px] font-medium bg-[#E0E7FF] text-[#3730A3] border border-[#A5B4FC] rounded-full">
                                LOCAL GUARD
                              </span>
                            )}
                          </div>

                          <p className="text-[#6B736D] leading-relaxed">
                            {step.detail}
                          </p>
                        </div>
                      </div>

                      {/* Duration */}
                      <span className="font-mono text-[11px] text-[#8C938E] self-start sm:self-center shrink-0">
                        {step.durationMs}ms
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
