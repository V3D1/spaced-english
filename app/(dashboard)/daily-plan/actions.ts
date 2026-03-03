'use server';

import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { requireUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { activityRecords, collocations, flashcards, sentencePractices } from '@/lib/db/schema';
import { localDateString } from '@/lib/utils';

const OUTPUT_TARGET_MINS = 20;

export async function getDailyPlanData() {
  const user = await requireUser();
  const today = localDateString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [wordDueRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(flashcards)
    .where(
      and(
        eq(flashcards.userId, user.id),
        eq(flashcards.cardType, 'word'),
        lte(flashcards.nextReviewDate, today)
      )
    );

  const [sentenceDueRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(flashcards)
    .where(
      and(
        eq(flashcards.userId, user.id),
        eq(flashcards.cardType, 'sentence'),
        lte(flashcards.nextReviewDate, today)
      )
    );

  const [hardRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(collocations)
    .where(and(eq(collocations.userId, user.id), gte(collocations.wrongStreak, 2)));

  const [practiceRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sentencePractices)
    .where(
      and(
        eq(sentencePractices.userId, user.id),
        gte(sentencePractices.createdAt, todayStart)
      )
    );

  const [todayActivity] = await db
    .select()
    .from(activityRecords)
    .where(
      and(
        eq(activityRecords.userId, user.id),
        eq(activityRecords.date, today)
      )
    )
    .limit(1);

  const dueWords = Number(wordDueRow?.count || 0);
  const dueSentences = Number(sentenceDueRow?.count || 0);
  const hardWords = Number(hardRow?.count || 0);
  const practicedToday = Number(practiceRow?.count || 0);
  const outputTodayMins =
    (todayActivity?.aiConvMins || 0) +
    (todayActivity?.writingMins || 0) +
    (todayActivity?.selfTalkMins || 0);

  let firstStepHref = '/practice';
  if (hardWords > 0) {
    firstStepHref = '/collocations/drill?hard=1';
  } else if (dueWords > 0) {
    firstStepHref = '/flashcards?type=word';
  } else if (dueSentences > 0) {
    firstStepHref = '/flashcards?type=sentence';
  } else if (practicedToday < 5) {
    firstStepHref = '/practice';
  } else if (outputTodayMins < OUTPUT_TARGET_MINS) {
    firstStepHref = '/activity';
  } else {
    firstStepHref = '/input-output';
  }

  return {
    dueWords,
    dueSentences,
    hardWords,
    practicedToday,
    outputTodayMins,
    outputTargetMins: OUTPUT_TARGET_MINS,
    firstStepHref,
  };
}
