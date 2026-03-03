import 'server-only';
import { db } from '@/lib/db/drizzle';
import { aiUsageLogs } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { env } from '@/lib/env';

export async function checkAIRateLimit(userId: number): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiUsageLogs)
    .where(
      and(
        eq(aiUsageLogs.userId, userId),
        gte(aiUsageLogs.createdAt, today)
      )
    );

  return Number(result.count) < env.AI_DAILY_LIMIT;
}

export async function recordAIUsage(
  userId: number,
  feature: string,
  inputTokens: number,
  outputTokens: number
) {
  await db.insert(aiUsageLogs).values({
    userId,
    feature,
    inputTokens,
    outputTokens,
  });
}

export async function getAIUsageToday(userId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({
      count: sql<number>`count(*)`,
      totalInput: sql<number>`coalesce(sum(${aiUsageLogs.inputTokens}), 0)`,
      totalOutput: sql<number>`coalesce(sum(${aiUsageLogs.outputTokens}), 0)`,
    })
    .from(aiUsageLogs)
    .where(
      and(
        eq(aiUsageLogs.userId, userId),
        gte(aiUsageLogs.createdAt, today)
      )
    );

  return {
    count: Number(result.count),
    limit: env.AI_DAILY_LIMIT,
    totalInputTokens: Number(result.totalInput),
    totalOutputTokens: Number(result.totalOutput),
  };
}
