import { vipDossierRepo } from '../database/vipDossierRepo.js';
import { seedDemoData } from '../database/seedDemoData.js';
import { TASTE_CLUSTERS } from '../services/curatedTasteGraph.js';

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const VIP_ROSTER_URI = 'curavip://principals/roster';
export const TASTE_CLUSTERS_URI = 'curavip://taste-graph/clusters';
export const COMPLIANCE_GUIDELINES_URI = 'curavip://compliance/fcpa-guidelines';

export const registeredResources: ResourceDefinition[] = [
  {
    uri: VIP_ROSTER_URI,
    name: 'VIP Principals Directory & Strategic Profiles',
    description: 'Current active VIP dealmaker roster with explicit interests, aesthetic preferences, budget limits, and ethical/dietary taboos.',
    mimeType: 'application/json',
  },
  {
    uri: TASTE_CLUSTERS_URI,
    name: 'Qloo Cross-Domain Taste Ontology & Clusters',
    description: 'Reference cultural taste graph correlations mapping cinema, architecture, dining, music, fashion, and literature.',
    mimeType: 'application/json',
  },
  {
    uri: COMPLIANCE_GUIDELINES_URI,
    name: 'Executive Gifting & FCPA Governance Policy',
    description: 'Corporate gifting compliance limits ($200/$500 tiers), anti-bribery statutes, and religious taboo guardrails.',
    mimeType: 'application/json',
  },
];

export async function readResourceHandler(uri: string): Promise<{
  contents: Array<{
    uri: string;
    mimeType: string;
    text: string;
  }>;
}> {
  seedDemoData();

  if (uri === VIP_ROSTER_URI) {
    const profiles = vipDossierRepo.listProfiles();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              totalCount: profiles.length,
              generatedAt: new Date().toISOString(),
              principals: profiles,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === TASTE_CLUSTERS_URI) {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              system: 'CuraVIP Cultural Taste Graph',
              totalClusters: TASTE_CLUSTERS.length,
              clusters: TASTE_CLUSTERS,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === COMPLIANCE_GUIDELINES_URI) {
    const guidelines = {
      standardBudgetTierUsd: 200,
      executiveBudgetTierUsd: 500,
      fcpaPrinciples: [
        'No gifts presented to foreign government officials with expectation of improper business advantage.',
        'Items above $250 require formal executive itemization.',
        'Zero tolerance for gifts violating declared religious, dietary, or personal alcohol prohibitions.',
      ],
      strictTaboos: ['alcohol', 'pork_derivatives', 'shellfish_allergen', 'unsolicited_high_value_luxury'],
    };

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(guidelines, null, 2),
        },
      ],
    };
  }

  throw new Error(`MCP Resource '${uri}' is not registered in CuraVIP.`);
}
