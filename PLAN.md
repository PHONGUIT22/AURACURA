# CuraVIP - Master Execution Plan (Qloo Agentic AI Hackathon)

## 1. Project Context & Objectives
- **Target Product**: `CuraVIP` (Autonomous Cultural Intelligence & High-Ticket Relationship Concierge for Dealmakers).
- **Core Problem**: Existing LLM agents suffer from "Cultural Blindness"—they recommend clichés (pens, fruit baskets) when advising dealmakers. CuraVIP leverages **Qloo Taste Graph** (250M+ entities) via a standard **MCP (Model Context Protocol) Server** and **AWS Bedrock Claude** to ground decisions in true cultural correlations.
- **Base Codebase**: Re-architected from `carebridge-ambient` into an executive, dark-luxury B2B VIP concierge.
- **Strict Guardrail**: Zero legacy medical terms. All code, schemas, and UX conform to the Dark Luxury specification (Obsidian `#070709`, Champagne Gold `#D4AF37`, Slate Glass).

---

## Master Execution Checklist

### Phase 1: Identity Purge, Git Scrub & Type Definitions
- [x] **Task 1.1: Git Repository Cleansing**
  - [x] Scrub legacy `.git` history and initialize pristine `main` branch.
  - [x] Standard MIT License with PHONGUIT22 / CuraVIP Contributors.
  - [x] Cleaned out legacy hospital/pill assets from `image/`.
- [x] **Task 1.2: Package & Project Metadata Rename**
  - [x] Root `package.json`: renamed to `curavip-agent` with concierge metadata.
  - [x] `backend-mcp/package.json`: renamed to `curavip-backend-mcp`, migrated to Node 22 native `node:sqlite`.
  - [x] `frontend/package.json`: renamed to `curavip-frontend` with Next.js 15 scripts.
- [x] **Task 1.3: Core Type Definitions Refactoring**
  - [x] Synchronized `backend-mcp/src/types/index.ts` and `frontend/src/types/index.ts`:
    - `BudgetTier`, `CulturalEntity`, `CulturalTasteGraph`, `VIPProfile`, `GiftProposal`, `DiningProposal`, `ComplianceAuditResult`, `ExecutiveDossier`, `ReservationOrder`.

---

### Phase 2: MCP Backend Refactor & Qloo API Grounding
- [x] **Task 2.1: SQLite Database Re-architecting**
  - [x] Removed all legacy repositories (`medicineRepo`, `vitalsRepo`, `caregiverRepo`).
  - [x] Created `backend-mcp/src/database/db.ts` using Node 22 native `DatabaseSync` (`node:sqlite`).
  - [x] Created `backend-mcp/src/database/vipDossierRepo.ts` with tables: `vip_profiles`, `dossier_records`, `curation_history`, `reservation_orders`.
  - [x] Created `backend-mcp/src/database/seedDemoData.ts` with 3 executive personas:
    - **Marcus Vance** (Managing Partner, Horizon Capital; Christopher Nolan & Brutalism; $500 cap).
    - **Tariq Al-Mansoor** (Founder, Kinetix AI Riyadh; Independent Horology & Dieter Rams; 100% Zero-Alcohol & Halal; $1,500 cap).
    - **Elena Rostova** (Chief Creative Officer, Maison Vane; New Orleans Jazz & Natural Wine; $200 strict compliance cap).
- [x] **Task 2.2: Qloo Client Service Implementation**
  - [x] Created `backend-mcp/src/services/curatedTasteGraph.ts` with 4 cross-domain affinity clusters (`monumental_cerebral`, `precision_minimalism`, `improvisational_bohemian`, `heritage_refined`).
  - [x] Created `backend-mcp/src/services/qlooClient.ts` with `/v2/insights` and `/v2/search` endpoints and offline fallback.
- [x] **Task 2.3: MCP Tools & Compliance Services Refactoring**
  - [x] Created `backend-mcp/src/services/complianceGuardrailService.ts` for FCPA limits, budget caps, alcohol/dietary taboo filtering, and duplicate gift prevention.
  - [x] Created `backend-mcp/src/tools/qlooTasteExplorer.ts` registering MCP tool `explore_cultural_taste`.
  - [x] Created `backend-mcp/src/tools/curateBookingOrder.ts` registering MCP tool `commit_curated_reservation`.
  - [x] Created `backend-mcp/src/tools/tasteNegotiator.ts` registering MCP tool `negotiate_taste_conflict`.
  - [x] Registered MCP resources: `vip://roster`, `qloo://taste-clusters`, `policy://fcpa-guidelines`.
  - [x] Updated `backend-mcp/src/server.ts` with MCP SSE transport (`/sse`, `/message`) and Express REST API.
