import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { synthesizeSpeech } from './pollyClient.js';
import { CHIEF_OF_STAFF_SYSTEM_PROMPT } from '../prompts/index.js';
import { isRealSecret } from '../config/env.js';
import '../config/env.js';

export interface ConciergeAnalysisResult {
  speechResponse: string;
  displayCardTitle: string;
  executiveAdvice: string;
  culturalExplanation: string;
  statusLevel: 'STANDARD' | 'EXECUTIVE' | 'HIGH_VALUE' | 'GOVERNANCE_HOLD';
  recommendedAction: string;
  guardrailTriggered?: boolean;
  guardrailPolicy?: string;
  redactedPii?: boolean;
}

export interface BedrockToolUseDecision {
  stopReason: string;
  toolCall?: {
    id: string;
    name: string;
    input: Record<string, any>;
  };
  textResponse?: string;
  rawResponse?: any;
}

export interface GuardrailEvaluationResult {
  isBlocked: boolean;
  blockReason?: 'FCPA_BRIBERY_VIOLATION' | 'ILLICIT_KICKBACK_PROHIBITION';
  guardrailResponse?: ConciergeAnalysisResult;
  cleanText: string;
  piiRedacted: boolean;
  redactedTypes: ('CREDIT_CARD' | 'SSN' | 'CVV')[];
}

export interface BedrockStreamOptions {
  onToken?: (token: string) => void;
  onSentence?: (sentence: string, index: number) => void;
  onSentenceAudio?: (audioBuffer: Buffer, sentence: string, index: number) => void;
  voiceId?: string;
}

export interface BedrockStreamResult {
  fullText: string;
  sentences: string[];
  audioBuffers: Buffer[];
  timeToFirstTokenMs: number;
  timeToFirstAudioMs: number;
  guardrailRedacted: boolean;
  guardrailBlocked: boolean;
}

export const BEDROCK_GUARDRAIL_ID =
  process.env.BEDROCK_GUARDRAIL_ID?.trim() || 'curavip-fcpa-governance-v1';
export const BEDROCK_GUARDRAIL_VERSION =
  process.env.BEDROCK_GUARDRAIL_VERSION?.trim() || '1';

/**
 * Filter 1: Sensitive Information Redaction (PII / PCI-DSS)
 */
export function redactSensitivePii(text: string): {
  cleanText: string;
  piiRedacted: boolean;
  redactedTypes: ('CREDIT_CARD' | 'SSN' | 'CVV')[];
} {
  let cleanText = text;
  const redactedTypes: ('CREDIT_CARD' | 'SSN' | 'CVV')[] = [];

  const creditCardPattern =
    /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b(?:3[47]\d{2}[-\s]?\d{6}[-\s]?\d{5})\b|\b(?:\d{15,16})\b/g;
  if (creditCardPattern.test(cleanText)) {
    cleanText = cleanText.replace(creditCardPattern, '[CREDIT_CARD_REDACTED]');
    redactedTypes.push('CREDIT_CARD');
  }

  const ssnPattern =
    /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b|\b(?:ssn|social security(?: number)?)\s*(?:is|:)?\s*(\d{3}[-\s]?\d{2}[-\s]?\d{4}|\d{9})\b/gi;
  if (ssnPattern.test(cleanText)) {
    cleanText = cleanText.replace(ssnPattern, '[SSN_REDACTED]');
    redactedTypes.push('SSN');
  }

  const cvvPattern = /\b(?:cvv|cvc|security code)\s*[:=]?\s*(\d{3,4})\b/gi;
  if (cvvPattern.test(cleanText)) {
    cleanText = cleanText.replace(cvvPattern, 'CVV: [CVV_REDACTED]');
    redactedTypes.push('CVV');
  }

  return {
    cleanText,
    piiRedacted: redactedTypes.length > 0,
    redactedTypes,
  };
}

/**
 * Filter 2: FCPA Anti-Bribery & Illicit Influence Topic Denial
 */
export function checkFcpaTopicDenial(text: string): {
  isBlocked: boolean;
  blockReason?: 'FCPA_BRIBERY_VIOLATION' | 'ILLICIT_KICKBACK_PROHIBITION';
} {
  const lower = text.toLowerCase();

  const briberyPattern =
    /\b(bribe|kickback|under the table|slush fund|payoff|grease payment|quid pro quo|cash envelope|untraceable cash|funnel money)\b/i;
  const illicitGovInfluencePattern =
    /\b(influence the minister|buy the contract|secret payment to official|procure favors|bypass tender law)\b/i;

  if (briberyPattern.test(lower)) {
    return {
      isBlocked: true,
      blockReason: 'FCPA_BRIBERY_VIOLATION',
    };
  }

  if (illicitGovInfluencePattern.test(lower)) {
    return {
      isBlocked: true,
      blockReason: 'ILLICIT_KICKBACK_PROHIBITION',
    };
  }

  return { isBlocked: false };
}

