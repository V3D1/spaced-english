'use server';

import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { collocations, sentencePractices } from '@/lib/db/schema';
import { requireUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';

export async function getPracticePool() {
  const user = await requireUser();
  return db
    .select()
    .from(collocations)
    .where(eq(collocations.userId, user.id))
    .orderBy(collocations.level, collocations.domain, collocations.phrase);
}

export async function submitSentence(collocationId: number, sentence: string) {
  const user = await requireUser();

  const trimmed = sentence.trim();
  if (!trimmed) return { error: 'Sentence cannot be empty' };
  if (trimmed.length < 5) return { error: 'Write a longer sentence' };

  // Verify collocation belongs to user
  const [collocation] = await db
    .select()
    .from(collocations)
    .where(
      and(
        eq(collocations.id, collocationId),
        eq(collocations.userId, user.id)
      )
    )
    .limit(1);

  if (!collocation) return { error: 'Collocation not found' };

  await db.insert(sentencePractices).values({
    userId: user.id,
    collocationId,
    sentence: trimmed,
  });

  revalidatePath('/practice');
  return { success: true };
}

export async function getSentenceHistory() {
  const user = await requireUser();

  return db
    .select({
      id: sentencePractices.id,
      sentence: sentencePractices.sentence,
      createdAt: sentencePractices.createdAt,
      phrase: collocations.phrase,
      domain: collocations.domain,
    })
    .from(sentencePractices)
    .innerJoin(collocations, eq(sentencePractices.collocationId, collocations.id))
    .where(eq(sentencePractices.userId, user.id))
    .orderBy(desc(sentencePractices.createdAt))
    .limit(20);
}

export async function getPracticeStats() {
  const user = await requireUser();

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(sentencePractices)
    .where(eq(sentencePractices.userId, user.id));

  const domainStats = await db
    .select({
      domain: collocations.domain,
      count: sql<number>`count(*)`,
    })
    .from(sentencePractices)
    .innerJoin(collocations, eq(sentencePractices.collocationId, collocations.id))
    .where(eq(sentencePractices.userId, user.id))
    .groupBy(collocations.domain);

  return {
    total: Number(stats.total) || 0,
    byDomain: domainStats.map((d) => ({
      domain: d.domain,
      count: Number(d.count),
    })),
  };
}
