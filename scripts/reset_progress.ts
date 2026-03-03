import { eq, sql } from 'drizzle-orm';
import { client, db } from '@/lib/db/drizzle';
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
import { localDateString } from '@/lib/utils';

async function main() {
  const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  if (!email) {
    throw new Error('SEED_USER_EMAIL is required.');
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    throw new Error(`User not found for ${email}.`);
  }

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

  const [flashcardCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(flashcards)
    .where(eq(flashcards.userId, user.id));
  const [collocationCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(collocations)
    .where(eq(collocations.userId, user.id));

  console.log(`Progress reset complete for ${email}.`);
  console.log(`Flashcards reset: ${Number(flashcardCount?.count || 0)}`);
  console.log(`Collocations reset: ${Number(collocationCount?.count || 0)}`);
}

main()
  .catch((error) => {
    console.error('progress reset failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end({ timeout: 5 });
  });
