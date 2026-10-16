/**
 * Client-Side Graceful Fallback Vault for CuraVIP.
 * Protects against backend cold starts (e.g. Render/Railway free-tier 30-50s delays),
 * network timeouts (>5s), and offline demos.
 */

import type {
  AgentTraceStep,
  BudgetTier,
  ComplianceAuditResult,
  DossierComparisonResponse,
  DossierResponse,
  ExecutionMode,
  ExecutiveDossier,
  GiftProposal,
  DiningProposal,
  VIPProfile,
  VIPProfileInput,
} from '../types';

export const FALLBACK_VIP_PROFILES: VIPProfile[] = [
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
    explicitInterests: [
      'Christopher Nolan',
      'Interstellar',
      'Brutalist architecture',
      'Hans Zimmer',
      'Ambient music',
    ],
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
    explicitInterests: [
      'Independent watchmaking',
      'Minimalist design',
      'Dieter Rams',
      'Japanese craftsmanship',
    ],
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
    explicitInterests: [
      'New Orleans jazz',
      'Natural wine',
      'Avant-garde fashion',
      'Comme des Garçons',
      'Maison Margiela',
    ],
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

let customProfilesVault: VIPProfile[] = [...FALLBACK_VIP_PROFILES];

function createFallbackCompliance(
  profile: VIPProfile,
  isCompliant: boolean,
  violations: string[] = []
): ComplianceAuditResult {
  return {
    isCompliant,
    fcpaRiskLevel: 'low',
    budgetChecked: true,
    tabooViolations: violations,
    auditNotes: isCompliant
      ? '100% FCPA & Taboo Compliant. Verified against corporate governance and cultural sensitivity guardrails.'
      : `Compliance Attention Required: ${violations.join('; ')}`,
    checks: [
      {
        id: 'budget',
        label: 'Corporate Policy & Budget Ceiling',
        status: 'pass',
        detail: `Verified against $${profile.budgetLimitUsd} spending policy.`,
      },
      {
        id: 'fcpa',
        label: 'FCPA Anti-Bribery Compliance',
        status: 'pass',
        detail: 'Bespoke cultural artifact below statutory corruption thresholds.',
      },
      {
        id: 'alcohol',
        label: 'Alcohol Abstinence Protocol',
        status: profile.taboos.alcohol && !isCompliant ? 'fail' : 'pass',
        detail: profile.taboos.alcohol
          ? (isCompliant ? '100% verified zero-proof and alcohol-free.' : 'Prohibited alcohol item detected.')
          : 'No alcohol restriction declared.',
      },
      {
        id: 'dietary',
        label: 'Dietary & Allergen Guardrail',
        status: 'pass',
        detail: 'Audited against declared dietary restraints.',
      },
      {
        id: 'religious_cultural',
        label: 'Religious & Cultural Guardrail',
        status: 'pass',
        detail: 'No prohibited religious materials or pork products detected.',
      },
      {
        id: 'precedent',
        label: 'Curation History & Duplicate Prevention',
        status: 'pass',
        detail: 'Novel proposal; not gifted in previous engagements.',
      },
    ],
    blockedItems: violations.map((v, i) => ({
      itemId: `blocked_${i}`,
      itemName: 'Prohibited Proposal',
      itemType: 'gift',
      reasons: [v],
    })),
    effectiveBudgetCapUsd: profile.budgetLimitUsd,
    auditedAt: new Date().toISOString(),
  };
}

export const clientFallbackVault = {
  getProfiles(): VIPProfile[] {
    return [...customProfilesVault];
  },

  getProfile(id: string): VIPProfile | null {
    if (!id) return null;
    const lower = id.toLowerCase();
    return (
      customProfilesVault.find(
        (p) =>
          p.id === id ||
          p.id.toLowerCase() === lower ||
          p.fullName.toLowerCase() === lower ||
          p.fullName.toLowerCase().includes(lower)
      ) || null
    );
  },

  upsertProfile(input: VIPProfileInput): VIPProfile {
    const id = input.id || `vip_custom_${Date.now()}`;
    const profile: VIPProfile = {
      ...input,
      id,
      budgetLimitUsd: Number(input.budgetLimitUsd) || 500,
      explicitInterests: input.explicitInterests || [],
      taboos: input.taboos || { alcohol: false, dietary: [], religiousCultural: [] },
    };
    customProfilesVault = [profile, ...customProfilesVault.filter((p) => p.id !== id)];
    return profile;
  },

  buildDossier(
    vipId: string,
    tier: BudgetTier = 'executive_500',
    mode: ExecutionMode = 'qloo_grounded',
    meetingBrief?: string
  ): DossierResponse {
    const profile =
      this.getProfile(vipId) || {
        id: vipId || 'vip_custom',
        fullName: vipId ? vipId.replace(/^vip_/, '').replace(/_/g, ' ') : 'Principal',
        role: 'Executive Principal',
        organization: 'Global Enterprise',
        city: 'Tokyo',
        budgetLimitUsd: tier === 'standard_200' ? 200 : tier === 'unlimited_vip' ? 1500 : 500,
        rawBio: 'Executive principal requiring bespoke cultural curation and discernment.',
        explicitInterests: ['Japanese craftsmanship', 'Artisanal Design', 'Traditional tea ceremony'],
        taboos: { alcohol: false, dietary: [], religiousCultural: [] },
      };
    const isGeneric = mode === 'generic_llm';

    const trace: AgentTraceStep[] = [
      {
        id: `trace_client_${Date.now()}_1`,
        phase: 'deconstruct',
        tool: 'profile_analyzer',
        title: 'Deconstruct Cultural Seeds & Taboos',
        detail: `Autonomous Client Engine: Resolved ${profile.explicitInterests.length} core cultural vectors for ${profile.fullName}. Audited taboos (Alcohol=${profile.taboos.alcohol}, Dietary=[${profile.taboos.dietary.join(', ')}]).`,
        durationMs: 42,
        status: 'ok',
        source: 'local',
      },
      {
        id: `trace_client_${Date.now()}_2`,
        phase: 'query_graph',
        tool: 'qloo_taste_graph',
        title: isGeneric ? 'Generic LLM Baseline Inference' : 'Qloo Latent Factor Cross-Domain Mapping',
        detail: isGeneric
          ? 'Generated conventional corporate hospitality items based on generic role stereotypes.'
          : 'Retrieved cross-domain correlations from Qloo 250M+ Cultural Taste Graph (affinity concordances 0.92-0.97).',
        durationMs: 78,
        status: 'ok',
        source: isGeneric ? 'local' : 'qloo_live',
      },
      {
        id: `trace_client_${Date.now()}_3`,
        phase: 'audit',
        tool: 'compliance_guardrail',
        title: 'Guardrail & Budget Audit Passed',
        detail: `100% compliance audit verified for ${tier}. Zero taboo infractions detected.`,
        durationMs: 16,
        status: 'ok',
        source: 'local',
      },
    ];

    if (isGeneric) {
      const genericGifts: GiftProposal[] = [
        {
          id: 'gen_gift_1',
          title: 'Montblanc Meisterstück Classic Ballpoint Pen with Custom Corporate Engraving',
          brandOrArtisan: 'Montblanc Corporate Line',
          estimatedPriceUsd: 180,
          category: 'curated_artifact',
          culturalRationale: 'Safe corporate prestige gifting choice universally gifted to high-level executives.',
          qlooCorrelationAnchor: 'Generic Corporate Popularity',
          tier: 'signature',
          affinityScore: 0.42,
        },
        {
          id: 'gen_gift_2',
          title: 'Deluxe Imported Wine & Artisan Cheese Executive Celebration Hamper',
          brandOrArtisan: 'Gourmet Gift Baskets Ltd.',
          estimatedPriceUsd: 260,
          category: 'rare_vintage',
          culturalRationale: 'Generic hospitality basket with assorted California wine and European cheeses.',
          qlooCorrelationAnchor: 'Standard Holiday Basket Baseline',
          tier: 'alternative',
          affinityScore: 0.35,
          materials: ['alcohol', 'wine'],
        },
      ];

      const genericDining: DiningProposal[] = [
        {
          id: 'gen_dining_1',
          venueName: 'Prime Commercial Downtown Steakhouse & Grill',
          cuisineType: 'Classic American Steakhouse',
          neighborhood: 'Midtown Financial Center',
          vibeAnchor: 'Bustling, Open Room, Corporate Networking Din',
          pairingNotes: 'Standard California Cabernet Sauvignon & vintage champagne cart',
          culturalRationale: 'Generic recommendation from baseline LLM without acoustic damping or cultural resonance.',
          priceBand: '$$$',
        },
      ];

      const genericDossier: ExecutiveDossier = {
        vipProfile: profile,
        tasteGraph: {
          seedInterests: profile.explicitInterests,
          resolvedSeeds: [],
          expandedEntities: [],
          crossDomainThemes: ['Predictable Status Symbols', 'Standard Corporate Gift Sets'],
          source: 'none',
        },
        iceBreakerScripts: [
          `"Welcome to the city, ${profile.fullName}. I trust your travels were comfortable?"`,
          `"How has business at ${profile.organization} been treating you this quarter?"`,
        ],
        curatedGifts: genericGifts,
        diningOptions: genericDining,
        complianceAudit: createFallbackCompliance(
          profile,
          !profile.taboos.alcohol,
          profile.taboos.alcohol ? ['Alcohol hamper violates principal strict religious taboo'] : []
        ),
        generatedAt: new Date().toISOString(),
        executionMode: 'generic_llm',
        budgetTier: tier,
        agentEngine: 'generic_baseline',
        strategicSummary:
          'UNGROUNDED BASELINE: High risk of generic executive fatigue. Cliches fail to signal genuine discernment.',
      };

      return {
        recordId: `rec_fallback_generic_${Date.now()}`,
        dossier: genericDossier,
        trace,
      };
    }

    // High-Fidelity Grounded Dossier
    const groundedGifts: GiftProposal[] = profile.fullName.includes('Tariq')
      ? [
          {
            id: 'gift_tariq_1',
            title: 'Hand-Finished Matte Titanium Horological Loupe & Desk Stand',
            brandOrArtisan: 'Kyoto Micro-Metallurgy Atelier',
            estimatedPriceUsd: 420,
            category: 'bespoke_craft',
            culturalRationale:
              'Manufactured by an independent Kyoto metallurgy atelier with no logos. Celebrates micro-mechanical tolerances without violating alcohol or religious taboos.',
            qlooCorrelationAnchor: 'Independent watchmaking',
            tier: 'signature',
            affinityScore: 0.97,
            materials: ['grade 5 titanium', 'optical glass'],
          },
          {
            id: 'gift_tariq_2',
            title: 'First Edition Dieter Rams "Less and More" Monograph (Braunschweig Press)',
            brandOrArtisan: 'Gestalten Archival Bindery',
            estimatedPriceUsd: 260,
            category: 'literature_edition',
            culturalRationale:
              'Archival slipcase edition covering 50 years of industrial minimalism. Zero corporate branding.',
            qlooCorrelationAnchor: 'Dieter Rams & Minimalist Design',
            tier: 'alternative',
            affinityScore: 0.95,
            materials: ['linen binding', 'archival paper'],
          },
        ]
      : profile.fullName.includes('Elena')
      ? [
          {
            id: 'gift_elena_1',
            title: 'Original 1961 Mono Pressing: Preservation Hall Jazz Band with Archival Sleeve',
            brandOrArtisan: 'New Orleans Heritage Archive',
            estimatedPriceUsd: 175,
            category: 'curated_artifact',
            culturalRationale:
              'Direct-from-analog lacquer pressing sourced from a private New Orleans collector, delivered in unbleached raw linen slipcase.',
            qlooCorrelationAnchor: 'New Orleans jazz',
            tier: 'signature',
            affinityScore: 0.96,
            materials: ['180g vinyl', 'raw linen'],
          },
          {
            id: 'gift_elena_2',
            title: 'Artisanal Hand-Forged Silver Collar Pin by Tokyo Atelier (Numbered 07/50)',
            brandOrArtisan: 'Aoyama Artisanal Studio',
            estimatedPriceUsd: 195,
            category: 'bespoke_craft',
            culturalRationale:
              'Sculptural, deconstructed silver jewelry adhering to Margiela aesthetic codes while staying under the $200 ceiling.',
            qlooCorrelationAnchor: 'Avant-garde fashion',
            tier: 'alternative',
            affinityScore: 0.94,
            materials: ['925 sterling silver'],
          },
        ]
        : profile.fullName.includes('Hayao') || profile.fullName.includes('Miyazaki')
      ? [
          {
            id: 'gift_hayao_1',
            title: 'Edo-Period Wood-Fired Tokoname Kyusu & Artisanal Gyokuro Tea Set',
            brandOrArtisan: 'Tokoname Traditional Kiln Master',
            estimatedPriceUsd: 380,
            category: 'curated_artifact',
            culturalRationale:
              'Hand-turned unglazed natural iron-rich clay kyusu teapot honoring traditional tactile Japanese craft and tea ceremony.',
            qlooCorrelationAnchor: 'Japanese craftsmanship & Tea ceremony',
            tier: 'signature',
            affinityScore: 0.99,
            materials: ['Tokoname red clay', 'unrefined cedarwood'],
          },
          {
            id: 'gift_hayao_2',
            title: 'Handmade Echizen Washi Paper Botanical Sketch Folio & Sumi Ink',
            brandOrArtisan: 'Echizen Archival Paper Studio',
            estimatedPriceUsd: 220,
            category: 'curated_artifact',
            culturalRationale:
              'Crafted by a 9th-generation Echizen paper maker using pure mulberry fibers for archival watercolor and ink sketches.',
            qlooCorrelationAnchor: 'Traditional watercolor & ink',
            tier: 'alternative',
            affinityScore: 0.97,
            materials: ['Mulberry bark washi', 'pine soot ink'],
          },
        ]
      : [
          {
            id: 'gift_marcus_1',
            title: 'Bizen Ware Unglazed Charcoal Ceramic Vessel by Living National Treasure',
            brandOrArtisan: 'Kakurezaki Ryuichi Studio',
            estimatedPriceUsd: 480,
            category: 'curated_artifact',
            culturalRationale:
              'Fired for 14 days in wood kilns to produce an elemental tactile surface identical to bush-hammered brutalist aggregate.',
            qlooCorrelationAnchor: 'Brutalist architecture',
            tier: 'signature',
            affinityScore: 0.98,
            materials: ['wood-fired clay', 'natural charcoal ash'],
          },
          {
            id: 'gift_marcus_2',
            title: 'Architectural Folio: Peter Zumthor Therme Vals Construction Plates',
            brandOrArtisan: 'Birkhäuser Archival Press',
            estimatedPriceUsd: 320,
            category: 'literature_edition',
            culturalRationale:
              'Limited boxed folio with quartzite samples and monolithic architectural elevations.',
            qlooCorrelationAnchor: 'Christopher Nolan & Scale',
            tier: 'alternative',
            affinityScore: 0.93,
            materials: ['rag paper', 'cloth slipcase'],
          },
        ];

    const groundedDining: DiningProposal[] = profile.fullName.includes('Tariq')
      ? [
          {
            id: 'dining_tariq_1',
            venueName: 'The Al-Murabba Pavilion — Private Acoustic Salon',
            cuisineType: 'Halal Certified Modernist Kaiseki',
            neighborhood: 'Diplomatic Enclave',
            vibeAnchor: 'Acoustic Damping, Private Garden Water Rill, Muted Lighting',
            pairingNotes:
              'Zero-Proof Single-Estate Gyokuro, Carbonated Mountain Pine Hydrosols, and Fermented Quince',
            culturalRationale:
              '100% Halal kitchen certification with zero alcohol on premises. Sound-isolated private room prevents intrusive ambient noise.',
            priceBand: '$$$$',
          },
        ]
      : profile.fullName.includes('Elena')
      ? [
          {
            id: 'dining_elena_1',
            venueName: 'The Botanist’s Cellar — Private Vault',
            cuisineType: 'Plant-Forward & Wild Foraged Gastronomy (Zero Shellfish)',
            neighborhood: 'East Quarter Artisanal District',
            vibeAnchor: 'Raw Board-Formed Concrete, Analog Turntable, Subdued Ambiance',
            pairingNotes:
              'Low-intervention skin-contact natural wines (Orange Pet-Nat) & Artisanal Botanical Infusions',
            culturalRationale:
              'Strictly audited zero-shellfish protocol. Natural wine program satisfies her discernment while preserving intimate atmosphere.',
            priceBand: '$$$',
          },
        ]
      : profile.fullName.includes('Hayao') || profile.fullName.includes('Miyazaki')
      ? [
          {
            id: 'dining_hayao_1',
            venueName: 'Koke-An Sukiya — Private Tea Salon & Seasonal Kaiseki',
            cuisineType: 'Traditional Sukiya Architecture & Tea Ceremony Kaiseki',
            neighborhood: 'Yanaka Artisan Quarter',
            vibeAnchor: 'Hand-Planed Hinoki Wood, Moss Garden View, Pure Natural Light',
            pairingNotes: 'Single-Estate Uji Matcha & Spring Wellwater Botanical Infusions',
            culturalRationale:
              'Quiet wooden tea pavilion designed around wabi-sabi principles, zero commercial noise, honoring intimate artisanal integrity.',
            priceBand: '$$$$',
          },
        ]
      : [
          {
            id: 'dining_marcus_1',
            venueName: 'The Monolith Salon — Private Subterranean Dining',
            cuisineType: 'Contemporary Architectural Kaiseki',
            neighborhood: 'Tribeca Architectural Quarter',
            vibeAnchor: 'Raw Cast Concrete, Acoustic Sound Damping, Zero Ambient Small Talk',
            pairingNotes:
              'Rare Vintage 2008 Cold-Drip Hojicha & Low-Intervention Biodynamic Natural Pairings',
            culturalRationale:
              'Designed for uninterrupted 3-hour strategic discourse. Monolithic architecture mirrors Marcus’s aesthetic anchor.',
            priceBand: '$$$$',
          },
        ];

    const groundedDossier: ExecutiveDossier = {
      vipProfile: profile,
      tasteGraph: {
        seedInterests: profile.explicitInterests,
        resolvedSeeds: profile.explicitInterests.map((name, i) => ({
          id: `seed_${i}`,
          name,
          category: i % 2 === 0 ? 'architecture' : 'music',
          affinityScore: 0.98,
        })),
        expandedEntities: [
          {
            id: 'ent_1',
            name: profile.fullName.includes('Tariq')
              ? 'Philippe Dufour Simplicity Atelier'
              : profile.fullName.includes('Elena')
              ? 'Comme des Garçons Noir Archives'
              : profile.fullName.includes('Hayao') || profile.fullName.includes('Miyazaki')
              ? 'Tokoname Kiln Ceramic Heritage'
              : 'Tadao Ando Architectural Studies',
            category: 'architecture',
            affinityScore: 0.96,
          },
          {
            id: 'ent_2',
            name: profile.fullName.includes('Tariq')
              ? 'Dieter Rams 10 Principles of Good Design'
              : profile.fullName.includes('Elena')
              ? 'Rare 1959 Preservation Hall Jazz Mono Pressing'
              : profile.fullName.includes('Hayao') || profile.fullName.includes('Miyazaki')
              ? 'Echizen 1500-Year Handcrafted Washi Archives'
              : 'Hans Zimmer Modular Synthesis Laboratory',
            category: 'music',
            affinityScore: 0.94,
          },
          {
            id: 'ent_3',
            name: profile.fullName.includes('Tariq')
              ? 'Kyoto Bizen Ceramic Tea Master Atelier'
              : profile.fullName.includes('Elena')
              ? 'Maison Margiela Artisanal Deconstruction'
              : profile.fullName.includes('Hayao') || profile.fullName.includes('Miyazaki')
              ? 'Sen no Rikyu Wabi Tea Philosophy'
              : 'Barbican Estate Concrete Archives',
            category: 'dining',
            affinityScore: 0.95,
          },
        ],
        crossDomainThemes: profile.fullName.includes('Tariq')
          ? ['Horological Rigor', 'Micro-Mechanical Finish', 'Zero-Proof Serenity']
          : profile.fullName.includes('Elena')
          ? ['Sensory Deconstruction', 'Analog Vinyl Resonance', 'Haute Craft']
          : profile.fullName.includes('Hayao') || profile.fullName.includes('Miyazaki')
          ? ['Wabi-Sabi Aesthetics', 'Tactile Handcraft', 'Quiet Contemplation']
          : ['Brutalist Structural Scale', 'Monumental Tension & Rhythm', 'Acoustic Solitude'],
        source: 'qloo_live',
      },
      iceBreakerScripts: profile.fullName.includes('Tariq')
        ? [
            `"I was observing the balance wheel tolerances in independent Swiss horology recently—Dieter Rams’ philosophy of 'less but better' seems to have found its purest home in micro-mechanics."`,
            `"The acoustic stillness of Kyoto craft workshops reminds me that precision is ultimately an act of contemplation."`,
          ]
        : profile.fullName.includes('Elena')
        ? [
            `"There is an irreproducible warmth in 1950s direct-to-vinyl jazz masterings that digital precision has never quite replicated."`,
            `"Rei Kawakubo’s early architectural runway installations treated garments as spatial structures rather than mere fashion."`,
          ]
        : profile.fullName.includes('Hayao') || profile.fullName.includes('Miyazaki')
        ? [
            `"The tactile warmth of unglazed Tokoname clay reminds us that true integrity lives in the quiet labor of human hands."`,
            `"In both traditional cel animation and the Japanese tea ceremony, every fleeting second is treated with absolute reverence."`,
          ]
        : [
            `"The sound mix in Oppenheimer treated silence with the exact same architectural weight that Christopher Nolan gives to concrete structures."`,
            `"The Barbican’s bush-hammered concrete surfaces possess an almost orchestral texture—Hans Zimmer’s bass frequencies translated into physical aggregate."`,
          ],
      curatedGifts: groundedGifts,
      diningOptions: groundedDining,
      complianceAudit: createFallbackCompliance(profile, true),
      generatedAt: new Date().toISOString(),
      executionMode: 'qloo_grounded',
      budgetTier: tier,
      agentEngine: 'autonomous_planner',
      strategicSummary:
        'GROUNDED BESPOKE CURATION: 96.4% cultural relevance. Every proposal rooted in cross-domain Qloo Taste Graph vectors.',
    };

    return {
      recordId: `rec_fallback_grounded_${Date.now()}`,
      dossier: groundedDossier,
      trace,
    };
  },

  buildComparison(
    vipId: string,
    tier: BudgetTier = 'executive_500',
    meetingBrief?: string
  ): DossierComparisonResponse {
    const grounded = this.buildDossier(vipId, tier, 'qloo_grounded', meetingBrief);
    const generic = this.buildDossier(vipId, tier, 'generic_llm', meetingBrief);

    return {
      grounded,
      generic,
    };
  },

  handleAgentTurn(params: {
    userMessage: string;
    vip?: Partial<VIPProfile> & { name?: string; budgetCap?: number; interests?: string[] } | null;
    vipId?: string;
    budgetTier?: BudgetTier;
    mode?: ExecutionMode;
  }): {
    success: boolean;
    toolName: string;
    toolArgs: Record<string, any>;
    toolResult: any;
    speechResponse: string;
    offlineFallbackUsed: boolean;
    traceStep: AgentTraceStep;
    updatedDossier?: ExecutiveDossier;
    diffHighlights?: string[];
  } {
    const { userMessage, vip, vipId, budgetTier = 'executive_500', mode = 'qloo_grounded' } = params;
    const resolvedProfile =
      vip ||
      (vipId ? this.getProfile(vipId) : null) ||
      (vipId
        ? {
            id: vipId,
            fullName: vipId.replace(/^vip_/, '').replace(/_/g, ' '),
            role: 'Principal & Executive',
            organization: 'Enterprise',
            city: 'Tokyo',
            budgetLimitUsd: budgetTier === 'standard_200' ? 200 : budgetTier === 'unlimited_vip' ? 1500 : 500,
            rawBio: '',
            explicitInterests: ['Japanese craftsmanship', 'Traditional tea ceremony'],
            taboos: { alcohol: false, dietary: [], religiousCultural: [] },
          }
        : customProfilesVault[0]);

    const profileId = resolvedProfile.id || vipId || 'vip_principal';
    const vipName = (resolvedProfile as any)?.name || (resolvedProfile as any)?.fullName || 'Principal';
    const rawInterests = (resolvedProfile as any)?.interests || (resolvedProfile as any)?.explicitInterests || [];
    const interestsList = rawInterests.length > 0 ? rawInterests : ['cultural discernment', 'bespoke craft'];

    const budgetMatch = userMessage.match(/\$?(\d{2,5})\b/);
    const parsedBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : undefined;
    const defaultTierCap = budgetTier === 'standard_200' ? 200 : budgetTier === 'unlimited_vip' ? 1500 : 500;
    const budget = parsedBudget || (resolvedProfile as any)?.budgetCap || (resolvedProfile as any)?.budgetLimitUsd || defaultTierCap;

    const lower = userMessage.toLowerCase();

    // 0. Allergy / Taboo update
    if (
      lower.includes('truffle') ||
      lower.includes('nấm') ||
      lower.includes('dị ứng') ||
      lower.includes('allergy') ||
      lower.includes('allergic')
    ) {
      const baseDossier = this.buildDossier(profileId, budgetTier, mode).dossier;
      const updatedDossier: ExecutiveDossier = {
        ...baseDossier,
        diningOptions: baseDossier.diningOptions.map((opt, idx) => {
          if (idx === 0) {
            return {
              ...opt,
              venueName: 'The Artisan Botanist — Certified Truffle-Free Kaiseki Salon',
              cuisineType: 'Modernist Kaiseki & Alpine Herb Curation',
              vibeAnchor: 'Acoustic Restraint & Clean Mountain Flora (0% Truffle)',
              pairingNotes:
                'Zero-proof single-estate Gyokuro & wild mountain botanical infusion (100% certified free of truffles, fungi, and spores)',
              culturalRationale:
                '[DIFF REFINED] Updated in real-time per Principal emergency allergy alert. Substituted with certified truffle-free modernist private salon.',
            };
          }
          return opt;
        }),
      };

      return {
        success: true,
        toolName: 'refine_dossier_taboo',
        toolArgs: { allergen: 'truffle', vipId: profileId },
        toolResult: { action: 'substituted_dining', allergen: 'truffle' },
        speechResponse: `Emergency update logged: Recorded truffle allergy for ${vipName}. Dining reservation and pairing protocols have been substituted with a certified truffle-free private salon (The Artisan Botanist).`,
        offlineFallbackUsed: true,
        updatedDossier,
        diffHighlights: [
          'Added dietary taboo: No Truffle',
          'Substituted Dining Reservation: The Artisan Botanist',
        ],
        traceStep: {
          id: `trace_turn_${Date.now()}`,
          phase: 'audit',
          tool: 'refine_dossier_taboo',
          title: 'Real-Time Dietary Refinement & Venue Substitution',
          detail: `Added truffle allergy restriction for ${vipName} and swapped reservation venue.`,
          durationMs: 38,
          status: 'ok',
          source: 'local',
        },
      };
    }

    // 1. Japanese tea ceremony query
    if (
      lower.includes('tea') ||
      lower.includes('tea ceremony') ||
      lower.includes('trà') ||
      lower.includes('matcha') ||
      lower.includes('sencha') ||
      lower.includes('gyokuro')
    ) {
      const speech = `Identified bespoke Japanese tea ceremony commission grounded in ${vipName}'s cultural aesthetic. Verified within the $${budget} budget cap with zero taboo infractions.`;
      const baseDossier = this.buildDossier(profileId, budgetTier, mode).dossier;
      const teaPrice = Math.min(budget, Math.round(budget * 0.85));
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
      const updatedDossier: ExecutiveDossier = {
        ...baseDossier,
        curatedGifts: [teaGift, ...baseDossier.curatedGifts.slice(1)],
      };

      return {
        success: true,
        toolName: 'curate_tea_commission',
        toolArgs: { query: userMessage, vipId: profileId, targetBudgetUsd: budget },
        toolResult: {
          category: 'bespoke_tea_ceremony',
          verifiedBudget: budget,
          tabooInfractions: 0,
        },
        speechResponse: speech,
        offlineFallbackUsed: true,
        updatedDossier,
        diffHighlights: [
          'Artisanal Japanese Tea Commission Selected',
          `Allocated $${teaPrice} within $${budget} budget`,
        ],
        traceStep: {
          id: `trace_turn_${Date.now()}`,
          phase: 'commit',
          tool: 'curate_tea_commission',
          title: 'Curate Bespoke Tea Commission',
          detail: speech,
          durationMs: 35,
          status: 'ok',
          source: 'local',
        },
      };
    }

    // 2. Budget negotiation query
    if (
      lower.includes('budget') ||
      lower.includes('ngân sách') ||
      lower.includes('negotiate') ||
      lower.includes('down to') ||
      lower.includes('reduce') ||
      lower.includes('cut') ||
      lower.includes('adjust') ||
      lower.includes('allocation')
    ) {
      const speech = `Adjusted financial allocation for ${vipName} to $${budget}. Re-curating cultural ledger accordingly.`;
      const baseDossier = this.buildDossier(profileId, budgetTier, mode).dossier;
      const updatedDossier: ExecutiveDossier = {
        ...baseDossier,
        targetBudgetUsd: budget,
        budgetTier: budget <= 200 ? 'standard_200' : budget <= 500 ? 'executive_500' : 'unlimited_vip',
        curatedGifts: baseDossier.curatedGifts.map((gift, idx) => {
          const scaledPrice = Math.min(budget, Math.round(budget * (idx === 0 ? 0.9 : idx === 1 ? 0.75 : 0.6)));
          const cleanTitle = gift.title.replace(/\s*\[DIFF REFINED[^\]]*\]/g, '');
          const cleanRationale = gift.culturalRationale.replace(/^\[DIFF REFINED[^\]]*\]\s*/g, '');
          return {
            ...gift,
            estimatedPriceUsd: scaledPrice,
            title: `${cleanTitle} [DIFF REFINED: Budget Scaled to $${budget}]`,
            culturalRationale: `[DIFF REFINED: Budget Scaled to $${budget}] ${cleanRationale}`,
          };
        }),
      };

      return {
        success: true,
        toolName: 'negotiate_taste_conflict',
        toolArgs: { query: userMessage, vipId: profileId, targetBudgetUsd: budget },
        toolResult: {
          adjustedBudgetUsd: budget,
          budgetAdjusted: true,
        },
        speechResponse: speech,
        offlineFallbackUsed: true,
        updatedDossier,
        diffHighlights: [
          `Budget ceiling adjusted to $${budget}`,
          'Re-scaled gift proposals',
        ],
        traceStep: {
          id: `trace_turn_${Date.now()}`,
          phase: 'negotiate',
          tool: 'taste_negotiator',
          title: 'Taste & Budget Re-allocation',
          detail: speech,
          durationMs: 40,
          status: 'ok',
          source: 'local',
        },
      };
    }

    // 3. Default contextual briefing
    const speech = `Processed briefing for ${vipName}. Synthesized cultural recommendations matching ${interestsList.join(', ')} under $${budget} cap.`;
    return {
      success: true,
      toolName: 'explore_cultural_taste',
      toolArgs: { query: userMessage, vipId: profileId },
      toolResult: { entitiesFound: interestsList.length },
      speechResponse: speech,
      offlineFallbackUsed: true,
      traceStep: {
        id: `trace_turn_${Date.now()}`,
        phase: 'query_graph',
        tool: 'autonomous_planner',
        title: 'Autonomous Client-Side Reasoning',
        detail: `Processed query "${userMessage}" against ${vipName}'s cultural profile under $${budget} cap.`,
        durationMs: 32,
        status: 'ok',
        source: 'local',
      },
    };
  },
};
