'use server';

import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  users,
  activityRecords,
  weeklySummaries,
  sentencePractices,
  flashcards,
  flashcardReviews,
  collocations,
  milestones,
} from '@/lib/db/schema';
import { requireUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { localDateString } from '@/lib/utils';

export async function activatePlan() {
  const user = await requireUser();
  const today = localDateString();

  await db
    .update(users)
    .set({ planStartDate: today })
    .where(eq(users.id, user.id));

  revalidatePath('/dashboard');
  revalidatePath('/settings');
  return { success: true, startDate: today };
}

const efSetSchema = z.object({
  efSetBaseline: z.coerce.number().min(0).max(100).optional(),
  efSetRetest: z.coerce.number().min(0).max(100).optional(),
});

export async function updateEfSetScores(formData: FormData) {
  const user = await requireUser();

  const raw = Object.fromEntries(formData);
  const parsed = efSetSchema.safeParse({
    efSetBaseline: raw.efSetBaseline || undefined,
    efSetRetest: raw.efSetRetest || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await db
    .update(users)
    .set({
      efSetBaseline: parsed.data.efSetBaseline ?? null,
      efSetRetest: parsed.data.efSetRetest ?? null,
    })
    .where(eq(users.id, user.id));

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function resetLearningProgress() {
  const user = await requireUser();
  const today = localDateString();

  await db.delete(activityRecords).where(eq(activityRecords.userId, user.id));
  await db.delete(weeklySummaries).where(eq(weeklySummaries.userId, user.id));
  await db.delete(sentencePractices).where(eq(sentencePractices.userId, user.id));
  await db.execute(
    sql`delete from ${flashcardReviews} where ${flashcardReviews.flashcardId} in (select id from ${flashcards} where ${flashcards.userId} = ${user.id})`
  );

  await db
    .update(flashcards)
    .set({
      nextReviewDate: today,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    })
    .where(eq(flashcards.userId, user.id));

  await db
    .update(collocations)
    .set({
      status: 'N',
      adoptionCount: 0,
      masteryScore: 0,
      totalAttempts: 0,
      correctStreak: 0,
      wrongStreak: 0,
      flashcardId: null,
    })
    .where(eq(collocations.userId, user.id));

  await db
    .update(milestones)
    .set({
      completed: false,
      completedDate: null,
    })
    .where(eq(milestones.userId, user.id));

  await db
    .update(users)
    .set({
      planStartDate: null,
      efSetBaseline: null,
      efSetRetest: null,
    })
    .where(eq(users.id, user.id));

  revalidatePath('/dashboard');
  revalidatePath('/activity');
  revalidatePath('/flashcards');
  revalidatePath('/collocations');
  revalidatePath('/practice');
  revalidatePath('/weekly-review');
  revalidatePath('/settings');

  return { success: true };
}
