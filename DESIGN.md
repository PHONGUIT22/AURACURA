# CuraVIP — Executive Design System & Dark Luxury UI Specification

> **Living Design Specification**
> *Engineered for high-ticket dealmakers, corporate gifting concierges, and chiefs of staff who cannot afford a culturally blind recommendation.*

---

## 1. Design Philosophy — "Dark Luxury & Executive Restraint"

CuraVIP borrows its visual language from private banking terminals, family-office dashboards and bespoke atelier lookbooks. The interface is quiet, deliberate and dense with meaning. It never shouts, never sparkles for its own sake, and never looks like a generic AI wrapper.

### The Five Design Pillars

1. **Executive Scannability** — The three facts a principal needs (cultural thesis, budget posture, compliance status) must be legible within a five-second glance.
2. **Tactile Digital Craftsmanship** — Dossier cards feel like matte black fine-art paper framed in brushed metal: a specular top edge, a faint champagne under-glow, generous negative space.
3. **Restrained Champagne Glow** — Gold (`#D4AF37`) is a signal, not a decoration. It marks Qloo provenance, active reasoning and primary actions only.
4. **Side-by-Side Clarity** — The product must visually prove its value: *Generic LLM (clichéd, risky)* versus *Qloo Cultural Grounding (precise, compliant, unrepeatable)*.
5. **Visible Reasoning** — Every recommendation shows its chain of custody: the seed signal, the Qloo correlation that anchored it, and the guardrail that cleared it.

---

## 2. Color System & Design Tokens

The palette is anchored in deep Obsidian, layered with Slate Glass surfaces and finished with Champagne Gold.

### 2.1 Obsidian Surfaces

| Token | Value | Role |
| :--- | :--- | :--- |
| `obsidian-900` | `#070709` | Root canvas — the deepest layer of the application. |
| `obsidian-800` | `#0D0D12` | Navigation bar, docks, modal backdrops. |
| `obsidian-700` | `#16161F` | Default card surface for dossiers and proposals. |
| `obsidian-600` | `#22222E` | Hover / focus surface, input fields, selected rows. |
| `obsidian-body` | `radial-gradient(circle at 50% 0%, #161622 0%, #0D0D14 55%, #070709 100%)` | Viewport background — light falls from the top edge. |

### 2.2 Slate Glass

| Token | Value | Role |
| :--- | :--- | :--- |
| `glass-fill` | `rgba(22, 22, 31, 0.72)` + `backdrop-blur-md` | Floating panels, console, roster. |
| `glass-border` | `rgba(255, 255, 255, 0.06)` | Side and bottom hairlines. |
| `specular-edge` | `rgba(255, 255, 255, 0.12)` | 1px top highlight that simulates polished glass. |
| `border-luxury` | `rgba(212, 175, 55, 0.18)` | Champagne hairline on premium / selected cards. |

### 2.3 Champagne & Status Accents

| Token | Value | Role |
| :--- | :--- | :--- |
| `champagne-400` | `#E5C478` | Cultural entity tags, Qloo correlation labels, soft highlights. |
| `champagne-500` | `#D4AF37` | Brand color, primary buttons, section eyebrows, affinity scores. |
| `champagne-600` | `#AA8A22` | Pressed states, gradient terminal stop, borders on dark gold fills. |
| `champagne-glow` | `rgba(212, 175, 55, 0.35)` | Ambient pulse while the agent queries the Taste Graph (`0 0 28px`). |
| `emeraldStatus` | `#10B981` | Compliance passed, budget within ceiling, live Qloo connection. |
| `crimsonAlert` | `#EF4444` | Budget breach, taboo violation, FCPA high-risk flag. |
| `amberCaution` | `#F59E0B` | Medium FCPA risk, fallback (offline) taste graph in use. |

### 2.4 Text & Contrast Hierarchy

| Token | Value | On | WCAG | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-ivory` | `#F8F6F0` | `#070709` / `#16161F` | 18.9:1 AAA | VIP names, gift titles, prices. |
| `text-dossier` | `#E2E8F0` | `#070709` / `#16161F` | 14.2:1 AAA | Cultural rationale, ice-breaker scripts. |
| `text-muted` | `#94A3B8` | `#16161F` | 7.5:1 AAA | Artisan provenance, metadata, timestamps. |
| `text-gold` | `#D4AF37` | `#16161F` | 8.1:1 AAA | Affinity scores, VIP badges, eyebrows. |