- [x] **Task 2.4: Agent Coordinator & Prompts Engineering**
  - [x] Created `backend-mcp/src/prompts/index.ts` with `CHIEF_OF_STAFF_SYSTEM_PROMPT` enforcing Deconstruct -> Query Graph -> Audit reasoning chain.
  - [x] Created `backend-mcp/src/tools/agentTurnHandler.ts` coordinating Bedrock Claude 3.5 Sonnet / Haiku tool loops with offline intent fallback.

---

### Phase 3: Dark Luxury UI & Rich Cards Experience
- [x] **Task 3.1: Tailwind Theme & Styling Overhaul**
  - [x] Updated `frontend/tailwind.config.ts` with Obsidian (`#070709`), Champagne Gold (`#D4AF37`), Slate Glass tokens, and glowing animations.
  - [x] Updated `frontend/src/app/globals.css` with radial gradient canvas, subtle scrollbars, and luxury card specular borders.
  - [x] Added Cormorant Garamond, Inter, and Geist font imports in `frontend/src/app/layout.tsx`.
- [x] **Task 3.2: Rebranding Console & Voice Interaction**
  - [x] Created `frontend/src/components/VIPAgentConsole.tsx` with meeting brief textarea, policy tier buttons ($200, $500, Unlimited), voice dictation, and audio readout.
  - [x] Created `frontend/src/components/AmbientGlow.tsx` with reactive champagne gold pulse border.
  - [x] Created `frontend/src/services/speechService.ts` with AWS Polly neural voice streaming and Web Speech API fallback.
- [x] **Task 3.3: Rich Cards Reconstruction**
  - [x] Created `frontend/src/components/RichCards/TasteDossierCard.tsx` (cultural affinity tags, thematic synthesis, strategic ice-breakers).
  - [x] Created `frontend/src/components/RichCards/CuratedGiftCard.tsx` (3 tiered proposals, Qloo Provenance Anchor badges, vector PDF export trigger).
  - [x] Created `frontend/src/components/RichCards/ComplianceAuditCard.tsx` (FCPA risk badge, compliance checklist, taboo verification).
  - [x] Created `frontend/src/components/RichCards/DiningProposalCard.tsx` (private salon reservations, vibe anchors, beverage pairings).
  - [x] Created `frontend/src/components/RichCardsContainer.tsx` orchestrating all cards.
  - [x] Created `frontend/src/services/pdfService.ts` generating 1-page A4 Dark Luxury Executive PDF summaries via `jsPDF`.
- [x] **Task 3.4: "Grounding Toggle" (The Judge-Winning Feature)**
  - [x] Added `Grounding Toggle` in `TopNavBar.tsx` (Qloo Cultural Grounding ON / OFF).
  - [x] Added Side-by-Side comparison button in `TopNavBar.tsx`.
  - [x] Created `frontend/src/components/SideBySideComparisonView.tsx` showing real-time split-screen contrast: Generic LLM clichés vs. Qloo Cultural Taste Grounding.

---

### Phase 4: Automated Testing, Deployment & Polish
- [x] **Task 4.1: Test Suite Verification**
  - [x] Unit test `tests/qlooTasteExplorer.test.ts` (6/6 passing).
  - [x] Unit test `tests/complianceGuardrail.test.ts` (7/7 passing).
  - [x] Integration test `tests/mcpAndAgent.test.ts` (6/6 passing).
  - [x] Total: 19/19 tests passing (100% pass rate).
- [x] **Task 4.2: Production Build Verification**
  - [x] `backend-mcp`: `tsc` compiles with 0 errors.
  - [x] `frontend`: `next build` static export / prerender completes with 0 errors and 0 lint warnings.
  - [x] Zero legacy medical keywords in all active codebase files.
- [x] **Task 4.3: Submission Documentation & Delivery**
  - [x] Comprehensive `README.md` with system overview, architecture diagram, persona matrix, and setup guide.
  - [x] In-depth `ARCHITECTURE.md` detailing MCP protocol specification, Qloo cross-domain inference, and compliance pipeline.
  - [x] Pitch-ready `DEMO_SCRIPT_3MIN.md` structuring the 3-minute hackathon walkthrough.
  - [x] Updated `.env.example` with Qloo and AWS Bedrock/Polly keys.