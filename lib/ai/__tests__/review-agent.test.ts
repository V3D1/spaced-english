import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// Mock DB — review-agent uses db.select().from().where() chains
// The simplest approach: mock the entire handleToolCall results via db
const emptyChain = {
  where: () => emptyChain,
  orderBy: () => emptyChain,
  limit: () => [],
  innerJoin: () => emptyChain,
  groupBy: () => emptyChain,
  having: () => emptyChain,
  then: (resolve: (v: unknown[]) => void) => resolve([]),
  [Symbol.iterator]: function* () { /* empty */ },
};

// Make it thenable (Promise-like) so `await db.select()...` resolves to []
Object.defineProperty(emptyChain, 'then', {
  value: (resolve: (v: unknown[]) => void) => resolve([]),
  enumerable: false,
});

const mockDbSelect = vi.fn().mockReturnValue({
  from: () => emptyChain,
});

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect(...args),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  collocations: { id: 'id', userId: 'user_id', phrase: 'phrase', domain: 'domain', level: 'level', status: 'status', masteryScore: 'mastery_score', totalAttempts: 'total_attempts', correctStreak: 'correct_streak', wrongStreak: 'wrong_streak' },
  sentencePractices: { collocationId: 'collocation_id', userId: 'user_id' },
  flashcards: { id: 'id', userId: 'user_id', front: 'front', back: 'back' },
  flashcardReviews: { flashcardId: 'flashcard_id', quality: 'quality' },
}));

// Mock Anthropic
const mockCreate = vi.fn();

vi.mock('../client', () => ({
  getAnthropicClient: () => ({ messages: { create: mockCreate } }),
  AI_MODEL: 'claude-sonnet-4-20250514',
}));

import { runReviewAgent } from '../review-agent';

describe('runReviewAgent', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('completes when submit_recommendations is called', async () => {
    // First call: agent calls data tools
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'call_1',
          name: 'get_collocation_stats',
          input: {},
        },
      ],
      stop_reason: 'tool_use',
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    // Second call: agent submits recommendations
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'call_2',
          name: 'submit_recommendations',
          input: {
            focus_collocation_ids: [1, 5, 12],
            pattern_analysis: 'You struggle with business collocations.',
            difficulty_advice: 'Focus on C1 phrases before moving to C2.',
          },
        },
      ],
      stop_reason: 'end_turn',
      usage: { input_tokens: 200, output_tokens: 100 },
    });

    const result = await runReviewAgent(1);

    expect(result.recommendations.focusIds).toEqual([1, 5, 12]);
    expect(result.recommendations.patternAnalysis).toContain('business');
    expect(result.recommendations.difficultyAdvice).toContain('C1');
    expect(result.inputTokens).toBe(300);
    expect(result.outputTokens).toBe(150);
  });

  it('respects max iterations limit', async () => {
    // Agent keeps calling data tools but never submits
    for (let i = 0; i < 6; i++) {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'tool_use',
            id: `call_${i}`,
            name: 'get_collocation_stats',
            input: {},
          },
        ],
        stop_reason: 'tool_use',
        usage: { input_tokens: 50, output_tokens: 25 },
      });
    }

    const result = await runReviewAgent(1);

    // Should have only made MAX_ITERATIONS (5) calls
    expect(mockCreate).toHaveBeenCalledTimes(5);
    // Fallback recommendation
    expect(result.recommendations.focusIds).toEqual([]);
    expect(result.recommendations.patternAnalysis).toContain('try again');
  });

  it('handles multi-tool calls in single response', async () => {
    // Agent calls multiple tools at once
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'call_a',
          name: 'get_collocation_stats',
          input: {},
        },
        {
          type: 'tool_use',
          id: 'call_b',
          name: 'get_recent_drill_performance',
          input: {},
        },
      ],
      stop_reason: 'tool_use',
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    // Then submits
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'call_c',
          name: 'submit_recommendations',
          input: {
            focus_collocation_ids: [3],
            pattern_analysis: 'Good progress overall.',
            difficulty_advice: 'Keep it up.',
          },
        },
      ],
      stop_reason: 'end_turn',
      usage: { input_tokens: 150, output_tokens: 75 },
    });

    const result = await runReviewAgent(1);
    expect(result.recommendations.focusIds).toEqual([3]);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