---

## 3. Typography — Tri-Font Luxury Pairing

| Role | Family | Tailwind | Usage |
| :--- | :--- | :--- | :--- |
| Display Serif | **Cormorant Garamond** (`--font-cormorant`) | `font-serif` | Principal names, card titles, hero statements. Evokes engraved stationery. |
| Interface Sans | **Inter** (`--font-inter`) | `font-sans` | Body copy, rationale, controls. |
| Figures & Badges | **Geist Mono** (`--font-geist-mono`) | `font-mono` | Prices, affinity percentages, audit codes, timestamps. |

```ts
fontFamily: {
  sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
  serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
  mono:  ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
}
```

| Element | Font | Size / Weight | Notes |
| :--- | :--- | :--- | :--- |
| VIP Hero Name | Serif | `text-3xl` / `font-semibold` | Paired with a small-caps role line. |
| Card Title | Serif | `text-xl` / `font-semibold` | Gift titles, venue names. |
| Section Eyebrow | Sans | `text-[10px]` / `font-semibold tracking-[0.28em] uppercase` | Always `champagne-500`. |
| Price & Metric | Mono | `text-lg` / `font-medium` | `$480.00`, `94% AFFINITY`. |
| Badges | Mono | `text-[10px]` / `tracking-wider uppercase` | `QLOO GROUNDED`, `FCPA LOW`, `TABOO CLEAR`. |
| Rationale | Sans | `text-sm` / `leading-relaxed` | Cross-domain explanation from Qloo. |
| Ice-breaker | Serif | `text-base` / `italic` | Rendered as a pull-quote with a gold rule. |

---

## 4. Layout Architecture

```
┌──────────────────────────── TopNavBar ────────────────────────────┐
│ CuraVIP crest │ Grounding Toggle (Qloo ON/OFF) │ Side-by-Side │ ● │
├──────────────┬────────────────────────────────────────────────────┤
│ VIP Roster   │ VIPAgentConsole (brief, voice, tier, run)          │
│ (glass)      ├────────────────────────────────────────────────────┤
│              │ Reasoning Trace (Deconstruct → Query → Curate →    │
│              │ Audit)                                             │
│              ├────────────────────────────────────────────────────┤
│              │ RichCardsContainer                                 │
│              │  TasteDossierCard · CuratedGiftCard ·              │
│              │  DiningProposalCard · ComplianceAuditCard          │
└──────────────┴────────────────────────────────────────────────────┘
                 ░░░░░ AmbientGlow (champagne pulse) ░░░░░
```

- **Desktop (≥1280px):** 320px roster rail + fluid main column (max 1180px).
- **Tablet (768–1279px):** roster collapses to a horizontal principal selector above the console.
- **Mobile (<768px):** single column; side-by-side comparison stacks vertically with sticky "Generic" / "Grounded" labels.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48. Card padding is `p-6`; inter-card gap is `gap-5`.
- Radius: cards `rounded-2xl`, controls `rounded-lg`, badges `rounded-full`.

---

## 5. Component Blueprints

### 5.1 AmbientGlow — Champagne Gold Pulse (`AmbientGlow.tsx`)
A fixed light strip along the bottom edge of the viewport that communicates agent state without words.

| State | Behaviour |
| :--- | :--- |
| `idle` | Faint, static champagne haze (opacity 0.25). |
| `listening` | Concentrated gold photons at the centre, amplitude driven by live microphone level. |
| `reasoning` | A champagne beam sweeps horizontally (2.4s loop) while Bedrock + Qloo resolve the taste graph. |
| `complete` | One soft emerald flash, then returns to idle. |
| `error` | One crimson flash, then returns to idle. |

### 5.2 VIPAgentConsole (`VIPAgentConsole.tsx`)
- CuraVIP Concierge crest (gold monogram in a hairline ring) — no third-party assistant branding.
- Meeting-brief textarea with voice dictation (Web Speech API) and a live waveform while listening.
- Budget tier segmented control: `Standard · $200`, `Executive · $500`, `Unlimited VIP`.
- Primary action: **Compose Dossier** (gold fill, obsidian text).

