import type { CulturalCategory, CulturalEntity, CulturalTasteGraph } from '../types/index.js';

/**
 * Curated offline Taste Graph.
 *
 * Used when the Qloo API key is absent or the network is unavailable so that demos and tests keep working.
 * Each cluster encodes a cross-domain affinity neighbourhood (film ↔ music ↔ architecture ↔ dining ↔ fashion ↔ literature)
 * modelled on public Qloo correlation patterns. Live Qloo data always takes precedence when available.
 */

interface ClusterEntitySeed {
  name: string;
  affinity: number;
  note: string;
}

export interface TasteCluster {
  id: string;
  label: string;
  triggers: readonly string[];
  themes: readonly string[];
  entities: Readonly<Record<CulturalCategory, readonly ClusterEntitySeed[]>>;
}

export const TASTE_CLUSTERS: readonly TasteCluster[] = [
  {
    id: 'monumental_cerebral',
    label: 'Monumental time & scale',
    triggers: [
      'nolan', 'interstellar', 'inception', 'tenet', 'oppenheimer', 'dunkirk', 'zimmer', 'brutalis', 'barbican',
      'concrete', 'ambient', 'eno', 'villeneuve', 'kubrick', 'sci-fi', 'science fiction', 'space', 'cosmos', 'arrival',
      'blade runner', 'le corbusier', 'louis kahn', 'ando', 'monolith', 'scale',
    ],
    themes: [
      'Monumental scale and the poetics of time',
      'Raw materials honestly expressed — concrete, cast iron, wood-fired stoneware',
      'Immersive low-frequency soundscapes over spectacle',
    ],
    entities: {
      film: [
        { name: 'Interstellar', affinity: 0.97, note: 'Anchor title — time dilation as emotional engine' },
        { name: 'Arrival (Denis Villeneuve)', affinity: 0.91, note: 'Non-linear time, monolithic set design' },
        { name: '2001: A Space Odyssey', affinity: 0.89, note: 'Canonical monolith aesthetic' },
        { name: 'Blade Runner 2049', affinity: 0.88, note: 'Brutalist production design by Dennis Gassner' },
      ],
      music: [
        { name: 'Hans Zimmer', affinity: 0.96, note: 'Organ-driven Interstellar score' },
        { name: 'Jóhann Jóhannsson', affinity: 0.92, note: 'Arrival score; drone-based minimalism' },
        { name: 'Brian Eno', affinity: 0.9, note: 'Ambient 1: Music for Airports' },
        { name: 'Max Richter', affinity: 0.89, note: 'Sleep / The Blue Notebooks' },
      ],
      architecture: [
        { name: 'Barbican Estate', affinity: 0.95, note: 'Chamberlin, Powell & Bon — British Brutalism' },
        { name: 'Tadao Ando', affinity: 0.92, note: 'Poured-concrete sanctuaries' },
        { name: 'Salk Institute (Louis Kahn)', affinity: 0.9, note: 'Concrete framing the horizon' },
        { name: 'Unité d’Habitation (Le Corbusier)', affinity: 0.86, note: 'Béton brut origin point' },
      ],
      dining: [
        { name: 'Chef’s-counter tasting menus', affinity: 0.9, note: 'Theatre of precision at close range' },
        { name: 'Nordic hearth cooking', affinity: 0.86, note: 'Fire, stone and restraint' },
        { name: 'Edomae omakase', affinity: 0.84, note: 'Ritualised time-keeping in courses' },
      ],
      fashion: [
        { name: 'Jil Sander', affinity: 0.84, note: 'Architectural minimalism in cloth' },
        { name: 'Issey Miyake Homme Plissé', affinity: 0.82, note: 'Engineered pleats, travel-ready' },
        { name: 'Lemaire', affinity: 0.79, note: 'Quiet utilitarian tailoring' },
      ],
      literature: [
        { name: 'The Order of Time — Carlo Rovelli', affinity: 0.9, note: 'Physics of time for non-physicists' },
        { name: 'Dune — Frank Herbert', affinity: 0.86, note: 'Scale, ecology and long-horizon strategy' },
        { name: 'Concrete Concept — Christopher Beanland', affinity: 0.84, note: 'Brutalist buildings around the world' },
      ],
    },
  },
  {
    id: 'precision_minimalism',
    label: 'Precision minimalism',
    triggers: [
      'watch', 'horolog', 'movement', 'tourbillon', 'dieter rams', 'rams', 'minimalis', 'japanese craft', 'japanese',
      'braun', 'muji', 'wabi', 'ceramic', 'kintsugi', 'seiko', 'journe', 'atelier', 'artisan', 'hand-finished',
      'shokunin', 'bauhaus', 'design', 'craftsmanship',
    ],
    themes: [
      'Mechanical precision as a form of devotion',
      'Wabi-sabi restraint and hand-finished surfaces',
      'Japanese artisan lineages (shokunin) and slow mastery',
    ],
    entities: {
      film: [
        { name: 'Jiro Dreams of Sushi', affinity: 0.92, note: 'Shokunin obsession with incremental perfection' },
        { name: 'Perfect Days (Wim Wenders)', affinity: 0.9, note: 'Ritual, routine and quiet craft in Tokyo' },
        { name: 'Columbus (Kogonada)', affinity: 0.86, note: 'Modernist architecture as character' },
      ],
      music: [
        { name: 'Ryuichi Sakamoto', affinity: 0.93, note: 'async — precision and silence' },
        { name: 'Hiroshi Yoshimura', affinity: 0.88, note: 'Japanese environmental music' },
        { name: 'Nils Frahm', affinity: 0.86, note: 'Mechanical piano textures' },
      ],
      architecture: [
        { name: 'Tadao Ando', affinity: 0.9, note: 'Light, concrete and void' },
        { name: 'Kengo Kuma', affinity: 0.88, note: 'Timber lattices and material humility' },
        { name: 'John Pawson', affinity: 0.87, note: 'Minimum as a discipline' },
      ],
      dining: [
        { name: 'Edomae omakase', affinity: 0.93, note: 'Knife-work as horology' },
        { name: 'Kaiseki', affinity: 0.9, note: 'Seasonal sequencing, lacquer and ceramics' },
        { name: 'Specialty tea ceremony (chanoyu)', affinity: 0.86, note: 'Alcohol-free ritual hospitality' },
      ],
      fashion: [
        { name: 'Grand Seiko', affinity: 0.92, note: 'Zaratsu polishing, Shinshu studio' },
        { name: 'Issey Miyake', affinity: 0.87, note: 'Engineering-led garment design' },
        { name: 'The Row', affinity: 0.83, note: 'Logo-less luxury' },
      ],
      literature: [
        { name: 'Less but Better — Dieter Rams', affinity: 0.95, note: 'Ten principles of good design' },
        { name: 'In Praise of Shadows — Jun’ichirō Tanizaki', affinity: 0.94, note: 'Japanese aesthetics of restraint' },
        { name: 'The Unknown Craftsman — Sōetsu Yanagi', affinity: 0.88, note: 'Mingei and anonymous mastery' },
      ],
    },
  },
  {
    id: 'improvisational_bohemian',
    label: 'Improvisational bohemia',
    triggers: [
      'jazz', 'new orleans', 'natural wine', 'avant-garde', 'avant garde', 'comme des', 'kawakubo', 'margiela',
      'vinyl', 'blue note', 'coltrane', 'gallery', 'bohemian', 'creole', 'yohji', 'deconstruct', 'low-intervention',
      'fashion week', 'campaign', 'creative',
    ],
    themes: [
      'Improvisation and imperfection over polish',
      'Low-intervention, terroir-driven craft',
      'Deconstruction as a design language',
    ],
    entities: {
      film: [
        { name: 'Treme (HBO)', affinity: 0.9, note: 'Post-Katrina New Orleans musicians' },
        { name: 'Pina (Wim Wenders)', affinity: 0.88, note: 'Tanztheater and radical movement' },
        { name: '’Round Midnight', affinity: 0.84, note: 'Expat jazz in 1950s Paris' },
      ],
      music: [
        { name: 'Preservation Hall Jazz Band', affinity: 0.94, note: 'Living tradition of New Orleans jazz' },
        { name: 'Louis Armstrong', affinity: 0.9, note: 'Hot Five & Hot Seven recordings' },
        { name: 'Alice Coltrane', affinity: 0.86, note: 'Spiritual jazz, harp and organ' },
        { name: 'Kamasi Washington', affinity: 0.85, note: 'Contemporary spiritual jazz' },
      ],
      architecture: [
        { name: 'French Quarter Creole townhouses', affinity: 0.86, note: 'Cast-iron galleries and courtyards' },
        { name: 'Lina Bo Bardi', affinity: 0.83, note: 'Humane, improvised modernism' },
        { name: 'Dover Street Market (spaces)', affinity: 0.82, note: 'Retail as installation' },
      ],
      dining: [
        { name: 'Natural wine bars', affinity: 0.94, note: 'Low-intervention cellars, small plates' },
        { name: 'Creole & Lowcountry cooking', affinity: 0.9, note: 'Gumbo, red beans, Sunday suppers' },
        { name: 'Bistronomy small plates', affinity: 0.86, note: 'Chef-driven, informal precision' },
      ],
      fashion: [
        { name: 'Comme des Garçons', affinity: 0.95, note: 'Rei Kawakubo’s anti-fashion' },
        { name: 'Maison Margiela', affinity: 0.94, note: 'Artisanal deconstruction' },
        { name: 'Yohji Yamamoto', affinity: 0.9, note: 'Black, volume and asymmetry' },
        { name: 'Dries Van Noten', affinity: 0.86, note: 'Print, texture and colour poetry' },
      ],
      literature: [
        { name: 'Rei Kawakubo/Comme des Garçons: Art of the In-Between', affinity: 0.9, note: 'The Met Costume Institute catalogue' },
        { name: 'Just Kids — Patti Smith', affinity: 0.88, note: 'Art, friendship and bohemian New York' },
        { name: 'Natural Wine — Isabelle Legeron MW', affinity: 0.86, note: 'Field guide to living wine' },
      ],
    },
  },
  {
    id: 'heritage_refined',
    label: 'Understated heritage',
    triggers: [
      'opera', 'classical', 'art collect', 'collector', 'golf', 'sailing', 'yacht', 'tennis', 'polo', 'equestrian',
      'cigar', 'heritage', 'tailoring', 'savile', 'museum', 'philanthrop', 'orchestra', 'ballet',
    ],
    themes: [
      'Understated heritage craftsmanship',
      'Patronage of the performing arts',
      'Quiet luxury signalled through provenance, not logos',
    ],
    entities: {
      film: [
        { name: 'The Grand Budapest Hotel', affinity: 0.86, note: 'Hospitality as an art form' },
        { name: 'The Leopard (Visconti)', affinity: 0.84, note: 'Aristocratic heritage in transition' },
        { name: 'Phantom Thread', affinity: 0.83, note: 'Couture craftsmanship' },
      ],
      music: [
        { name: 'Yo-Yo Ma — Bach Cello Suites', affinity: 0.88, note: 'Repertoire for reflection' },
        { name: 'Glenn Gould — Goldberg Variations (1981)', affinity: 0.86, note: 'Precision and eccentric genius' },
        { name: 'Berliner Philharmoniker', affinity: 0.84, note: 'Patronage-friendly institution' },
      ],
      architecture: [
        { name: 'Renzo Piano', affinity: 0.86, note: 'Museums with light and lightness' },
        { name: 'Palladian villas', affinity: 0.82, note: 'Proportion and calm' },
        { name: 'Norman Foster', affinity: 0.8, note: 'High-tech civic landmarks' },
      ],
      dining: [
        { name: 'Seasonal haute cuisine', affinity: 0.88, note: 'Classic brigade, impeccable service' },
        { name: 'Private dining rooms', affinity: 0.86, note: 'Discretion for negotiation' },
        { name: 'Heritage grill rooms', affinity: 0.8, note: 'Old-world steak and sole' },
      ],
      fashion: [
        { name: 'Loro Piana', affinity: 0.9, note: 'Baby cashmere and vicuña' },
        { name: 'Brunello Cucinelli', affinity: 0.86, note: 'Humanistic luxury' },
        { name: 'Anderson & Sheppard', affinity: 0.84, note: 'Savile Row soft tailoring' },
      ],
      literature: [
        { name: 'The Leopard — Giuseppe Tomasi di Lampedusa', affinity: 0.88, note: 'Change so that nothing changes' },
        { name: 'Meditations — Marcus Aurelius', affinity: 0.86, note: 'Stoic leadership' },
        { name: 'The Remains of the Day — Kazuo Ishiguro', affinity: 0.82, note: 'Service, duty and restraint' },
      ],
    },
  },
];

