import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

export function isAIEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Sonnet — coaching, evaluation, agentic reasoning */
export const AI_MODEL = 'claude-sonnet-4-20250514';

/** Haiku — fast tips, cached content */
export const AI_MODEL_FAST = 'claude-haiku-4-5-20251001';