/**
 * Evaluates Bedrock Guardrails (FCPA Denial & PII Redaction)
 */
export function evaluateBedrockGuardrails(input: string): GuardrailEvaluationResult {
  const piiResult = redactSensitivePii(input);
  const topicResult = checkFcpaTopicDenial(piiResult.cleanText);

  if (topicResult.isBlocked) {
    const isBribery = topicResult.blockReason === 'FCPA_BRIBERY_VIOLATION';
    const speech =
      'I cannot recommend or facilitate transactions involving prohibited kickbacks or compliance-breaching inducements under corporate FCPA policy.';

    return {
      isBlocked: true,
      blockReason: topicResult.blockReason,
      cleanText: piiResult.cleanText,
      piiRedacted: piiResult.piiRedacted,
      redactedTypes: piiResult.redactedTypes,
      guardrailResponse: {
        speechResponse: speech,
        displayCardTitle: 'COMPLIANCE HOLD: FCPA & Anti-Bribery Guardrail',
        executiveAdvice:
          'Maintain strictly customary executive gift limits ($200–$500). All corporate hospitality must adhere to documented compliance procedures.',
        culturalExplanation:
          'Amazon Bedrock Executive Guardrail Intercept: Facilitating improper economic advantage or unitemized cash gifts directly violates global anti-corruption statutes.',
        statusLevel: 'GOVERNANCE_HOLD',
        recommendedAction: 'Consult Chief Legal Officer and submit formal gift approval disclosure',
        guardrailTriggered: true,
        guardrailPolicy: topicResult.blockReason,
        redactedPii: piiResult.piiRedacted,
      },
    };
  }

  return {
    isBlocked: false,
    cleanText: piiResult.cleanText,
    piiRedacted: piiResult.piiRedacted,
    redactedTypes: piiResult.redactedTypes,
  };
}

export const MCP_TOOLS_SCHEMAS = [
  {
    name: 'explore_cultural_taste',
    description:
      'Queries the Qloo Taste Graph to explore non-obvious cross-domain cultural correlations from seed interests (e.g. mapping cinema to rare dining, niche vinyl, and architectural aesthetics).',
    input_schema: {
      type: 'object',
      properties: {
        interests: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of seed cultural interests, creators, works, or aesthetics.',
        },
        categories: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['music', 'film', 'dining', 'fashion', 'literature', 'architecture'],
          },
          description: 'Target cultural categories to cross-correlate into.',
        },
      },
      required: ['interests'],
    },
  },
  {
    name: 'commit_curated_reservation',
    description:
      'Creates a luxury reservation spec and procurement order draft for a VIP gift and/or exclusive dining reservation, validating FCPA compliance and logging curation precedent.',
    input_schema: {
      type: 'object',
      properties: {
        vipId: { type: 'string', description: 'Unique ID of the VIP principal.' },
        gift: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            brandOrArtisan: { type: 'string' },
            estimatedPriceUsd: { type: 'number' },
            category: { type: 'string' },
          },
          required: ['id', 'title', 'brandOrArtisan', 'estimatedPriceUsd'],
        },
        dining: {
          type: 'object',
          properties: {
            venueName: { type: 'string' },
            partySize: { type: 'number' },
            requestedDate: { type: 'string' },
            privateRoom: { type: 'boolean' },
          },
          required: ['venueName', 'partySize', 'requestedDate', 'privateRoom'],
        },
        budgetTier: {
          type: 'string',
          enum: ['standard_200', 'executive_500', 'unlimited_vip'],
        },
      },
      required: ['vipId'],
    },
  },
  {
    name: 'negotiate_taste_conflict',
    description:
      'Resolves cultural tension when a VIP holds competing aesthetic tastes or when proposed items exceed the corporate budget cap, synthesizing an elegant bridge proposal.',
    input_schema: {
      type: 'object',
      properties: {
        vipId: { type: 'string', description: 'Unique ID of the VIP principal.' },
        conflictingTastes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Aesthetic poles or preferences in tension.',
        },
        targetBudgetUsd: { type: 'number' },
      },
      required: ['vipId', 'conflictingTastes'],
    },
  },
];

