import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// Mock env
vi.mock('@/lib/env', () => ({
  env: { AI_DAILY_LIMIT: 20 },
}));

// Mock DB with controllable return values
let mockQueryResult: unknown[] = [{ count: 0 }];
const mockInsertValues = vi.fn();

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => mockQueryResult,
      }),
    }),
    insert: () => ({
      values: (...args: unknown[]) => {
        mockInsertValues(...args);
        return Promise.resolve();
      },
    }),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  aiUsageLogs: {
    userId: 'user_id',
    feature: 'feature',
    inputTokens: 'input_tokens',
    outputTokens: 'output_tokens',
    createdAt: 'created_at',
  },
}));

import { checkAIRateLimit, recordAIUsage, getAIUsageToday } from '../rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAIRateLimit', () => {
    it('returns true when under limit', async () => {
      mockQueryResult = [{ count: 5 }];
      const result = await checkAIRateLimit(1);
      expect(result).toBe(true);
    });

    it('returns false when at limit', async () => {
      mockQueryResult = [{ count: 20 }];
      const result = await checkAIRateLimit(1);
      expect(result).toBe(false);
    });

    it('returns false when over limit', async () => {
      mockQueryResult = [{ count: 25 }];
      const result = await checkAIRateLimit(1);
      expect(result).toBe(false);
    });
  });

  describe('recordAIUsage', () => {
    it('inserts usage record', async () => {
      await recordAIUsage(1, 'sentence_coach', 100, 50);
      expect(mockInsertValues).toHaveBeenCalledWith({
        userId: 1,
        feature: 'sentence_coach',
        inputTokens: 100,
        outputTokens: 50,
      });
    });
  });

  describe('getAIUsageToday', () => {
    it('returns usage stats with limit', async () => {
      mockQueryResult = [{ count: 7, totalInput: 500, totalOutput: 200 }];
      const result = await getAIUsageToday(1);
      expect(result.limit).toBe(20);
      expect(result.count).toBe(7);
      expect(result.totalInputTokens).toBe(500);
      expect(result.totalOutputTokens).toBe(200);
    });
  });
});
