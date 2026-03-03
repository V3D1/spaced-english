'use server';

import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { milestones } from '@/lib/db/schema';
import { requireUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { localDateString } from '@/lib/utils';

export async function toggleMilestone(milestoneId: number) {
  const user = await requireUser();

  const [milestone] = await db
    .select()
    .from(milestones)
    .where(
      and(
        eq(milestones.id, milestoneId),
        eq(milestones.userId, user.id)
      )
    )
    .limit(1);

  if (!milestone) {
    return { error: 'Milestone not found' };
  }

  const today = localDateString();

  await db
    .update(milestones)
    .set({
      completed: !milestone.completed,
      completedDate: milestone.completed ? null : today,
    })
    .where(eq(milestones.id, milestoneId));

  revalidatePath('/dashboard');
  return { success: true };
}