export const DEFAULT_CLUSTER_ID = 'heritage_refined';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/** Scores every cluster against free text. Returns clusters with a positive score, strongest first. */
export function matchClusters(texts: readonly string[]): Array<{ cluster: TasteCluster; score: number }> {
  const haystack = texts.join(' \n ').toLowerCase();
  const scored = TASTE_CLUSTERS.map((cluster) => ({
    cluster,
    score: cluster.triggers.reduce((sum, trigger) => (haystack.includes(trigger) ? sum + 1 : sum), 0),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) return scored;
  const fallback = TASTE_CLUSTERS.find((c) => c.id === DEFAULT_CLUSTER_ID);
  return fallback ? [{ cluster: fallback, score: 1 }] : [];
}

export function clusterEntityToCultural(
  cluster: TasteCluster,
  category: CulturalCategory,
  seed: ClusterEntitySeed,
  weight = 1
): CulturalEntity {
  return {
    id: `curated:${category}:${slugify(seed.name)}`,
    name: seed.name,
    category,
    affinityScore: Math.round(Math.min(0.99, seed.affinity * weight) * 100) / 100,
    metadata: { cluster: cluster.id, clusterLabel: cluster.label, note: seed.note, source: 'curated_fallback' },
  };
}

/** Finds the curated entity that best represents a free-text interest, across all clusters and categories. */
export function resolveCuratedSeed(interest: string): CulturalEntity | null {
  const needle = interest.toLowerCase().trim();
  if (!needle) return null;
  for (const cluster of TASTE_CLUSTERS) {
    for (const [category, seeds] of Object.entries(cluster.entities) as Array<[CulturalCategory, readonly ClusterEntitySeed[]]>) {
      const hit = seeds.find((seed) => {
        const name = seed.name.toLowerCase();
        return name.includes(needle) || needle.includes(name.split(' (')[0].split(' — ')[0]);
      });
      if (hit) return clusterEntityToCultural(cluster, category, hit);
    }
  }
  return null;
}

const CATEGORY_HINTS: ReadonlyArray<[CulturalCategory, readonly string[]]> = [
  ['music', ['music', 'jazz', 'ambient', 'zimmer', 'vinyl', 'record', 'band', 'orchestra', 'opera', 'composer', 'sakamoto']],
  ['film', ['film', 'movie', 'cinema', 'nolan', 'interstellar', 'director', 'series', 'kubrick', 'villeneuve']],
  ['architecture', ['architect', 'brutalis', 'building', 'barbican', 'concrete', 'design', 'rams', 'bauhaus', 'interior']],
  ['dining', ['wine', 'food', 'dining', 'restaurant', 'chef', 'cuisine', 'omakase', 'coffee', 'tea', 'sushi']],
  ['fashion', ['fashion', 'garçons', 'garcons', 'margiela', 'couture', 'tailor', 'watch', 'horolog', 'brand', 'avant']],
  ['literature', ['book', 'novel', 'literature', 'poetry', 'author', 'philosoph', 'essay', 'reading']],
];

/** Best-effort category guess for an arbitrary interest string. */
export function guessCategory(interest: string): CulturalCategory {
  const lower = interest.toLowerCase();
  for (const [category, hints] of CATEGORY_HINTS) {
    if (hints.some((hint) => lower.includes(hint))) return category;
  }
  return 'literature';
}

/**
 * Expands a set of seed interests across target domains using curated correlation clusters.
 */
export function expandCuratedCorrelations(
  seedsOrInterests: string[],
  targetCategories: CulturalCategory[] = ['music', 'film', 'dining', 'fashion', 'literature', 'architecture']
): CulturalEntity[] {
  const matches = matchClusters(seedsOrInterests);
  const result: CulturalEntity[] = [];
  const seenNames = new Set<string>();

  for (const { cluster, score } of matches) {
    const weight = Math.min(1.0, 0.75 + score * 0.08);
    for (const cat of targetCategories) {
      const entities = cluster.entities[cat] || [];
      for (const ent of entities) {
        const key = `${cat}:${ent.name.toLowerCase()}`;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          result.push(clusterEntityToCultural(cluster, cat, ent, weight));
        }
      }
    }
  }

  return result.sort((a, b) => b.affinityScore - a.affinityScore);
}

/**
 * Builds a complete CulturalTasteGraph using offline curated intelligence.
 */
export function buildFallbackTasteGraph(seedInterests: string[]): CulturalTasteGraph {
  const resolvedSeeds: CulturalEntity[] = [];
  for (const seed of seedInterests) {
    const resolved = resolveCuratedSeed(seed) || {
      id: `seed:${guessCategory(seed)}:${slugify(seed)}`,
      name: seed,
      category: guessCategory(seed),
      affinityScore: 0.98,
      metadata: { source: 'seed_input' },
    };
    resolvedSeeds.push(resolved);
  }

  const matches = matchClusters(seedInterests);
  const primaryCluster = matches[0]?.cluster || TASTE_CLUSTERS.find((c) => c.id === DEFAULT_CLUSTER_ID)!;
  const crossDomainThemes = [...primaryCluster.themes];

  const expandedEntities = expandCuratedCorrelations(seedInterests);

  return {
    seedInterests,
    resolvedSeeds,
    expandedEntities,
    crossDomainThemes,
    source: 'curated_fallback',
  };
}
