import './config/env.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Multi-tier environment variable loader for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../../.env');
const backendEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath, override: true });
}

// Initialize Database & seed demo principals
import { initDB } from './database/db.js';
import { seedDemoData } from './database/seedDemoData.js';

// AuraCura MCP Tools
import { youcamSkinDiagnosticianTool } from './tools/youcamSkinDiagnostician.js';
import { youcamVtoStylistTool } from './tools/youcamVtoStylist.js';
import { formulationSafetyGuardrailTool } from './tools/formulationSafetyGuardrail.js';
import { curateHolisticRegimenTool } from './tools/curateHolisticRegimen.js';

// Core MCP Resources & Prompts
import { registeredResources, readResourceHandler } from './resources/index.js';
import { registeredPrompts, getPromptHandler } from './prompts/index.js';

// Express REST API Router
import { apiRouter } from './routes/apiRoutes.js';
import { envConfig } from './config/env.js';

const app = express();
const PORT = envConfig.PORT;

// CORS configuration for Next.js frontend
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve persisted YouCam VTO rendered images from frontend/public/vto-renders
const vtoRendersDir = path.resolve(__dirname, '../../frontend/public/vto-renders');
if (!fs.existsSync(vtoRendersDir)) {
  fs.mkdirSync(vtoRendersDir, { recursive: true });
}
app.use('/vto-renders', express.static(vtoRendersDir));

// Normalize consecutive slashes (e.g., //api -> /api) to prevent 404 in Express 5
app.use((req, res, next) => {
  req.url = req.url.replace(/\/{2,}/g, '/');
  next();
});

// 1. INITIALIZE DATABASE SCHEMA & SYSTEM TABLES
initDB();
seedDemoData();

// ==========================================
// 2. SETUP MCP SERVER (Model Context Protocol)
// ==========================================
const mcpServer = new Server(
  {
    name: 'auracura-backend-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Registered tools ready for Claude Agent & Chief of Staff AI
const registeredTools = [
  youcamSkinDiagnosticianTool,
  youcamVtoStylistTool,
  formulationSafetyGuardrailTool,
  curateHolisticRegimenTool,
];

// --- MCP TOOLS HANDLERS ---
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: registeredTools.map((t) => t.definition),
  };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: toolArgs } = request.params;

  try {
    switch (name) {
      case 'youcam_skin_diagnostician': {
        const result = await youcamSkinDiagnosticianTool.handler(toolArgs as unknown as Parameters<typeof youcamSkinDiagnosticianTool.handler>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'youcam_vto_stylist': {
        const result = await youcamVtoStylistTool.handler(toolArgs as unknown as Parameters<typeof youcamVtoStylistTool.handler>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'formulation_safety_guardrail': {
        const result = await formulationSafetyGuardrailTool.handler(toolArgs as unknown as Parameters<typeof formulationSafetyGuardrailTool.handler>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'curate_holistic_regimen': {
        const result = await curateHolisticRegimenTool.handler(toolArgs as unknown as Parameters<typeof curateHolisticRegimenTool.handler>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      default:
        throw new Error(`MCP Tool '${name}' does not exist in AuraCura registry.`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Error executing tool '${name}': ${message}` }],
    };
  }
});

// --- MCP RESOURCES HANDLERS ---
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: registeredResources,
  };
});

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  try {
    return await readResourceHandler(uri);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read MCP Resource '${uri}': ${message}`);
  }
});

// --- MCP PROMPTS HANDLERS ---
mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: registeredPrompts,
  };
});

mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: promptArgs } = request.params;
  try {
    return await getPromptHandler(name, promptArgs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get MCP Prompt '${name}': ${message}`);
  }
});

// ==========================================
// 3. STREAMABLE HTTP / SSE TRANSPORT
// ==========================================
const sseTransports = new Map<string, SSEServerTransport>();

app.get('/sse', async (req: Request, res: Response) => {
  console.log('[MCP] New executive client connected via SSE stream...');
  const transport = new SSEServerTransport('/message', res);
  sseTransports.set(transport.sessionId, transport);

  req.on('close', () => {
    console.log(`[MCP] Closed SSE session: ${transport.sessionId}`);
    sseTransports.delete(transport.sessionId);
  });

  await mcpServer.connect(transport);
});

app.post('/message', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = sseTransports.get(sessionId);

  if (!transport) {
    res.status(404).json({ error: 'MCP Session does not exist or has expired.' });
    return;
  }

  await transport.handlePostMessage(req, res);
});

// ==========================================
// 4. REST API ROUTES
// ==========================================
app.use('/api', apiRouter);

// ==========================================
// 5. START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`
=====================================================
  AURACURA AUTONOMOUS BIO-HARMONIC VTO MCP READY
  • Port:               ${PORT}
  • REST Health API:    http://localhost:${PORT}/api/health
  • REST Profiles API:  http://localhost:${PORT}/api/profiles
  • REST Stream API:    http://localhost:${PORT}/api/dossier/stream
  • REST Benchmark API: http://localhost:${PORT}/api/benchmark
  • MCP SSE Endpoint:   http://localhost:${PORT}/sse
  • MCP Message Post:   http://localhost:${PORT}/message
=====================================================
  `);
  console.log(`[YouCam Config] Status: ${envConfig.youcamConfigured ? 'Live API Configured' : 'Clinical Skin Fallback Vault Active'}`);
  console.log(`[AWS Config] Status: ${envConfig.bedrockConfigured ? 'Bedrock Configured' : 'Offline Autonomous Engine Active'}`);
});

export default app;