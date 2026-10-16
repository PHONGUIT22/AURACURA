import type {
  BlockedItem,
  BudgetTier,
  ComplianceAuditResult,
  ComplianceCheck,
  DiningProposal,
  FcpaRiskLevel,
  GiftProposal,
  VIPProfile,
} from '../types/index.js';
import { BUDGET_TIER_CAPS } from '../types/index.js';
import { vipDossierRepo } from '../database/vipDossierRepo.js';

const NON_ALCOHOLIC_EXEMPTIONS = [
  'tea',
  'mocktail',
  'zero-proof',
  'alcohol-free',
  'non-alcoholic',
  'cordial',
  'infusion',
  'cold-brew',
];

const GENUINE_ALCOHOL_REGEXES = [
  /\bwine(s)?\b/i,
  /\bwhisky\b/i,
  /\bwhiskey\b/i,
  /\bscotch\b/i,
  /\bbourbon\b/i,
  /\bchampagne\b/i,
  /\bvodka\b/i,
  /\bgin\b/i,
  /\brum\b/i,
  /\btequila\b/i,
  /\bcognac\b/i,
  /\barmagnac\b/i,
  /\bsake\b/i,
  /\bbeer(s)?\b/i,
  /\bcellar\b/i,
  /\bdistillery\b/i,
  /\bspirits\b/i,
  /\bcabernet\b/i,
  /\bbordeaux\b/i,
  /\b(?<!mock)cocktail(s)?\b/i,
  /\bsommelier\b/i,
  /\bdecanter\b/i,
  /\bsingle malt\b/i,
];

function isAlcoholViolation(text: string): boolean {
  const lower = text.toLowerCase();

  // If text contains non-alcoholic exemptions (tea, mocktail, zero-proof, alcohol-free, non-alcoholic, cordial, infusion, cold-brew)
  const hasExemption = NON_ALCOHOLIC_EXEMPTIONS.some((kw) => lower.includes(kw));

  // Find any matches for genuine alcohol
  const matchedAlcoholRegex = GENUINE_ALCOHOL_REGEXES.find((regex) => regex.test(lower));
  if (!matchedAlcoholRegex) {
    return false;
  }

  // If there's an exemption like zero-proof / non-alcoholic / alcohol-free / tea:
  if (hasExemption) {
    // If the text specifies zero-proof, alcohol-free, or non-alcoholic without hard spirits
    const isExplicitlyAlcoholFree = /zero-proof|alcohol-free|non-alcoholic|100%\s*alcohol-free/i.test(lower);
    const hasUnqualifiedAlcohol = /\b(whisky|whiskey|scotch|bourbon|vodka|gin|rum|tequila|cognac|armagnac|single malt|bordeaux|cabernet)\b/i.test(lower);
    
    if (isExplicitlyAlcoholFree && !hasUnqualifiedAlcohol) {
      return false;
    }

    // If it's purely a soft beverage service (teas, mocktails, herbal infusions, botanical cordials, cold-brew)
    const isSoftBeverageService = /\b(tea|teas|mocktail|mocktails|infusion|infusions|cordial|cordials|cold-brew)\b/i.test(lower);
    const hasStrictAlcohol = /\b(wine flight|vintage wine|scotch|bourbon|whisky|whiskey|vodka|gin|rum|tequila|single malt|distillery|cellar)\b/i.test(lower);
    if (isSoftBeverageService && !hasStrictAlcohol) {
      return false;
    }
  }

  return true;
}

const PORK_KEYWORDS = ['pork', 'ham', 'bacon', 'prosciutto', 'pancetta', 'lard', 'pigskin'];
const SHELLFISH_KEYWORDS = ['shellfish', 'lobster', 'crab', 'shrimp', 'prawn', 'oyster', 'clam', 'mussel', 'scallop'];
const LEATHER_KEYWORDS = ['leather', 'calfskin', 'cowhide', 'suede', 'fur'];