### 5.3 Reasoning Trace (`AgentTraceTimeline.tsx`)
A vertical timeline of the agent's tool calls: step name, MCP tool, duration, and a one-line summary. Live Qloo calls are tagged `QLOO LIVE`; offline graph usage is tagged `CURATED GRAPH` in amber.

### 5.4 TasteDossierCard (`RichCards/TasteDossierCard.tsx`)
- Principal header: serif name, role, organisation, city.
- Cross-domain taste map: entity chips grouped by domain (Film, Music, Dining, Fashion, Literature, Architecture), each with a mono affinity score.
- Cross-domain themes rendered as gold-ruled phrases.
- **Strategic Ice-Breakers** — two pull-quotes that open the meeting with genuine rapport.

### 5.5 CuratedGiftCard (`RichCards/CuratedGiftCard.tsx`)
- Three tiered proposals (signature, alternative, discreet) with serif title, artisan, mono price.
- **Qloo Provenance Anchor** badge explaining which correlation surfaced the item.
- **Export Luxury Presentation** — one-page PDF dossier for principal sign-off.

### 5.6 DiningProposalCard (`RichCards/DiningProposalCard.tsx`)
Venue, cuisine, neighbourhood, vibe anchor and pairing notes. Pairing notes automatically respect alcohol and dietary taboos.

### 5.7 ComplianceAuditCard (`RichCards/ComplianceAuditCard.tsx`)
- Hero badge: emerald **100% FCPA & Taboo Compliant** or crimson **Compliance Hold**.
- Audit table: Budget ceiling, FCPA risk, Alcohol / dietary taboo, Religious & cultural taboo, Gifting precedent.
- Blocked items list with the exact reason they were removed.

### 5.8 Grounding Toggle & Side-by-Side (`TopNavBar.tsx`)
- **Qloo Cultural Grounding ON:** full MCP + Qloo flow → rare vinyl pressings, Bizen ceramics, private omakase counters.
- **OFF (Generic LLM):** simulated unguided model output → engraved pen sets, fruit baskets, IMAX tickets — and the audit card shows exactly where it breaks policy.
- **Side-by-Side:** renders both outcomes in parallel columns for the same principal.

---

## 6. Motion & Physical Depth

```css
/* Dark luxury card with specular top highlight */
.luxury-card {
  background: linear-gradient(145deg, rgba(22, 22, 31, 0.88) 0%, rgba(13, 13, 18, 0.96) 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top-color: rgba(255, 255, 255, 0.12);
  border-bottom-color: rgba(212, 175, 55, 0.12);
  backdrop-filter: blur(16px);
  border-radius: 1rem;
  box-shadow: 0 12px 36px -8px rgba(0, 0, 0, 0.75);
}
```

| Motion | Spec |
| :--- | :--- |
| Card entrance | `opacity 0 → 1`, `translateY 8px → 0`, 420ms `cubic-bezier(0.22, 1, 0.36, 1)`, 70ms stagger. |
| Hover lift | `translateY(-2px)`, border shifts to `border-luxury`, 200ms. |
| Gold sweep | Linear-gradient shimmer across loading skeletons, 1.8s. |
| Toggle | Knob slides 180ms; track fills champagne when grounding is ON. |
| Reduced motion | All of the above collapse to opacity-only fades under `prefers-reduced-motion`. |

---

## 7. Voice & Copy Tone

- Discreet, precise, senior. Write like a chief of staff briefing a CEO, not like a chatbot.
- Prefer concrete nouns ("1972 Blue Note first pressing") over adjectives ("amazing jazz gift").
- Never claim certainty the data does not support; affinity scores are always shown.

---

## 8. Strict Anti-Patterns

- **NEVER** reuse vocabulary from the former healthcare product. The codebase is scanned for legacy terms as part of QA.
- **NEVER** use cyan / teal accents or the generic purple "AI gradient".
- **NEVER** use oversized accessibility-first buttons (56px tremor targets). Use refined B2B proportions (36–44px controls).
- **NEVER** render raw JSON on screen; every payload is formatted into a luxury card.
- **NEVER** display a recommendation that has not passed the compliance guardrail without a visible crimson hold.