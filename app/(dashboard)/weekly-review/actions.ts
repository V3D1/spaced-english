'use server';

import { z } from 'zod';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { weeklySummaries, activityRecords } from '@/lib/db/schema';
import { requireUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { localDateString } from '@/lib/utils';

export async function getWeeklyReviews() {
  const user = await requireUser();
  return db
    .select()
    .from(weeklySummaries)
    .where(eq(weeklySummaries.userId, user.id))
    .orderBy(desc(weeklySummaries.weekNumber));
}

export async function getCurrentWeekStats() {
  const user = await requireUser();

  // Calculate current week number
  let weekNumber = 0;
  if (user.planStartDate) {
    const start = new Date(user.planStartDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    weekNumber = Math.floor(diffDays / 7) + 1;
  }

  // Get this week's activity
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const mondayStr = localDateString(monday);
  const todayStr = localDateString(now);

  const weekActivity = await db
    .select()
    .from(activityRecords)
    .where(
      and(
        eq(activityRecords.userId, user.id),
        gte(activityRecords.date, mondayStr),
        lte(activityRecords.date, todayStr)
      )
    );

  const totalMins = weekActivity.reduce((s, r) => s + r.totalMins, 0);
  const activeDays = weekActivity.filter((r) => r.totalMins >= 5).length;

  // Determine phase
  let phase = 0;
  if (weekNumber >= 1 && weekNumber <= 2) phase = 1;
  else if (weekNumber >= 3 && weekNumber <= 6) phase = 2;
  else if (weekNumber >= 7 && weekNumber <= 10) phase = 3;
  else if (weekNumber >= 11) phase = 4;

  return { weekNumber, totalMins, activeDays, phase };
}

const reviewSchema = z.object({
  weekNumber: z.coerce.number().int().min(0),
  phase: z.coerce.number().int().min(0).max(4),
  streak: z.coerce.number().int().min(0),
  totalMins: z.coerce.number().int().min(0),
  wentWell: z.string().min(1, 'Required'),
  wasDifficult: z.string().min(1, 'Required'),
  insightOfWeek: z.string().optional(),
  nextFocus: z.string().optional(),
});

export async function submitWeeklyReview(formData: FormData) {
  const user = await requireUser();

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  // Check if review already exists for this week
  const [existing] = await db
    .select()
    .from(weeklySummaries)
    .where(
      and(
        eq(weeklySummaries.userId, user.id),
        eq(weeklySummaries.weekNumber, parsed.data.weekNumber)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(weeklySummaries)
      .set(parsed.data)
      .where(eq(weeklySummaries.id, existing.id));
  } else {
    await db.insert(weeklySummaries).values({
      userId: user.id,
      ...parsed.data,
    });
  }

  revalidatePath('/weekly-review');
  revalidatePath('/dashboard');
  return { success: true };
}
