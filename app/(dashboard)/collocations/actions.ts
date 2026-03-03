'use server';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { collocations, flashcards } from '@/lib/db/schema';
import { requireUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { localDateString } from '@/lib/utils';

const PASSIVE_THRESHOLD = 45;
const ACTIVE_THRESHOLD = 80;

function normalizeForCompare(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function evaluateStatus(score: number, correctStreak: number, totalAttempts: number) {
  if (score >= ACTIVE_THRESHOLD && correctStreak >= 3 && totalAttempts >= 5) {
    return 'A' as const;
  }
  if (score >= PASSIVE_THRESHOLD) {
    return 'P' as const;
  }
  return 'N' as const;
}

function applyAttemptOutcome(collocation: (typeof collocations.$inferSelect), isCorrect: boolean) {
  const nextTotalAttempts = collocation.totalAttempts + 1;

  if (isCorrect) {
    const nextCorrectStreak = collocation.correctStreak + 1;
    const scoreGain = nextCorrectStreak >= 2 ? 14 : 10;
    const nextScore = Math.min(100, collocation.masteryScore + scoreGain);
    const nextStatus = evaluateStatus(nextScore, nextCorrectStreak, nextTotalAttempts);

    return {
      status: nextStatus,
      masteryScore: nextScore,
      totalAttempts: nextTotalAttempts,
      correctStreak: nextCorrectStreak,
      wrongStreak: 0,
      adoptionCount: collocation.adoptionCount + 1,
      isHard: false,
    };
  }

  const nextWrongStreak = collocation.wrongStreak + 1;
  const scoreLoss = nextWrongStreak >= 2 ? 20 : 14;
  const nextScore = Math.max(0, collocation.masteryScore - scoreLoss);
  const nextStatus = evaluateStatus(nextScore, 0, nextTotalAttempts);

  return {
    status: nextStatus,
    masteryScore: nextScore,
    totalAttempts: nextTotalAttempts,
    correctStreak: 0,
    wrongStreak: nextWrongStreak,
    adoptionCount: Math.max(0, collocation.adoptionCount - 1),
    isHard: nextWrongStreak >= 2,
  };
}

export async function getAllCollocations() {
  const user = await requireUser();
  return db
    .select()
    .from(collocations)
    .where(eq(collocations.userId, user.id))
    .orderBy(collocations.domain, collocations.phrase);
}

export async function updateCollocationStatus(
  collocationId: number,
  status: 'N' | 'P' | 'A'
) {
  const user = await requireUser();

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

  if (!collocation) {
    return { error: 'Collocation not found' };
  }

  await db
    .update(collocations)
    .set({ status })
    .where(eq(collocations.id, collocationId));

  revalidatePath('/collocations');
  return { success: true };
}

export async function incrementAdoption(collocationId: number) {
  const user = await requireUser();

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

  if (!collocation) {
    return { error: 'Collocation not found' };
  }

  const next = applyAttemptOutcome(collocation, true);

  await db
    .update(collocations)
    .set({
      adoptionCount: next.adoptionCount,
      status: next.status,
      masteryScore: next.masteryScore,
      totalAttempts: next.totalAttempts,
      correctStreak: next.correctStreak,
      wrongStreak: next.wrongStreak,
    })
    .where(eq(collocations.id, collocationId));

  revalidatePath('/collocations');
  revalidatePath('/dashboard');
  return {
    success: true,
    newCount: next.adoptionCount,
    newStatus: next.status,
    masteryScore: next.masteryScore,
  };
}

export async function submitDrillAttempt(collocationId: number, answer: string) {
  const user = await requireUser();

  const [collocation] = await db
    .select()
    .from(collocations)
    .where(and(eq(collocations.id, collocationId), eq(collocations.userId, user.id)))
    .limit(1);

  if (!collocation) {
    return { error: 'Collocation not found' };
  }

  const isCorrect =
    normalizeForCompare(answer) === normalizeForCompare(collocation.phrase);
  const next = applyAttemptOutcome(collocation, isCorrect);

  await db
    .update(collocations)
    .set({
      adoptionCount: next.adoptionCount,
      status: next.status,
      masteryScore: next.masteryScore,
      totalAttempts: next.totalAttempts,
      correctStreak: next.correctStreak,
      wrongStreak: next.wrongStreak,
    })
    .where(eq(collocations.id, collocationId));

  revalidatePath('/collocations');
  revalidatePath('/collocations/drill');
  revalidatePath('/dashboard');

  return {
    success: true,
    isCorrect,
    correctAnswer: collocation.phrase,
    status: next.status,
    masteryScore: next.masteryScore,
    totalAttempts: next.totalAttempts,
    correctStreak: next.correctStreak,
    wrongStreak: next.wrongStreak,
    isHard: next.isHard,
  };
}

export async function addCollocationToFlashcards(collocationId: number) {
  const user = await requireUser();

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

  if (!collocation) {
    return { error: 'Collocation not found' };
  }

  if (collocation.flashcardId) {
    return { error: 'Already added to flashcards' };
  }

  const today = localDateString();

  const [card] = await db
    .insert(flashcards)
    .values({
      userId: user.id,
      front: collocation.translation,
      back: `${collocation.example || collocation.phrase}`,
      keyPhrase: collocation.phrase,
      domain: collocation.domain,
      level: collocation.level,
      cardType: 'sentence',
      source: 'Collocation Bank',
      nextReviewDate: today,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    })
    .returning();

  await db
    .update(collocations)
    .set({ flashcardId: card.id })
    .where(eq(collocations.id, collocationId));

  revalidatePath('/collocations');
  revalidatePath('/flashcards');
  return { success: true };
}