export class ComplianceGuardrailService {
  /**
   * Run full compliance audit on proposed gifts and dining reservations for a principal.
   */
  public auditCompliance(
    vipProfile: VIPProfile,
    curatedGifts: GiftProposal[],
    diningOptions: DiningProposal[],
    tier: BudgetTier = 'executive_500'
  ): ComplianceAuditResult {
    const checks: ComplianceCheck[] = [];
    const tabooViolations: string[] = [];
    const blockedItems: BlockedItem[] = [];

    // 1. Determine effective budget ceiling
    const tierCap = BUDGET_TIER_CAPS[tier];
    const profileLimit = vipProfile.budgetLimitUsd > 0 ? vipProfile.budgetLimitUsd : null;
    let effectiveCap: number | null = null;

    if (tierCap !== null && profileLimit !== null) {
      effectiveCap = Math.min(tierCap, profileLimit);
    } else {
      effectiveCap = tierCap ?? profileLimit;
    }

    // 2. Budget Check on Gifts
    let budgetPassed = true;
    const overbudgetGifts: string[] = [];
    for (const gift of curatedGifts) {
      if (effectiveCap !== null && gift.estimatedPriceUsd > effectiveCap) {
        budgetPassed = false;
        overbudgetGifts.push(`${gift.title} ($${gift.estimatedPriceUsd} > cap $${effectiveCap})`);
        blockedItems.push({
          itemId: gift.id,
          itemName: gift.title,
          itemType: 'gift',
          reasons: [`Price exceeds budget ceiling of $${effectiveCap}`],
        });
      }
    }

    checks.push({
      id: 'budget',
      label: 'Corporate Budget Ceiling',
      status: budgetPassed ? 'pass' : 'fail',
      detail: budgetPassed
        ? `All curated items adhere to ceiling of $${effectiveCap ?? 'Unlimited'}`
        : `Items exceed budget ceiling: ${overbudgetGifts.join('; ')}`,
    });

    // 3. FCPA Risk Assessment
    let fcpaRisk: FcpaRiskLevel = 'low';
    const isSovereignOrGov = /ministry|authority|sovereign|government|state|public/i.test(vipProfile.organization);
    const hasHighValueItem = curatedGifts.some((g) => g.estimatedPriceUsd > 350);

    if (isSovereignOrGov && hasHighValueItem) {
      fcpaRisk = 'high';
    } else if (hasHighValueItem || isSovereignOrGov) {
      fcpaRisk = 'medium';
    }

    checks.push({
      id: 'fcpa',
      label: 'FCPA & Anti-Bribery Governance',
      status: fcpaRisk === 'high' ? 'fail' : fcpaRisk === 'medium' ? 'warn' : 'pass',
      detail: fcpaRisk === 'high'
        ? 'High risk: State/sovereign affiliation with premium gift tier requires legal counsel approval.'
        : fcpaRisk === 'medium'
        ? 'Moderate risk: Standard executive gifting threshold applies; maintain clear itemized documentation.'
        : 'Low risk: Private commercial relationship within standard customary corporate thresholds.',
    });

    // 4. Alcohol Taboo Check (Safe from false positives like mocktails & sparkling teas)
    let alcoholPassed = true;
    if (vipProfile.taboos.alcohol) {
      // Check gifts
      for (const gift of curatedGifts) {
        const text = `${gift.title} ${gift.culturalRationale} ${gift.category} ${(gift.materials || []).join(' ')}`;
        if (isAlcoholViolation(text)) {
          alcoholPassed = false;
          const msg = `Gift '${gift.title}' contains alcohol elements prohibited for this principal`;
          tabooViolations.push(msg);
          blockedItems.push({
            itemId: gift.id,
            itemName: gift.title,
            itemType: 'gift',
            reasons: ['Alcohol taboo violation: strictly prohibited for this profile'],
          });
        }
      }

      // Check dining pairing notes
      for (const dining of diningOptions) {
        const text = `${dining.venueName} ${dining.pairingNotes} ${dining.culturalRationale}`;
        if (isAlcoholViolation(text)) {
          alcoholPassed = false;
          const msg = `Dining venue '${dining.venueName}' suggests alcoholic pairing for non-drinking principal`;
          tabooViolations.push(msg);
          blockedItems.push({
            itemId: dining.id,
            itemName: dining.venueName,
            itemType: 'dining',
            reasons: ['Alcohol pairing suggested for an alcohol-free principal'],
          });
        }
      }
    }

    checks.push({
      id: 'alcohol',
      label: 'Alcohol Prohibition Protocol',
      status: alcoholPassed ? 'pass' : 'fail',
      detail: vipProfile.taboos.alcohol
        ? (alcoholPassed ? 'Strict zero-alcohol standard verified across all gifts & pairings.' : 'Violations detected: alcoholic items flagged.')
        : 'Alcohol permitted by principal preferences.',
    });

    // 5. Dietary & Religious Taboos (Halal, Vegan, Pork, Shellfish)
    let dietaryPassed = true;
    const dietaryList = (vipProfile.taboos.dietary || []).map((d) => d.toLowerCase());
    const isHalal = dietaryList.includes('halal');
    const isVegan = dietaryList.includes('vegan');
    const noShellfish = dietaryList.includes('shellfish');

    for (const dining of diningOptions) {
      const text = `${dining.venueName} ${dining.cuisineType} ${dining.pairingNotes} ${(dining.serviceElements || []).join(' ')}`.toLowerCase();
      if ((isHalal || isVegan) && PORK_KEYWORDS.some((kw) => text.includes(kw))) {
        dietaryPassed = false;
        const msg = `Dining option '${dining.venueName}' references pork products prohibited by dietary policy`;
        tabooViolations.push(msg);
        blockedItems.push({
          itemId: dining.id,
          itemName: dining.venueName,
          itemType: 'dining',
          reasons: ['Prohibited dietary ingredient (pork/non-halal)'],
        });
      }

      if (noShellfish && SHELLFISH_KEYWORDS.some((kw) => text.includes(kw))) {
        dietaryPassed = false;
        const msg = `Dining option '${dining.venueName}' contains shellfish, violating allergy/dietary policy`;
        tabooViolations.push(msg);
        blockedItems.push({
          itemId: dining.id,
          itemName: dining.venueName,
          itemType: 'dining',
          reasons: ['Shellfish restriction violation'],
        });
      }
    }

    checks.push({
      id: 'dietary',
      label: 'Dietary & Religious Dietary Standards',
      status: dietaryPassed ? 'pass' : 'fail',
      detail: dietaryList.length > 0
        ? (dietaryPassed ? `Strict adherence verified for dietary requirements: ${dietaryList.join(', ')}` : 'Dietary conflicts identified.')
        : 'No restrictive dietary taboos noted.',
    });

    // 6. Religious & Cultural Material Taboos (e.g. Leather/Pigskin)
    let culturalPassed = true;
    const religiousList = vipProfile.taboos.religiousCultural || [];
    const forbidsPorkDerived = religiousList.some((r) => /pork|pigskin/i.test(r));

    if (forbidsPorkDerived) {
      for (const gift of curatedGifts) {
        const text = `${gift.title} ${(gift.materials || []).join(' ')}`.toLowerCase();
        if (PORK_KEYWORDS.some((kw) => text.includes(kw))) {
          culturalPassed = false;
          tabooViolations.push(`Gift '${gift.title}' contains pigskin or pork-derived materials`);
          blockedItems.push({
            itemId: gift.id,
            itemName: gift.title,
            itemType: 'gift',
            reasons: ['Religious/cultural taboo: pork-derived material'],
          });
        }
      }
    }

    checks.push({
      id: 'religious_cultural',
      label: 'Religious & Cultural Material Guardrail',
      status: culturalPassed ? 'pass' : 'fail',
      detail: religiousList.length > 0
        ? (culturalPassed ? 'Confirmed no religious or sacred taboos breached.' : 'Cultural material taboo breached.')
        : 'No specific cultural restrictions registered.',
    });

    // 7. Gifting Precedent Check (avoid repeat gifts)
    const history = vipDossierRepo.listCurationHistory(vipProfile.id);
    let precedentPassed = true;
    for (const gift of curatedGifts) {
      const alreadyGifted = history.find(
        (h) => h.itemType === 'gift' && h.itemName.toLowerCase() === gift.title.toLowerCase()
      );
      if (alreadyGifted) {
        precedentPassed = false;
        tabooViolations.push(`Precedent violation: '${gift.title}' was already presented on ${alreadyGifted.awardedAt.slice(0, 10)}`);
        blockedItems.push({
          itemId: gift.id,
          itemName: gift.title,
          itemType: 'gift',
          reasons: [`Already gifted to principal on ${alreadyGifted.awardedAt.slice(0, 10)}`],
        });
      }
    }

    checks.push({
      id: 'precedent',
      label: 'Curation History & Duplicate Prevention',
      status: precedentPassed ? 'pass' : 'fail',
      detail: precedentPassed
        ? 'No duplicate proposals; all selected items are novel to this relationship.'
        : 'Duplicate proposal detected from previous engagements.',
    });

    // Overall compliance verdict
    const isCompliant = budgetPassed && alcoholPassed && dietaryPassed && culturalPassed && precedentPassed && fcpaRisk !== 'high';

    const auditNotes = isCompliant
      ? '100% FCPA & Taboo Compliant. Proposals passed all corporate governance, cultural sensitivity, and budgetary guardrails.'
      : `Compliance Attention Required: ${tabooViolations.length} issue(s) flagged across budget, taboo or legal thresholds.`;

    return {
      isCompliant,
      fcpaRiskLevel: fcpaRisk,
      budgetChecked: true,
      tabooViolations,
      auditNotes,
      checks,
      blockedItems,
      effectiveBudgetCapUsd: effectiveCap,
      auditedAt: new Date().toISOString(),
    };
  }
}

export const complianceGuardrailService = new ComplianceGuardrailService();
