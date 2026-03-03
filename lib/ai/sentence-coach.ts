import 'server-only';
import { getAnthropicClient, AI_MODEL } from './client';
import type Anthropic from '@anthropic-ai/sdk';

const EVALUATE_TOOL: Anthropic.Tool = {
  name: 'evaluate_sentence',
  description:
    'Evaluate a sentence written by an English learner using a specific collocation.',
  input_schema: {
    type: 'object' as const,
    properties: {
      naturalness: {
        type: 'number',
        description:
          'Score from 1 to 5. 1=ungrammatical, 2=understandable but awkward, 3=acceptable, 4=natural, 5=native-like.',
      },
      corrected_sentence: {
        type: 'string',
        description:
          'The corrected version of the sentence. If already correct, return the original.',
      },
      explanation: {
        type: 'string',
        description:
          '2-3 sentences explaining what the learner did well and what could improve.',
      },
      alternative_phrase: {
        type: 'string',
        description:
          'An alternative sentence using the same collocation but with a different structure.',
      },
    },
    required: [
      'naturalness',
      'corrected_sentence',
      'explanation',
      'alternative_phrase',
    ],
  },
};

export interface SentenceEvaluation {
  naturalness: number;
  correctedSentence: string;
  explanation: string;
  alternativePhrase: string;
}

export async function evaluateSentence(
  sentence: string,
  collocationPhrase: string,
  collocationTranslation: string,
  collocationExample: string | null
): Promise<{ evaluation: SentenceEvaluation; inputTokens: number; outputTokens: number }> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    system:
      'You are an expert English language coach specializing in collocations and natural phrasing. ' +
      'Evaluate sentences written by B2-C2 learners. Be encouraging but precise. ' +
      'Focus on collocation usage, grammatical accuracy, and natural phrasing.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Evaluate this sentence written by an English learner.

Collocation: "${collocationPhrase}"
Translation: "${collocationTranslation}"
${collocationExample ? `Example: "${collocationExample}"` : ''}

Learner's sentence: "${sentence}"

Use the evaluate_sentence tool to provide your evaluation.`,
          },
        ],
      },
    ],
    tools: [EVALUATE_TOOL],
    tool_choice: { type: 'tool', name: 'evaluate_sentence' },
  });

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  );

  if (!toolBlock) {
    throw new Error('No tool_use block in response');
  }

  const input = toolBlock.input as Record<string, unknown>;

  return {
    evaluation: {
      naturalness: Math.max(1, Math.min(5, Number(input.naturalness) || 3)),
      correctedSentence: String(input.corrected_sentence || sentence),
      explanation: String(input.explanation || ''),
      alternativePhrase: String(input.alternative_phrase || ''),
    },
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
