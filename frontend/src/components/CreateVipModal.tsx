'use client';

import React, { useState } from 'react';
import { X, UserPlus, Compass, Plus, Check, Zap, Sparkles } from 'lucide-react';
import { soundService } from '../services/soundService';
import type { VIPProfileInput } from '../types';

interface CreateVipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newVip: VIPProfileInput) => Promise<void>;
  isLoading?: boolean;
}

interface PresetProfile {
  chipLabel: string;
  fullName: string;
  role: string;
  organization: string;
  city: string;
  passions: string[];
  noAlcohol: boolean;
  dietaryTaboos: string[];
  budget: 200 | 500 | 1500 | number;
  bio: string;
}

const PRESET_PROFILES: PresetProfile[] = [
  {
    chipLabel: '⚡ Jason Calacanis (All-In)',
    fullName: 'Jason Calacanis',
    role: 'Angel Investor & Host',
    organization: 'All-In Podcast / LAUNCH',
    city: 'Silicon Valley',
    passions: ['Specialty Espresso', 'Independent watchmaking', 'Contemporary art', 'Poker'],
    noAlcohol: false,
    dietaryTaboos: [],
    budget: 1500,
    bio: 'Silicon Valley angel investor, host of All-In Podcast & founder of LAUNCH. Passionate about startup ecosystems, artisanal espresso extractions, independent horology, and high-stakes poker.',
  },
  {
    chipLabel: '⚡ Mike Diolosa (Qloo CTO)',
    fullName: 'Mike Diolosa',
    role: 'Chief Technology Officer',
    organization: 'Qloo Culture AI',
    city: 'New York',
    passions: ['Jazz vinyl', 'Natural wine', 'Mid-century modern design', 'Ambient soundscapes'],
    noAlcohol: false,
    dietaryTaboos: [],
    budget: 500,
    bio: 'CTO at Qloo leading latent taste graph infrastructure and cultural vector AI. Passionate about modal jazz on vinyl, low-intervention natural wines, and modernist furniture.',
  },
  {
    chipLabel: '⚡ Todd Boehly (Eldridge/Chelsea)',
    fullName: 'Todd Boehly',
    role: 'Chairman & CEO',
    organization: 'Eldridge / Chelsea FC & LA Dodgers',
    city: 'Los Angeles',
    passions: ['Championship sports heritage', 'Contemporary cinema', 'A24 films', 'Fine Bordeaux'],
    noAlcohol: false,
    dietaryTaboos: [],
    budget: 1500,
    bio: 'Chairman and CEO of Eldridge Industries, co-owner of Chelsea FC and the Los Angeles Dodgers. Passionate about championship sports legacy, cinematic arts, and Premier Grand Cru Classé Bordeaux.',
  },
  {
    chipLabel: '⚡ Nicole Seligman (OpenAI/Sony)',
    fullName: 'Nicole Seligman',
    role: 'Board Member & Former President',
    organization: 'OpenAI Board / Sony Corporation of America',
    city: 'New York',
    passions: ['Classical performing arts', 'Japanese Kaiseki', 'Modernist literature', 'Opera'],
    noAlcohol: false,
    dietaryTaboos: [],
    budget: 500,
    bio: 'OpenAI Board Director and former President of Sony Corporation of America. Passionate about Lincoln Center opera and philharmonic performances, traditional Kyoto Kaiseki culinary artistry, and 20th-century literature.',
  },
  {
    chipLabel: '⚡ Cedric the Entertainer',
    fullName: 'Cedric the Entertainer',
    role: 'Actor, Comedian & Host',
    organization: 'A Bird and a Bear Entertainment',
    city: 'St. Louis',
    passions: ['Classic soul & jazz', 'Bespoke tailoring', 'Heritage hats', 'St. Louis philanthropy'],
    noAlcohol: false,
    dietaryTaboos: [],
    budget: 500,
    bio: 'Celebrated entertainer, actor, and host. Passionate about classic Motown and St. Louis jazz traditions, custom sartorial suiting and artisanal fedoras, and community philanthropy.',
  },
  {
    chipLabel: '⚡ Michael Abrams (Live Nation)',
    fullName: 'Michael Abrams',
    role: 'EVP of Strategy',
    organization: 'Live Nation Entertainment',
    city: 'Los Angeles',
    passions: ['Live acoustic architecture', 'Backstage VIP hospitality', 'Rare vinyl pressings', 'Concert sound engineering'],
    noAlcohol: false,
    dietaryTaboos: [],
    budget: 500,
    bio: 'EVP of Strategy at Live Nation Entertainment. Passionate about world-class acoustic venue architecture, legendary concert archives, rare first-run vinyl masters, and exclusive hospitality protocols.',
  },
];

