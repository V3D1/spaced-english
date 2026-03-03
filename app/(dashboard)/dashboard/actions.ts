'use server';

import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  users,
  phases,
  milestones,
  activityRecords,
  flashcards,
  collocations,
} from '@/lib/db/schema';
import { requireUser } from '@/lib/db/queries';
import { getStreak } from '../activity/actions';
import { localDateString } from '@/lib/utils';

export async function getDashboardData() {
  const user = await requireUser();

  // Current week & phase
  let currentWeek = 0;
  let currentPhase = null;
  if (user.planStartDate) {
    const start = new Date(user.planStartDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    currentWeek = Math.floor(diffDays / 7) + 1;
  }

  // Phases
  const allPhases = await db.select().from(phases).orderBy(phases.number);
  if (currentWeek > 0) {
    currentPhase = allPhases.find(
      (p) => currentWeek >= p.weekStart && currentWeek <= p.weekEnd
    ) || allPhases[allPhases.length - 1];
  }

  // Streak
  const streak = await getStreak();

  // Week stats (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = localDateString(sevenDaysAgo);

  const weekActivity = await db
    .select()
    .from(activityRecords)
    .where(
      and(
        eq(activityRecords.userId, user.id),
        gte(activityRecords.date, dateStr)
      )
    )
    .orderBy(activityRecords.date);

  const weekStats = {
    shadowing: weekActivity.reduce((s, r) => s + r.shadowingMins, 0),
    anki: weekActivity.reduce((s, r) => s + r.ankiMins, 0),
    aiConv: weekActivity.reduce((s, r) => s + r.aiConvMins, 0),
    writing: weekActivity.reduce((s, r) => s + r.writingMins, 0),
    selfTalk: weekActivity.reduce((s, r) => s + r.selfTalkMins, 0),
    collocations: weekActivity.reduce((s, r) => s + r.collocationMins, 0),
    total: weekActivity.reduce((s, r) => s + r.totalMins, 0),
  };

  // Milestones
  const userMilestones = await db
    .select()
    .from(milestones)
    .where(eq(milestones.userId, user.id))
    .orderBy(milestones.day);

  // Flashcard stats
  const today = localDateString();
  const [cardStats] = await db
    .select({
      total: sql<number>`count(*)`,
      dueToday: sql<number>`sum(case when ${flashcards.nextReviewDate} <= ${today} then 1 else 0 end)`,
      dueWords: sql<number>`sum(case when ${flashcards.nextReviewDate} <= ${today} and ${flashcards.cardType} = 'word' then 1 else 0 end)`,
      dueSentences: sql<number>`sum(case when ${flashcards.nextReviewDate} <= ${today} and ${flashcards.cardType} = 'sentence' then 1 else 0 end)`,
    })
    .from(flashcards)
    .where(eq(flashcards.userId, user.id));

  // Last 30 days activity for streak calendar
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysStr = localDateString(thirtyDaysAgo);

  const last30Days = await db
    .select({
      date: activityRecords.date,
      totalMins: activityRecords.totalMins,
    })
    .from(activityRecords)
    .where(
      and(
        eq(activityRecords.userId, user.id),
        gte(activityRecords.date, thirtyDaysStr)
      )
    )
    .orderBy(activityRecords.date);

  // Daily collocation — deterministic pick based on date
  const userCollocations = await db
    .select()
    .from(collocations)
    .where(eq(collocations.userId, user.id))
    .orderBy(collocations.id);

  let dailyCollocation = null;
  if (userCollocations.length > 0) {
    // Simple hash: sum of date char codes → index
    const dateChars = today.split('');
    const hash = dateChars.reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const idx = hash % userCollocations.length;
    dailyCollocation = userCollocations[idx];
  }

  return {
    user,
    currentWeek,
    currentPhase,
    allPhases,
    streak,
    weekStats,
    weekActivity,
    milestones: userMilestones,
    cardStats: {
      total: Number(cardStats.total) || 0,
      dueToday: Number(cardStats.dueToday) || 0,
      dueWords: Number(cardStats.dueWords) || 0,
      dueSentences: Number(cardStats.dueSentences) || 0,
    },
    planActive: !!user.planStartDate,
    last30Days,
    dailyCollocation,
  };
}
