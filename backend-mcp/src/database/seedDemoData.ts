import { vipDossierRepo } from './vipDossierRepo.js';
import { beautyProfileRepo } from './beautyProfileRepo.js';
import { CLINICAL_FALLBACK_PERSONAS } from '../services/clinicalSkinFallbackVault.js';
import type { VIPProfileInput, ConsumerBeautyProfile } from '../types/index.js';

/**
 * Three reference principals used for the live demo.
 * Each one is designed to exercise a different part of the agent:
 *  - Marcus: pure cross-domain inference (film → architecture → music → gifts).
 *  - Tariq: hard taboo guardrails (no alcohol, halal) with a generous budget.
 *  - Elena: tight $200 ceiling that forces the negotiator to find a value bridge.
 */
export const DEMO_VIP_PROFILES: ReadonlyArray<VIPProfileInput & { id: string }> = [
  {
    id: 'vip_marcus_vance',
    fullName: 'Marcus Vance',
    role: 'Managing Partner',
    organization: 'Halcyon Ridge Capital',
    city: 'New York',
    budgetLimitUsd: 500,
    rawBio:
      'Runs a $4B growth fund. Rewatches Christopher Nolan films on long flights — Interstellar is his favourite. ' +
      'Obsessed with Brutalist architecture (has toured the Barbican twice) and writes investment memos to Hans Zimmer and ambient records. ' +
      'Hates small talk about sports; lights up when discussing time, scale and concrete.',
    explicitInterests: ['Christopher Nolan', 'Interstellar', 'Brutalist architecture', 'Hans Zimmer', 'Ambient music'],
    taboos: { alcohol: false, dietary: [], religiousCultural: [] },
  },
  {
    id: 'vip_tariq_al_mansoor',
    fullName: 'Tariq Al-Mansoor',
    role: 'Founder & CEO',
    organization: 'Qamar Systems',
    city: 'Riyadh',
    budgetLimitUsd: 1500,
    rawBio:
      'Founded a Riyadh deep-tech company now expanding into Europe. Collects independent mechanical watchmaking — speaks fluently about ' +
      'hand-finished movements and small Swiss and Japanese ateliers. Lives by minimalist design: Dieter Rams, Japanese craft, quiet materials. ' +
      'Observant Muslim: strictly no alcohol and no pork in any form.',
    explicitInterests: ['Independent watchmaking', 'Minimalist design', 'Dieter Rams', 'Japanese craftsmanship'],
    taboos: {
      alcohol: true,
      dietary: ['halal'],
      religiousCultural: ['No pork-derived materials', 'No alcohol-themed gifts or barware'],
    },
  },
  {
    id: 'vip_elena_rostova',
    fullName: 'Elena Rostova',
    role: 'Chief Creative Officer',
    organization: 'Maison Ostra Media',
    city: 'London',
    budgetLimitUsd: 200,
    rawBio:
      'Creative director behind three fashion-week campaigns. Spent a formative year in New Orleans and still collects traditional jazz on vinyl. ' +
      'Drinks only low-intervention natural wine and follows Rei Kawakubo and Maison Margiela religiously. ' +
      'Allergic to anything that feels corporate.',
    explicitInterests: ['New Orleans jazz', 'Natural wine', 'Avant-garde fashion', 'Comme des Garçons', 'Maison Margiela'],
    taboos: { alcohol: false, dietary: ['shellfish'], religiousCultural: [] },
  },
  {
    id: 'vip_hayao_miyazaki',
    fullName: 'Hayao Miyazaki',
    role: 'Director & Co-Founder',
    organization: 'Studio Ghibli',
    city: 'Tokyo',
    budgetLimitUsd: 500,
    rawBio:
      'Legendary Japanese animation director and animator. Deep reverence for traditional Japanese craftsmanship, Shinto animism, vintage aircraft mechanics, and traditional woodblock printing. Disdains commercial fanfare, values quiet integrity and tactile hand-made artistry.',
    explicitInterests: [
      'Japanese craftsmanship',
      'Tea ceremony & ceramics',
      'Vintage aviation',
      'Traditional watercolor & ink',
      'Nature conservation',
    ],
    taboos: { alcohol: false, dietary: [], religiousCultural: [] },
  },
  {
    id: 'vip_jason_calacanis',
    fullName: 'Jason Calacanis',
    role: 'Angel Investor & Host',
    organization: 'All-In Podcast / LAUNCH',
    city: 'Silicon Valley',
    budgetLimitUsd: 1500,
    rawBio:
      'Leading Silicon Valley angel investor, co-host of the All-In Podcast and founder of LAUNCH. Passionate about early-stage startup ecosystems, precision pour-over and specialty espresso extractions, independent mechanical horology, and high-stakes poker.',
    explicitInterests: ['Specialty Espresso', 'Independent watchmaking', 'Contemporary art', 'Poker'],
    taboos: { alcohol: false, dietary: [], religiousCultural: [] },
  },
  {
    id: 'vip_mike_diolosa',
    fullName: 'Mike Diolosa',
    role: 'Chief Technology Officer',
    organization: 'Qloo Culture AI',
    city: 'New York',
    budgetLimitUsd: 500,
    rawBio:
      'Chief Technology Officer at Qloo, pioneering cultural AI and the world\'s leading latent taste graph infrastructure. Deeply immersed in modal jazz vinyl pressings, low-intervention natural wines, mid-century modern architectural design, and ambient soundscapes.',
    explicitInterests: ['Jazz vinyl', 'Natural wine', 'Mid-century modern design', 'Ambient soundscapes'],
    taboos: { alcohol: false, dietary: [], religiousCultural: [] },
  },
  {
    id: 'vip_todd_boehly',
    fullName: 'Todd Boehly',
    role: 'Chairman & CEO',
    organization: 'Eldridge / Chelsea FC & LA Dodgers',
    city: 'Los Angeles',
    budgetLimitUsd: 1500,
    rawBio:
      'Chairman and CEO of Eldridge Industries, co-owner of Premier League club Chelsea FC and MLB champions Los Angeles Dodgers. Reveres championship sports heritage, auteur contemporary cinema (A24), and collectible Premier Grand Cru Classé Bordeaux.',
    explicitInterests: ['Championship sports heritage', 'Contemporary cinema', 'A24 films', 'Fine Bordeaux'],
    taboos: { alcohol: false, dietary: [], religiousCultural: [] },
  },
  {
    id: 'vip_nicole_seligman',
    fullName: 'Nicole Seligman',
    role: 'Board Member & Former President',
    organization: 'OpenAI Board / Sony Corporation of America',
    city: 'New York',
    budgetLimitUsd: 500,
    rawBio:
      'OpenAI Board Director and former President of Sony Corporation of America. Devoted patron of classical performing arts, Lincoln Center opera, meditative Kyoto Kaiseki dining traditions, and modernist literature.',
    explicitInterests: ['Classical performing arts', 'Japanese Kaiseki', 'Modernist literature', 'Opera'],
    taboos: { alcohol: false, dietary: [], religiousCultural: [] },
  },
  {
    id: 'vip_cedric_entertainer',
    fullName: 'Cedric the Entertainer',
    role: 'Actor, Comedian & Host',
    organization: 'A Bird and a Bear Entertainment',
    city: 'St. Louis',
    budgetLimitUsd: 500,
    rawBio:
      'Acclaimed comedic titan, actor, and host. Passionate about vintage Motown and St. Louis jazz traditions, bespoke Savile Row tailoring, custom artisanal millinery & heritage hats, and civic youth philanthropy.',
    explicitInterests: ['Classic soul & jazz', 'Bespoke tailoring', 'Heritage hats', 'St. Louis philanthropy'],
    taboos: { alcohol: false, dietary: [], religiousCultural: [] },
  },
  {
    id: 'vip_michael_abrams',
    fullName: 'Michael Abrams',
    role: 'EVP of Strategy',
    organization: 'Live Nation Entertainment',
    city: 'Los Angeles',
    budgetLimitUsd: 500,
    rawBio:
      'Executive Vice President of Strategy at Live Nation Entertainment. Authority on acoustic amphitheater architecture, legendary rock and orchestral concert tour archives, rare lacquer master vinyl pressings, and high-touch VIP backstage hospitality.',
    explicitInterests: ['Live acoustic architecture', 'Backstage VIP hospitality', 'Rare vinyl pressings', 'Concert sound engineering'],
    taboos: { alcohol: false, dietary: [], religiousCultural: [] },
  },
];

/**
 * Idempotently seeds demo principals and AuraCura clinical beauty profiles.
 * Existing rows are never overwritten so edits made in the console persist.
 */
export function seedDemoData(): { inserted: number; total: number; beautyProfilesInserted: number; totalBeautyProfiles: number } {
  let inserted = 0;
  for (const profile of DEMO_VIP_PROFILES) {
    if (!vipDossierRepo.getProfile(profile.id)) {
      vipDossierRepo.upsertProfile(profile);
      inserted += 1;
    }
  }

  // Seed & sync AuraCura Clinical Beauty Profiles (Sarah Chen, Marcus Reed, Elena Gomez)
  let beautyProfilesInserted = 0;
  for (const [, pkg] of Object.entries(CLINICAL_FALLBACK_PERSONAS)) {
    const existing = beautyProfileRepo.getProfile(pkg.profile.id);
    beautyProfileRepo.upsertProfile(pkg.profile);
    if (!existing) {
      beautyProfilesInserted += 1;
    }
  }

  return {
    inserted,
    total: vipDossierRepo.listProfiles().length,
    beautyProfilesInserted,
    totalBeautyProfiles: beautyProfileRepo.listProfiles().length,
  };
}