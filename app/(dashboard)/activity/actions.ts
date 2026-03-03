'use server';

import { z } from 'zod';
import { eq, and, desc, gte } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { activityRecords } from '@/lib/db/schema';
import { requireUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { localDateString } from '@/lib/utils';

export async function getRecentActivity() {
  const user = await requireUser();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = localDateString(sevenDaysAgo);

  return db
    .select()
    .from(activityRecords)
    .where(
      and(
        eq(activityRecords.userId, user.id),
        gte(activityRecords.date, dateStr)
      )
    )
    .orderBy(desc(activityRecords.date));
}

export async function getStreak() {
  const user = await requireUser();

  const records = await db
    .select()
    .from(activityRecords)
    .where(eq(activityRecords.userId, user.id))
    .orderBy(desc(activityRecords.date));

  if (records.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < records.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    const expectedStr = localDateString(expectedDate);

    const record = records.find((r) => r.date === expectedStr);
    if (record && record.totalMins >= 5) {
      streak++;
    } else if (i === 0 && !record) {
      // Today has no entry yet — check from yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}

const logActivitySchema = z.object({
  shadowingMins: z.coerce.number().int().min(0).default(0),
  ankiMins: z.coerce.number().int().min(0).default(0),
  aiConvMins: z.coerce.number().int().min(0).default(0),
  writingMins: z.coerce.number().int().min(0).default(0),
  selfTalkMins: z.coerce.number().int().min(0).default(0),
  collocationMins: z.coerce.number().int().min(0).default(0),
});

export async function logActivity(formData: FormData) {
  const user = await requireUser();
  const today = localDateString();

  const parsed = logActivitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const data = parsed.data;
  const totalMins =
    data.shadowingMins +
    data.ankiMins +
    data.aiConvMins +
    data.writingMins +
    data.selfTalkMins +
    data.collocationMins;

  if (totalMins === 0) {
    return { error: 'Log at least 1 minute of activity' };
  }

  const isBadDay = totalMins > 0 && totalMins <= 5;

  // Check if entry already exists for today
  const [existing] = await db
    .select()
    .from(activityRecords)
    .where(
      and(
        eq(activityRecords.userId, user.id),
        eq(activityRecords.date, today)
      )
    )
    .limit(1);

  if (existing) {
    // Update existing entry (add minutes)
    await db
      .update(activityRecords)
      .set({
        shadowingMins: existing.shadowingMins + data.shadowingMins,
        ankiMins: existing.ankiMins + data.ankiMins,
        aiConvMins: existing.aiConvMins + data.aiConvMins,
        writingMins: existing.writingMins + data.writingMins,
        selfTalkMins: existing.selfTalkMins + data.selfTalkMins,
        collocationMins: existing.collocationMins + data.collocationMins,
        totalMins: existing.totalMins + totalMins,
        isBadDay: (existing.totalMins + totalMins) <= 5,
      })
      .where(eq(activityRecords.id, existing.id));
  } else {
    await db.insert(activityRecords).values({
      userId: user.id,
      date: today,
      ...data,
      totalMins,
      isBadDay,
    });
  }

  revalidatePath('/activity');
  revalidatePath('/dashboard');
  return { success: true, totalMins };
}
