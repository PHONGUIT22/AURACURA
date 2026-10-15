import { envConfig, isRealSecret } from '../config/env.js';
import type { CulturalCategory, CulturalEntity, CulturalTasteGraph } from '../types/index.js';
import { qlooCacheRepo } from '../database/qlooCacheRepo.js';
import {
  buildFallbackTasteGraph,
  expandCuratedCorrelations,
  guessCategory,
  resolveCuratedSeed,
  slugify,
} from './curatedTasteGraph.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface QlooEntityResponse {
  id?: string;
  entity_id?: string;
  name?: string;
  title?: string;
  category?: string;
  type?: string;
  types?: string[];
  score?: number;
  affinity?: number;
  popularity?: number;
  urn?: string;
  properties?: Record<string, unknown>;
}

export interface QlooInsightsResponse {
  entities?: QlooEntityResponse[];
  results?: QlooEntityResponse[];
  data?: QlooEntityResponse[];
  themes?: string[];
}

export function mapQlooCategory(rawType?: string, name?: string): CulturalCategory {
  const lower = (rawType || '').toLowerCase();
  if (
    lower.includes('artist') ||
    lower.includes('music') ||
    lower.includes('song') ||
    lower.includes('track') ||
    lower.includes('album')
  ) {
    return 'music';
  }
  if (
    lower.includes('movie') ||
    lower.includes('film') ||
    lower.includes('cinema') ||
    lower.includes('tv')
  ) {
    return 'film';
  }
  if (
    lower.includes('place') ||
    lower.includes('dining') ||
    lower.includes('restaurant') ||
    lower.includes('venue') ||
    lower.includes('bar') ||
    lower.includes('food')
  ) {
    return 'dining';
  }
  if (
    lower.includes('brand') ||
    lower.includes('fashion') ||
    lower.includes('clothing') ||
    lower.includes('luxury') ||
    lower.includes('retail')
  ) {
    return 'fashion';
  }
  if (
    lower.includes('book') ||
    lower.includes('literature') ||
    lower.includes('author') ||
    lower.includes('novel')
  ) {
    return 'literature';
  }
  if (
    lower.includes('architecture') ||
    lower.includes('monument') ||
    lower.includes('building')
  ) {
    return 'architecture';
  }
  return guessCategory(name || '');
}

export function normalizeSeedToEntity(seed: string): string {
  const s = seed.toLowerCase();
  if (s.includes('brutalis') || s.includes('nolan')) return 'Interstellar'; // map sang phim đại diện
  if (s.includes('zimmer') || s.includes('ambient')) return 'Hans Zimmer';  // map sang nghệ sĩ đại diện
  if (s.includes('horology') || s.includes('watch')) return 'Patek Philippe'; // map sang thương hiệu đại diện
  if (s.includes('wine')) return 'Bordeaux';
  return seed;
}

