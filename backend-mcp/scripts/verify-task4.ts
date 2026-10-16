/**
 * AuraCura Task 4 Verification Script
 * Validates:
 * 1. Express App and API Routing initialization
 * 2. GET /api/health (YouCam status, SQLite cache stats, MCP endpoints)
 * 3. GET /api/profiles (Seeded clinical personas)
 * 4. POST /api/benchmark (Grounded clinical styling vs Generic Blind LLM)
 * 5. POST /api/dossier/stream (ReAct Orchestrator 4-Phase SSE streaming)
 */

import http from 'node:http';
import app from '../src/server.js';
import { envConfig } from '../src/config/env.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${msg}`);
    failed++;
  }
}

function makeRequest(
  server: http.Server,
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  const addr = server.address() as { port: number };
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : undefined;
    const reqHeaders: Record<string, string> = { ...headers };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        host: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: data,
          });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function makeSseRequest(
  server: http.Server,
  path: string,
  body: any
): Promise<{ status: number; events: Array<{ event: string; data: any }> }> {
  const addr = server.address() as { port: number };
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const events: Array<{ event: string; data: any }> = [];

    const req = http.request(
      {
        host: '127.0.0.1',
        port: addr.port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let buffer = '';
        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n\n');
          // keep last unfinished chunk in buffer
          buffer = lines.pop() || '';

          for (const block of lines) {
            if (!block.trim()) continue;
            let currentEvent = 'message';
            let currentData = '';
            for (const line of block.split('\n')) {
              if (line.startsWith('event: ')) {
                currentEvent = line.replace('event: ', '').trim();
              } else if (line.startsWith('data: ')) {
                currentData += line.replace('data: ', '').trim();
              }
            }
            if (currentData) {
              try {
                events.push({ event: currentEvent, data: JSON.parse(currentData) });
              } catch {
                events.push({ event: currentEvent, data: currentData });
              }
            }
          }
        });

        res.on('end', () => {
          resolve({ status: res.statusCode || 0, events });
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('\n======================================================');
  console.log('   AURACURA TASK 4: RE-ACT ORCHESTRATOR & REST TEST   ');
  console.log('======================================================\n');

  // Use test server on ephemeral port 0
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, '127.0.0.1', resolve));
  const testPort = (testServer.address() as { port: number }).port;
  console.log(`[Test Server] Running on ephemeral port ${testPort}\n`);

  try {
    // 1. GET /api/health
    console.log('[Suite 1] GET /api/health Endpoint');
    const healthRes = await makeRequest(testServer, 'GET', '/api/health');
    assert(healthRes.status === 200, `Health check returned HTTP 200 (Got ${healthRes.status})`);
    
    const healthJson = JSON.parse(healthRes.body);
    assert(healthJson.status === 'healthy', `Server status is 'healthy' (Got '${healthJson.status}')`);
    assert(healthJson.youcam !== undefined, 'Health payload contains youcam provider information');
    assert(healthJson.youcam.mode !== undefined, `YouCam mode reported: ${healthJson.youcam.mode}`);
    assert(healthJson.cache !== undefined, 'Health payload contains cache statistics');
    assert(typeof healthJson.cache.skinSqliteEntries === 'number', 'Cache entries count is a valid number');
    assert(healthJson.mcp !== undefined, 'Health payload contains MCP registration info');
    assert(healthJson.mcp.toolsCount === 4, `MCP registered exactly 4 tools (Got ${healthJson.mcp.toolsCount})`);

    // 2. GET /api/profiles
    console.log('\n[Suite 2] GET /api/profiles Endpoint');
    const profilesRes = await makeRequest(testServer, 'GET', '/api/profiles');
    assert(profilesRes.status === 200, `Profiles endpoint returned HTTP 200 (Got ${profilesRes.status})`);
    
    const profilesData = JSON.parse(profilesRes.body);
    const profiles = Array.isArray(profilesData) ? profilesData : profilesData.profiles;
    assert(Array.isArray(profiles), 'Profiles response contains an array');
    assert(profiles.length >= 3, `At least 3 demo personas seeded (Found ${profiles.length})`);
    
    const sarah = profiles.find((p: any) => p.id === 'sarah-chen' || p.id === 'sarah_chen');
    assert(!!sarah, "Persona 'Sarah Chen' exists in seeded profiles");
    assert(sarah?.fullName === 'Sarah Chen', `Sarah Chen name matches ('${sarah?.fullName}')`);

    const marcus = profiles.find((p: any) => p.id === 'marcus-reed' || p.id === 'marcus_reed');
    assert(!!marcus, "Persona 'Marcus Reed' exists in seeded profiles");

    const elena = profiles.find((p: any) => p.id === 'elena-gomez' || p.id === 'elena_gomez');
    assert(!!elena, "Persona 'Elena Gomez' exists in seeded profiles");

    // 3. POST /api/benchmark
    console.log('\n[Suite 3] POST /api/benchmark (Head-to-Head Comparison)');
    const benchRes = await makeRequest(testServer, 'POST', '/api/benchmark', {
      profileId: 'sarah_chen',
      message: 'Need urgent styling for annual gala with damaged skin barrier',
    });
    assert(benchRes.status === 200, `Benchmark returned HTTP 200 (Got ${benchRes.status})`);

    const benchmark = JSON.parse(benchRes.body);
    assert(benchmark.grounded !== undefined, 'Benchmark response includes grounded dossier');
    assert(benchmark.genericBlind !== undefined, 'Benchmark response includes genericBlind dossier');
    assert(benchmark.comparisonSummary !== undefined, 'Benchmark response includes comparisonSummary');
    
    // Check Grounded safety
    assert(
      benchmark.grounded.safetyReport.status === 'pass' || benchmark.grounded.safetyReport.status === 'warn',
      `Grounded safety report is pass/warn (Got ${benchmark.grounded.safetyReport.status})`
    );
    // Check Generic Blind flaws
    assert(
      benchmark.genericBlind.safetyReport.status === 'fail',
      `Generic Blind LLM fails safety audit (Got ${benchmark.genericBlind.safetyReport.status})`
    );
    assert(
      benchmark.comparisonSummary.safetyViolationsAvoided >= 1,
      `AuraCura avoided ${benchmark.comparisonSummary.safetyViolationsAvoided} safety violations compared to blind LLM`
    );
    assert(
      benchmark.comparisonSummary.verdict !== undefined,
      `Clinical verdict generated: "${benchmark.comparisonSummary.verdict.slice(0, 70)}..."`
    );

    // 4. POST /api/dossier/stream (SSE ReAct Loop)
    console.log('\n[Suite 4] POST /api/dossier/stream (4-Phase ReAct SSE Stream)');
    const sseRes = await makeSseRequest(testServer, '/api/dossier/stream', {
      profileId: 'sarah_chen',
      message: 'Run bio-harmonic VTO and dermatological regimen synthesis',
    });

    assert(sseRes.status === 200, `SSE endpoint connected with HTTP 200 (Got ${sseRes.status})`);
    assert(sseRes.events.length >= 4, `SSE stream emitted traces (Received ${sseRes.events.length} events)`);

    const traceEvents = sseRes.events.filter((e) => e.event === 'progress' || e.data?.type === 'progress');
    const phaseNames = traceEvents.map((t) => t.data?.step?.phase || t.data?.phase).filter(Boolean);
    console.log(`    Emitted phases: ${phaseNames.join(' -> ')}`);

    assert(phaseNames.includes('diagnose'), "SSE stream includes 'diagnose' phase");
    assert(phaseNames.includes('audit_safety'), "SSE stream includes 'audit_safety' phase");
    assert(phaseNames.includes('vto_simulation'), "SSE stream includes 'vto_simulation' phase");
    assert(phaseNames.includes('synthesize_regimen'), "SSE stream includes 'synthesize_regimen' phase");

    const completeEvent = sseRes.events.find((e) => e.event === 'complete' || e.data?.type === 'complete');
    assert(!!completeEvent, "SSE stream terminated with 'complete' event");
    assert(completeEvent?.data?.dossier !== undefined, 'Complete event payload contains synthesized dossier');
    assert(
      completeEvent?.data?.dossier?.apparelVTO?.brand !== undefined,
      `VTO Item selected: ${completeEvent?.data?.dossier?.apparelVTO?.name} by ${completeEvent?.data?.dossier?.apparelVTO?.brand}`
    );
    assert(
      Array.isArray(completeEvent?.data?.dossier?.skincareRegimen),
      `Skincare regimen synthesized with ${completeEvent?.data?.dossier?.skincareRegimen?.length} steps`
    );

    // 5. Verification Summary
    console.log('\n======================================================');
    console.log(`TASK 4 VERIFICATION RESULTS: ${passed} PASSED / ${failed} FAILED`);
    console.log('======================================================\n');
  } finally {
    testServer.close();
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
