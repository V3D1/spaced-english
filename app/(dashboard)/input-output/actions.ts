'use server';

import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { requireUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import {
  activityRecords,
  collocations,
  flashcards,
  sentencePractices,
} from '@/lib/db/schema';
import { localDateString } from '@/lib/utils';

const INPUT_TARGET_MINS = 20;
const OUTPUT_TARGET_MINS = 20;
const SENTENCE_TARGET = 5;

function calcInputMins(record: (typeof activityRecords.$inferSelect) | undefined) {
  if (!record) return 0;
  return record.shadowingMins + record.ankiMins + record.collocationMins;
}

function calcOutputMins(record: (typeof activityRecords.$inferSelect) | undefined) {
  if (!record) return 0;
  return record.aiConvMins + record.writingMins + record.selfTalkMins;
}

export async function getInputOutputData() {
  const user = await requireUser();
  const today = localDateString();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartDate = localDateString(weekStart);

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

  const weekActivity = await db
    .select()
    .from(activityRecords)
    .where(
      and(
        eq(activityRecords.userId, user.id),
        gte(activityRecords.date, weekStartDate)
      )
    );

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

  const [sentenceTodayRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sentencePractices)
    .where(
      and(
        eq(sentencePractices.userId, user.id),
        gte(sentencePractices.createdAt, todayStart)
      )
    );

  const inputTodayMins = calcInputMins(todayActivity);
  const outputTodayMins = calcOutputMins(todayActivity);
  const sentenceToday = Number(sentenceTodayRow?.count || 0);

  const inputWeekMins = weekActivity.reduce((sum, record) => sum + calcInputMins(record), 0);
  const outputWeekMins = weekActivity.reduce((sum, record) => sum + calcOutputMins(record), 0);
  const totalWeek = inputWeekMins + outputWeekMins;
  const outputShare = totalWeek > 0 ? Math.round((outputWeekMins / totalWeek) * 100) : 0;

  const inputGap = Math.max(0, INPUT_TARGET_MINS - inputTodayMins);
  const outputGap = Math.max(0, OUTPUT_TARGET_MINS - outputTodayMins);
  const sentenceGap = Math.max(0, SENTENCE_TARGET - sentenceToday);

  return {
    dueWords: Number(wordDueRow?.count || 0),
    dueSentences: Number(sentenceDueRow?.count || 0),
    hardWords: Number(hardRow?.count || 0),
    sentenceToday,
    sentenceGap,
    sentenceTarget: SENTENCE_TARGET,
    inputTodayMins,
    outputTodayMins,
    inputWeekMins,
    outputWeekMins,
    outputShare,
    inputTargetMins: INPUT_TARGET_MINS,
    outputTargetMins: OUTPUT_TARGET_MINS,
    inputGap,
    outputGap,
  };
}