export class QlooClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.baseUrl = (process.env.QLOO_API_URL || 'https://hackathon.api.qloo.com').replace(/\/+$/, '');
    this.timeoutMs = envConfig.QLOO_TIMEOUT_MS;
  }

  public get isConfigured(): boolean {
    return isRealSecret(process.env.QLOO_API_KEY);
  }

  /**
   * Root API URL without trailing `/v2` path if present.
   */
  private get rootBaseUrl(): string {
    return this.baseUrl.replace(/\/v2$/, '');
  }

  /**
   * Search for cultural entities matching a query across Qloo entities.
   * Endpoint: GET ${this.baseUrl}/search?query=${query}&types=${types}
   */
  public async searchEntities(
    query: string,
    type?: string | CulturalCategory
  ): Promise<CulturalEntity[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const cacheKey = `qloo:search:${type || 'all'}:${trimmed.toLowerCase()}`;
    const cached = qlooCacheRepo.get<CulturalEntity[]>(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.isConfigured) {
      const match = resolveCuratedSeed(trimmed);
      const cat = (type && ['music', 'film', 'dining', 'fashion', 'literature', 'architecture'].includes(type)
        ? type
        : guessCategory(trimmed)) as CulturalCategory;
      const res = match
        ? [match]
        : [
            {
              id: `curated:${cat}:${slugify(trimmed)}`,
              name: trimmed,
              category: cat,
              affinityScore: 0.95,
              metadata: { source: 'curated_fallback' },
            },
          ];
      qlooCacheRepo.set(cacheKey, res, 86400);
      return res;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      // Map category name to valid Qloo entity URN types
      let typesParam = 'urn:entity:movie,urn:entity:artist,urn:entity:place,urn:entity:brand,urn:entity:book,urn:entity:person';
      if (type) {
        if (type === 'music') typesParam = 'urn:entity:artist';
        else if (type === 'film') typesParam = 'urn:entity:movie';
        else if (type === 'dining') typesParam = 'urn:entity:place';
        else if (type === 'fashion') typesParam = 'urn:entity:brand';
        else if (type === 'literature') typesParam = 'urn:entity:book';
        else typesParam = String(type).startsWith('urn:entity:') ? String(type) : `urn:entity:${type}`;
      }

      const endpoint = `${this.rootBaseUrl}/search?query=${encodeURIComponent(trimmed)}&types=${encodeURIComponent(typesParam)}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Api-Key': process.env.QLOO_API_KEY!.trim(),
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(
          `[QlooClient] searchEntities returned ${response.status}. Deferring to curated fallback.`
        );
        const fallback = resolveCuratedSeed(trimmed);
        const res = fallback ? [fallback] : [];
        if (res.length > 0) qlooCacheRepo.set(cacheKey, res, 3600);
        return res;
      }

      const data = (await response.json()) as any;
      const rawList: QlooEntityResponse[] =
        data.results || data.data || data.entities || (Array.isArray(data) ? data : []);

      if (!Array.isArray(rawList) || rawList.length === 0) {
        const fallback = resolveCuratedSeed(trimmed);
        const res = fallback ? [fallback] : [];
        if (res.length > 0) qlooCacheRepo.set(cacheKey, res, 3600);
        return res;
      }

      const results = rawList.map((item: any) => {
        const rawType = item.type || item.category || (Array.isArray(item.types) ? item.types[0] : undefined);
        const cat = mapQlooCategory(rawType, item.name || trimmed);
        const entityId = item.entity_id || item.id || item.urn || `urn:entity:${rawType || 'entity'}:${slugify(item.name || trimmed)}`;
        return {
          id: entityId,
          name: item.name || item.title || trimmed,
          category: cat,
          affinityScore: Number(item.score ?? item.popularity ?? item.affinity ?? 0.95),
          metadata: {
            ...item.properties,
            entityId,
            urn: item.urn || entityId,
            type: rawType,
            source: 'qloo_live',
          },
        };
      });

      if (results.length > 0) {
        qlooCacheRepo.set(cacheKey, results, 86400);
      }
      return results;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[QlooClient] Live search failed (${msg}). Using curated graph.`);
      const fallback = resolveCuratedSeed(trimmed);
      const res = fallback ? [fallback] : [];
      if (res.length > 0) qlooCacheRepo.set(cacheKey, res, 3600);
      return res;
    }
  }

  /**
   * Cross-domain taste correlation via Qloo Hackathon /v2/insights.
   * Endpoint: GET ${this.baseUrl}/v2/insights with query params:
   *  - signal.interests.entities (entity URNs)
   *  - filter.type (one of urn:entity:artist, urn:entity:movie, urn:entity:place, urn:entity:brand, urn:entity:book)
   *  - location (optional for places)
   */
  public async getCrossDomainCorrelations(
    seedInterests: string[],
    targetCategories: CulturalCategory[] = ['music', 'film', 'dining', 'fashion', 'literature', 'architecture'],
    location?: string
  ): Promise<CulturalEntity[]> {
    if (!seedInterests || seedInterests.length === 0) return [];

    const sortedSeeds = [...seedInterests].map((s) => s.trim().toLowerCase()).sort().join('|');
    const sortedCats = [...targetCategories].map((c) => c.trim().toLowerCase()).sort().join('|');
    const locKey = (location || 'none').trim().toLowerCase();
    const correlationCacheKey = `qloo:correlate:${sortedSeeds}:${sortedCats}:${locKey}`;

    const cachedCorrelation = qlooCacheRepo.get<CulturalEntity[]>(correlationCacheKey);
    if (cachedCorrelation) {
      console.log(`[QlooCache HIT] Correlations for [${seedInterests.join(', ')}] (<5ms)`);
      return cachedCorrelation;
    }

    if (!this.isConfigured) {
      const fallback = expandCuratedCorrelations(seedInterests, targetCategories);
      if (fallback.length > 0) {
        qlooCacheRepo.set(correlationCacheKey, fallback, 86400);
      }
      return fallback;
    }

    try {
      // Step 1: Resolve seed interests to Entity URNs if not already URNs
      const entityUrns: string[] = [];
      for (const seed of seedInterests) {
        if (seed.startsWith('urn:entity:')) {
          entityUrns.push(seed);
        } else {
          const querySeed = normalizeSeedToEntity(seed);
          const matches = await this.searchEntities(querySeed);
          // CHỈ LẤY ID THẬT TỪ QLOO, BỎ QUA CÁC ID DỰ PHÒNG 'curated:'
          if (matches.length > 0 && matches[0].id && !matches[0].id.startsWith('curated:')) {
            entityUrns.push(matches[0].id);
          }
        }
      }

      // Nếu sau khi lọc mà không có ID Qloo thật nào -> Fallback ngay lập tức (không gọi API để đỡ ăn 400 vô ích)
      if (entityUrns.length === 0) {
        console.log('[QlooClient] No valid external Qloo UUIDs found. Using curated correlation directly.');
        const fallback = expandCuratedCorrelations(seedInterests, targetCategories);
        if (fallback.length > 0) qlooCacheRepo.set(correlationCacheKey, fallback, 3600);
        return fallback;
      }

      // Step 2: Define valid Qloo filter types mapped to internal cultural categories
      const filterTypeConfigs: Array<{ filterType: string; category: CulturalCategory }> = [
        { filterType: 'urn:entity:artist', category: 'music' },
        { filterType: 'urn:entity:movie', category: 'film' },
        { filterType: 'urn:entity:place', category: 'dining' },
        { filterType: 'urn:entity:brand', category: 'fashion' },
        { filterType: 'urn:entity:book', category: 'literature' },
      ];

      // Query only categories that overlap with targetCategories
      const activeConfigs = filterTypeConfigs.filter((cfg) =>
        targetCategories.includes(cfg.category)
      );

      const apiKey = process.env.QLOO_API_KEY!.trim();

      // Fetch insights sequentially with 220ms delay to stay strictly under the 5 req/s rate limit
      const combined: CulturalEntity[] = [];
      for (const { filterType, category } of activeConfigs) {
        const insightsCacheKey = `qloo:insights:${filterType}:${[...entityUrns].sort().join(',')}:${locKey}`;
        const cachedInsight = qlooCacheRepo.get<CulturalEntity[]>(insightsCacheKey);
        if (cachedInsight) {
          combined.push(...cachedInsight);
          continue;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
          const url = new URL(`${this.rootBaseUrl}/v2/insights`);
          for (const urn of entityUrns) {
            url.searchParams.append('signal.interests.entities', urn);
          }
          url.searchParams.set('filter.type', filterType);
          if (location && filterType === 'urn:entity:place') {
            url.searchParams.set('location', location);
          }
          const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'X-Api-Key': apiKey,
            },
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (!response.ok) {
            console.warn(`[QlooClient] Insights ${filterType} failed with status ${response.status}`);
          } else {
            const data = (await response.json()) as any;
            const rawList: any[] =
              data.results?.entities ||
              data.data?.entities ||
              data.results ||
              data.data ||
              data.entities ||
              (Array.isArray(data) ? data : []);
            if (Array.isArray(rawList) && rawList.length > 0) {
              const mapped = rawList.map((item: any): CulturalEntity => ({
                id: item.entity_id || item.urn || item.id || `urn:entity:${filterType.split(':').pop()}:${slugify(item.name || 'entity')}`,
                name: item.name || item.title || 'Cultural Entity',
                category,
                affinityScore: Number(item.query?.affinity ?? item.score ?? item.affinity ?? item.popularity ?? 0.92),
                metadata: {
                  ...item.properties,
                  type: filterType,
                  source: 'qloo_live',
                },
              }));
              qlooCacheRepo.set(insightsCacheKey, mapped, 86400);
              combined.push(...mapped);
              console.log(`[QlooClient LIVE] ✓ Retrieved ${mapped.length} entities for ${filterType}`);
            }
          }
        } catch (err) {
          clearTimeout(timeout);
          console.warn(`[QlooClient] Insights fetch error for ${filterType}:`, err);
        }
        // Pacing delay to avoid HTTP 429 Too Many Requests
        await sleep(220);
      }

      if (combined.length === 0) {
        console.warn('[QlooClient] Live insights returned 0 entities. Deferring to curated correlations.');
        const fallback = expandCuratedCorrelations(seedInterests, targetCategories);
        if (fallback.length > 0) qlooCacheRepo.set(correlationCacheKey, fallback, 3600);
        return fallback;
      }

      qlooCacheRepo.set(correlationCacheKey, combined, 86400);
      return combined;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[QlooClient] Live cross-domain query failed (${msg}). Falling back to curated correlations.`);
      const fallback = expandCuratedCorrelations(seedInterests, targetCategories);
      if (fallback.length > 0) qlooCacheRepo.set(correlationCacheKey, fallback, 3600);
      return fallback;
    }
  }

  /**
   * Synthesize a full CulturalTasteGraph for a VIP profile.
   */
  public async fetchTasteGraph(seedInterests: string[], location?: string): Promise<CulturalTasteGraph> {
    const sortedSeeds = [...seedInterests].map((s) => s.trim().toLowerCase()).sort().join('|');
    const locKey = (location || 'none').trim().toLowerCase();
    const tasteGraphKey = `qloo:tastegraph:${sortedSeeds}:${locKey}`;

    const cachedGraph = qlooCacheRepo.get<CulturalTasteGraph>(tasteGraphKey);
    if (cachedGraph) {
      console.log(`[QlooCache HIT] TasteGraph for [${seedInterests.join(', ')}] (<5ms)`);
      return cachedGraph;
    }

    if (!this.isConfigured) {
      const fallback = buildFallbackTasteGraph(seedInterests);
      qlooCacheRepo.set(tasteGraphKey, fallback, 86400);
      return fallback;
    }

    try {
      const resolvedSeeds: CulturalEntity[] = [];
      for (const seed of seedInterests) {
        const querySeed = normalizeSeedToEntity(seed);
        const matches = await this.searchEntities(querySeed);
        if (matches.length > 0) {
          resolvedSeeds.push(matches[0]);
        } else {
          resolvedSeeds.push({
            id: `seed:${guessCategory(seed)}:${slugify(seed)}`,
            name: seed,
            category: guessCategory(seed),
            affinityScore: 0.98,
            metadata: { source: 'seed_input' },
          });
        }
      }

      const expandedEntities = await this.getCrossDomainCorrelations(
        seedInterests,
        ['music', 'film', 'dining', 'fashion', 'literature', 'architecture'],
        location
      );

      if (expandedEntities.length === 0) {
        const fallback = buildFallbackTasteGraph(seedInterests);
        qlooCacheRepo.set(tasteGraphKey, fallback, 3600);
        return fallback;
      }

      // Derive themes from expanded entities or curated fallback themes
      const fallbackGraph = buildFallbackTasteGraph(seedInterests);
      const crossDomainThemes = fallbackGraph.crossDomainThemes;

      const result: CulturalTasteGraph = {
        seedInterests,
        resolvedSeeds,
        expandedEntities,
        crossDomainThemes,
        source: expandedEntities.some((e) => e.metadata?.source === 'qloo_live')
          ? 'qloo_live'
          : 'curated_fallback',
      };
      qlooCacheRepo.set(tasteGraphKey, result, 86400);
      return result;
    } catch {
      const fallback = buildFallbackTasteGraph(seedInterests);
      qlooCacheRepo.set(tasteGraphKey, fallback, 3600);
      return fallback;
    }
  }
}

export const qlooClient = new QlooClient();