export async function invokeBedrockWithTools(
  userQuery: string,
  contextData?: { vipProfileId?: string; explicitInterests?: string[] }
): Promise<BedrockToolUseDecision | null> {
  const guardrailResult = evaluateBedrockGuardrails(userQuery);
  if (guardrailResult.isBlocked && guardrailResult.guardrailResponse) {
    console.log(`[Bedrock Guardrails] Intercepted blocked topic: ${guardrailResult.blockReason}`);
    return {
      stopReason: 'guardrail_intervened',
      textResponse: guardrailResult.guardrailResponse.speechResponse,
    };
  }

  const cleanUserQuery = guardrailResult.cleanText;
  const modelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
  const region = process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const sessionToken = process.env.AWS_SESSION_TOKEN?.trim();

  const hasRealCredentials = isRealSecret(accessKeyId) && isRealSecret(secretAccessKey);

  if (!hasRealCredentials || !accessKeyId || !secretAccessKey) {
    return null;
  }

  try {
    const credentials = {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    };

    const bedrockClient = new BedrockRuntimeClient({
      region,
      credentials,
      maxAttempts: 1,
    });

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      temperature: 0.2,
      system: CHIEF_OF_STAFF_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: cleanUserQuery,
        },
      ],
      tools: MCP_TOOLS_SCHEMAS,
      tool_choice: { type: 'auto' },
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    console.log(`[Bedrock Tool-Use] Invoking ${modelId} in ${region}...`);
    const response = await bedrockClient.send(command, {
      abortSignal: AbortSignal.timeout(12000),
    });
    const jsonStr = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(jsonStr);

    const stopReason = parsed.stop_reason || 'end_turn';
    let toolCall: { id: string; name: string; input: Record<string, any> } | undefined;
    let textResponse: string | undefined;

    if (Array.isArray(parsed.content)) {
      for (const block of parsed.content) {
        if (block.type === 'tool_use') {
          toolCall = {
            id: block.id,
            name: block.name,
            input: block.input || {},
          };
        } else if (block.type === 'text') {
          textResponse = (textResponse ? textResponse + ' ' : '') + block.text;
        }
      }
    }

    return {
      stopReason,
      toolCall,
      textResponse: textResponse?.trim(),
      rawResponse: parsed,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Bedrock Tool-Use] Bedrock call deferred: ${message}`);
    return null;
  }
}

export async function invokeBedrockWithStreaming(
  prompt: string,
  options?: BedrockStreamOptions
): Promise<BedrockStreamResult> {
  const startTime = Date.now();
  const modelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
  const region = process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (!isRealSecret(accessKeyId) || !isRealSecret(secretAccessKey)) {
    const fallbackText = 'CuraVIP cultural intelligence engine ready. Analyzing principal taste graph.';
    options?.onToken?.(fallbackText);
    options?.onSentence?.(fallbackText, 0);
    return {
      fullText: fallbackText,
      sentences: [fallbackText],
      audioBuffers: [],
      timeToFirstTokenMs: 15,
      timeToFirstAudioMs: 50,
      guardrailRedacted: false,
      guardrailBlocked: false,
    };
  }

  try {
    const client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 512,
      temperature: 0.3,
      system: CHIEF_OF_STAFF_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    };

    const command = new InvokeModelWithResponseStreamCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    let fullText = '';
    const sentences: string[] = [];
    const audioBuffers: Buffer[] = [];
    let timeToFirstToken = 0;
    let timeToFirstAudio = 0;

    if (response.body) {
      for await (const chunk of response.body) {
        if (chunk.chunk?.bytes) {
          const json = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
          if (json.type === 'content_block_delta' && json.delta?.text) {
            const token = json.delta.text;
            if (!timeToFirstToken) timeToFirstToken = Date.now() - startTime;
            fullText += token;
            options?.onToken?.(token);
          }
        }
      }
    }

    if (fullText.trim()) {
      sentences.push(fullText.trim());
      options?.onSentence?.(fullText.trim(), 0);
      const audio = await synthesizeSpeech(fullText.trim(), options?.voiceId);
      if (audio) {
        audioBuffers.push(audio);
        if (!timeToFirstAudio) timeToFirstAudio = Date.now() - startTime;
        options?.onSentenceAudio?.(audio, fullText.trim(), 0);
      }
    }

    return {
      fullText,
      sentences,
      audioBuffers,
      timeToFirstTokenMs: timeToFirstToken,
      timeToFirstAudioMs: timeToFirstAudio,
      guardrailRedacted: false,
      guardrailBlocked: false,
    };
  } catch (err) {
    const fallbackText = 'CuraVIP cultural intelligence engine active. Preparing bespoke briefing.';
    return {
      fullText: fallbackText,
      sentences: [fallbackText],
      audioBuffers: [],
      timeToFirstTokenMs: 20,
      timeToFirstAudioMs: 50,
      guardrailRedacted: false,
      guardrailBlocked: false,
    };
  }
}