const SUGGESTED_PASSIONS = [
  'Jazz',
  'Vinyl records',
  'Scandinavian design',
  'Specialty Espresso',
  'Modernist architecture',
  'Mechanical watches',
  'Contemporary art',
  'Natural wine',
  'Japanese ceramics',
  'Rare books',
];

export const CreateVipModal: React.FC<CreateVipModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [city, setCity] = useState('');
  const [budgetTierChoice, setBudgetTierChoice] = useState<'200' | '500' | '1500' | 'custom'>('500');
  const [customBudget, setCustomBudget] = useState('750');
  const [passions, setPassions] = useState<string[]>(['Specialty Espresso', 'Scandinavian design']);
  const [newPassionInput, setNewPassionInput] = useState('');
  const [noAlcohol, setNoAlcohol] = useState(false);
  const [dietaryTaboos, setDietaryTaboos] = useState<string[]>([]);
  const [rawBio, setRawBio] = useState('');

  if (!isOpen) return null;

  const handleAddPassion = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !passions.includes(trimmed)) {
      setPassions((prev) => [...prev, trimmed]);
    }
    setNewPassionInput('');
  };

  const handleRemovePassion = (tag: string) => {
    setPassions((prev) => prev.filter((p) => p !== tag));
  };

  const toggleDietary = (taboo: string) => {
    setDietaryTaboos((prev) =>
      prev.includes(taboo) ? prev.filter((t) => t !== taboo) : [...prev, taboo]
    );
  };

  const applyPreset = (preset: PresetProfile) => {
    soundService.playMechanicalClick();
    setFullName(preset.fullName);
    setRole(preset.role);
    setOrganization(preset.organization);
    setCity(preset.city);
    setPassions([...preset.passions]);
    setNoAlcohol(preset.noAlcohol);
    setDietaryTaboos([...preset.dietaryTaboos]);
    setRawBio(preset.bio);
    if (preset.budget === 200 || preset.budget === 500 || preset.budget === 1500) {
      setBudgetTierChoice(String(preset.budget) as '200' | '500' | '1500');
    } else {
      setBudgetTierChoice('custom');
      setCustomBudget(String(preset.budget));
    }
  };

  const handleRandomFill = () => {
    soundService.playMechanicalClick();
    const randomIndex = Math.floor(Math.random() * PRESET_PROFILES.length);
    applyPreset(PRESET_PROFILES[randomIndex]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || isLoading) return;

    const budgetLimitUsd =
      budgetTierChoice === '200'
        ? 200
        : budgetTierChoice === '500'
          ? 500
          : budgetTierChoice === '1500'
            ? 1500
            : parseInt(customBudget, 10) || 500;

    const newProfile: VIPProfileInput = {
      fullName: fullName.trim(),
      role: role.trim() || 'Principal & Executive',
      organization: organization.trim() || 'Global Enterprise',
      city: city.trim() || 'New York',
      budgetLimitUsd,
      rawBio:
        rawBio.trim() ||
        `${fullName.trim()} is a distinguished principal based in ${city || 'the city'}, passionate about ${passions.join(', ') || 'bespoke cultural artifacts'}.`,
      explicitInterests: passions.length > 0 ? passions : ['Artisanal Craft', 'Minimalist Design'],
      taboos: {
        alcohol: noAlcohol,
        dietary: dietaryTaboos,
        religiousCultural: noAlcohol ? ['No alcohol or barware'] : [],
      },
    };

    await onSubmit(newProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#FAF8F5] border border-[#E5E0D6]/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBE6DD] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#183D33]/10 flex items-center justify-center text-[#183D33]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-[#161A18]">
                Custom VIP Profile Builder
              </h3>
              <p className="text-xs text-[#6B736D]">
                Test live Qloo grounding with your personal identity or customized principal specs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#6B736D] hover:text-[#161A18] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Judge Presets Quick-Select */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-b border-[#EBE6DD]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#183D33] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#967432]" />
              1-Click Evaluation Presets
            </span>
            <span className="text-[10px] text-[#6B736D]">
              Click to autofill executive parameters
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROFILES.map((preset) => (
              <button
                key={preset.fullName}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#D5CEBF] bg-white text-[#161A18] hover:border-[#183D33] hover:bg-[#183D33] hover:text-white transition-all font-medium shadow-2xs flex items-center gap-1 active:scale-95"
              >
                <span>{preset.chipLabel}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={handleRandomFill}
              className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-[#967432] bg-[#FAF8F5] text-[#967432] hover:bg-[#967432] hover:text-white transition-all font-medium flex items-center gap-1.5 active:scale-95"
            >
              <span>🎲 Random Fill</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Principal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#323835] mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Mike Diolosa"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E5E0D6] rounded-lg focus:border-[#183D33] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#323835] mb-1.5">
                Executive Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. CTO & Head of Product"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E5E0D6] rounded-lg focus:border-[#183D33] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#323835] mb-1.5">
                Organization
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Qloo / Strategic Partner"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E5E0D6] rounded-lg focus:border-[#183D33] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#323835] mb-1.5">
                Primary City / Location
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New York, London, Tokyo, Riyadh"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E5E0D6] rounded-lg focus:border-[#183D33] focus:outline-none"
              />
            </div>
          </div>

          {/* Cultural Passions & Seeds */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#323835] mb-1.5">
              Explicit Cultural Passions (Tags / Taste Seeds)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPassionInput}
                onChange={(e) => setNewPassionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPassion(newPassionInput);
                  }
                }}
                placeholder="Type a passion (e.g. Scandinavian design) and press Enter"
                className="flex-1 px-3.5 py-2 text-sm bg-white border border-[#E5E0D6] rounded-lg focus:border-[#183D33] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddPassion(newPassionInput)}
                className="px-3.5 py-2 text-xs font-semibold uppercase bg-[#FAF8F5] border border-[#E5E0D6] text-[#183D33] hover:bg-white rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Active Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[28px]">
              {passions.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-white border border-[#183D33]/30 text-[#183D33] rounded-full shadow-2xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemovePassion(tag)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] text-[#8C938E] self-center mr-1">Suggestions:</span>
              {SUGGESTED_PASSIONS.filter((s) => !passions.includes(s)).slice(0, 6).map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => handleAddPassion(suggested)}
                  className="text-[11px] px-2.5 py-0.5 border border-dashed border-[#C8DCD1] text-[#1D5A4A] hover:bg-[#EDF4F0] rounded-full transition-colors"
                >
                  + {suggested}
                </button>
              ))}
            </div>
          </div>

          {/* Religious & Dietary Taboos */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#323835] mb-2">
              Ethical, Religious & Dietary Taboos
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <label className="flex items-center gap-2 p-2.5 bg-white border border-[#E5E0D6] rounded-lg cursor-pointer hover:border-[#183D33] transition-colors">
                <input
                  type="checkbox"
                  checked={noAlcohol}
                  onChange={(e) => setNoAlcohol(e.target.checked)}
                  className="rounded text-[#183D33] focus:ring-[#183D33]"
                />
                <span className="text-xs font-medium text-[#161A18]">No Alcohol (Strict)</span>
              </label>

              {['halal', 'kosher', 'shellfish', 'vegan', 'gluten-free'].map((taboo) => (
                <label
                  key={taboo}
                  className="flex items-center gap-2 p-2.5 bg-white border border-[#E5E0D6] rounded-lg cursor-pointer hover:border-[#183D33] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={dietaryTaboos.includes(taboo)}
                    onChange={() => toggleDietary(taboo)}
                    className="rounded text-[#183D33] focus:ring-[#183D33]"
                  />
                  <span className="text-xs font-medium text-[#161A18] capitalize">
                    {taboo === 'shellfish' ? 'Shellfish Allergy' : taboo}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Corporate Policy Limit */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#323835] mb-2">
              Corporate Gifting Policy Ceiling
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: '200', label: '$200 Std' },
                { id: '500', label: '$500 Exec' },
                { id: '1500', label: '$1,500 VIP' },
                { id: 'custom', label: 'Custom' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBudgetTierChoice(opt.id as any)}
                  className={`py-2 text-xs font-semibold uppercase tracking-wider border rounded-lg transition-all ${
                    budgetTierChoice === opt.id
                      ? 'bg-[#183D33] text-white border-[#183D33]'
                      : 'bg-white text-[#6B736D] border-[#E5E0D6] hover:border-[#183D33]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {budgetTierChoice === 'custom' && (
              <div className="mt-2.5">
                <input
                  type="number"
                  value={customBudget}
                  onChange={(e) => setCustomBudget(e.target.value)}
                  placeholder="Enter custom budget cap in USD"
                  min="50"
                  max="10000"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#E5E0D6] rounded-lg focus:border-[#183D33] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Bio / Strategic Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#323835] mb-1.5">
              Personal Bio / Sensibility Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={rawBio}
              onChange={(e) => setRawBio(e.target.value)}
              placeholder="Notable personality traits, aesthetics, or communication style..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#E5E0D6] rounded-lg focus:border-[#183D33] focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE6DD]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6B736D] hover:text-[#161A18] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || !fullName.trim()}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white rounded-lg shadow-sm transition-all ${
                isLoading || !fullName.trim()
                  ? 'bg-[#8C938E] cursor-not-allowed'
                  : 'bg-[#183D33] hover:bg-[#224F43]'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                  <span>CREATING & GROUNDING...</span>
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5" />
                  <span>Save & Generate Cultural Dossier</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
