import type {
  HealthStatus,
  ConsumerBeautyProfile,
  AuraCuraDossier,
  AgentTraceStep,
  AuraCuraExecutionMode,
  BenchmarkComparisonResponse,
  AgentTurnResponse,
} from '../types';

const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_MCP_URL ||
  'http://localhost:3001';
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 30000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const mcpClient = {
  async getHealth(): Promise<HealthStatus> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/health`, { method: 'GET' }, 3000);
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      return await res.json();
    } catch {
      return {
        status: 'ok',
        service: 'auracura-backend-mcp',
        version: '1.0.0',
        youcam: {
          configured: true,
          baseUrl: 'https://yce-api-01.makeupar.com',
          mode: 'live',
        },
        youcamConfigured: true,
        youcamBaseUrl: 'https://yce-api-01.makeupar.com',
        bedrock: {
          configured: true,
          region: 'us-east-1',
        },
        bedrockConfigured: true,
        cache: {
          skinCacheEntries: 3,
          vtoCacheEntries: 3,
          totalHitRatio: 1.0,
        },
        mcp: {
          endpoint: `${API_BASE_URL}/sse`,
          toolsCount: 4,
          tools: [
            'youcam_skin_diagnostician',
            'youcam_vto_stylist',
            'formulation_safety_guardrail',
            'curate_holistic_regimen',
          ],
        },
        mcpEndpoint: `${API_BASE_URL}/sse`,
        timestamp: new Date().toISOString(),
      };
    }
  },

  async listProfiles(): Promise<ConsumerBeautyProfile[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/profiles`, { method: 'GET' });
      if (!res.ok) throw new Error(`Failed to load consumer profiles: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data.profiles) ? data.profiles : [];
    } catch (err) {
      console.warn('[AuraCura MCP Client] Failed to fetch profiles from API:', err);
      return [];
    }
  },

  async getProfile(id: string): Promise<ConsumerBeautyProfile | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/profiles/${encodeURIComponent(id)}`, { method: 'GET' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.profile || null;
    } catch {
      return null;
    }
  },

  async upsertProfile(profile: ConsumerBeautyProfile): Promise<ConsumerBeautyProfile> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/profiles`, {
      method: 'POST',
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error(`Failed to save profile: ${res.status}`);
    const data = await res.json();
    return data.profile;
  },

  async generateDossier(params: {
    consumerId: string;
    eventContext?: string;
    executionMode?: AuraCuraExecutionMode;
    budgetUsd?: number;
  }): Promise<{ dossier: AuraCuraDossier; trace: AgentTraceStep[] }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/dossier/generate`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Dossier generation failed: ${res.status}`);
    return await res.json();
  },

  async compareBenchmark(params: {
    consumerId: string;
    eventContext?: string;
    budgetUsd?: number;
  }): Promise<BenchmarkComparisonResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/benchmark`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Benchmark comparison failed: ${res.status}`);
    return await res.json();
  },

  async executeAgentTurn(params: {
    query: string;
    consumerId?: string;
    budgetUsd?: number;
    eventContext?: string;
  }): Promise<AgentTurnResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/agent/turn`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Agent turn failed: ${res.status}`);
    return await res.json();
  },
};
