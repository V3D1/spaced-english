import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// Controllable DB mock
let selectResults: unknown[][] = [];
let selectCallIndex = 0;
let insertReturningResult: unknown[] = [];

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => {
            const result = selectResults[selectCallIndex] ?? [];
            selectCallIndex++;
            return result;
          },
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => insertReturningResult,
        }),
      }),
    }),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  aiDrillTips: {
    tip: 'tip',
    phrase: 'phrase',
    tipType: 'tip_type',
  },
}));

// Mock Anthropic
const mockCreate = vi.fn();

vi.mock('../client', () => ({
  getAnthropicClient: () => ({ messages: { create: mockCreate } }),
  AI_MODEL_FAST: 'claude-haiku-4-5-20251001',
  isAIEnabled: () => true,
}));

import { getDrillTip } from '../drill-tips';

describe('getDrillTip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectResults = [];
    selectCallIndex = 0;
    insertReturningResult = [];
  });

  it('returns cached tip on cache hit', async () => {
    selectResults = [[{ tip: 'Cached tip about usage' }]];

    const result = await getDrillTip('move the needle', 'correct');

    expect(result).toBe('Cached tip about usage');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls Haiku on cache miss and persists', async () => {
    // Cache miss (first select returns empty)
    selectResults = [[]];

    // API response
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'New AI generated tip' }],
      usage: { input_tokens: 20, output_tokens: 30 },
    });

    // Insert succeeds
    insertReturningResult = [{ tip: 'New AI generated tip' }];

    const result = await getDrillTip('break new ground', 'incorrect');

    expect(result).toBe('New AI generated tip');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('handles concurrent write conflict gracefully', async () => {
    // Cache miss (first select), then fallback select after conflict
    selectResults = [[], [{ tip: 'Winner tip from other request' }]];

    // API response
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Concurrent tip' }],
      usage: { input_tokens: 20, output_tokens: 30 },
    });

    // Insert returns empty (conflict — another request won)
    insertReturningResult = [];

    const result = await getDrillTip('cut corners', 'correct');

    expect(result).toBe('Winner tip from other request');
  });

  it('returns tip text from API content block', async () => {
    selectResults = [[]];

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Remember: "cut corners" means to do something cheaply.' }],
      usage: { input_tokens: 15, output_tokens: 25 },
    });

    insertReturningResult = [{ tip: 'Remember: "cut corners" means to do something cheaply.' }];

    const result = await getDrillTip('cut corners', 'incorrect');
    expect(result).toContain('cut corners');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
