'use server';

import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { aiWeeklyRecommendations, collocations } from '@/lib/db/schema';
import { requireUser } from '@/lib/db/queries';
import { isAIEnabled } from '@/lib/ai/client';
import { checkAIRateLimit, recordAIUsage } from '@/lib/ai/rate-limit';
import { runReviewAgent } from '@/lib/ai/review-agent';

function getWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

export async function getWeeklyAIRecommendations() {
  const user = await requireUser();

  if (!isAIEnabled()) {
    return { error: 'AI features are not enabled' };
  }

  const weekKey = getWeekKey();

  // Check cache
  const [cached] = await db
    .select()
    .from(aiWeeklyRecommendations)
    .where(
      and(
        eq(aiWeeklyRecommendations.userId, user.id),
        eq(aiWeeklyRecommendations.weekKey, weekKey)
      )
    )
    .limit(1);

  if (cached) {
    const focusIds = JSON.parse(cached.focusIds) as number[];
    const focusCollocations = focusIds.length > 0
      ? await db
          .select({ id: collocations.id, phrase: collocations.phrase, domain: collocations.domain })
          .from(collocations)
          .where(eq(collocations.userId, user.id))
      : [];

    return {
      recommendations: {
        focusCollocations: focusCollocations.filter((c) =>
          focusIds.includes(c.id)
        ),
        patternAnalysis: cached.patternAnalysis,
        difficultyAdvice: cached.difficultyAdvice,
      },
      cached: true,
    };
  }

  // Rate limit check
  const withinLimit = await checkAIRateLimit(user.id);
  if (!withinLimit) {
    return { error: 'Daily AI limit reached. Try again tomorrow.' };
  }

  // Run agent
  const { recommendations, inputTokens, outputTokens } = await runReviewAgent(
    user.id
  );

  // Persist
  await db.insert(aiWeeklyRecommendations).values({
    userId: user.id,
    weekKey,
    focusIds: JSON.stringify(recommendations.focusIds),
    patternAnalysis: recommendations.patternAnalysis,
    difficultyAdvice: recommendations.difficultyAdvice,
  });

  await recordAIUsage(user.id, 'review_agent', inputTokens, outputTokens);

  // Load focus collocation details
  const focusCollocations =
    recommendations.focusIds.length > 0
      ? (
          await db
            .select({
              id: collocations.id,
              phrase: collocations.phrase,
              domain: collocations.domain,
            })
            .from(collocations)
            .where(eq(collocations.userId, user.id))
        ).filter((c) => recommendations.focusIds.includes(c.id))
      : [];

  return {
    recommendations: {
      focusCollocations,
      patternAnalysis: recommendations.patternAnalysis,
      difficultyAdvice: recommendations.difficultyAdvice,
    },
    cached: false,
  };
}
