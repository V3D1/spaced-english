'use server';

import { z } from 'zod';
import { eq, lte, and, sql, gte, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { flashcards, flashcardReviews } from '@/lib/db/schema';
import type { Flashcard } from '@/lib/db/schema';
import { requireUser } from '@/lib/db/queries';
import { sm2, ReviewQuality } from '@/lib/srs/sm2';
import { revalidatePath } from 'next/cache';
import { localDateString } from '@/lib/utils';
import { FLASHCARD_TYPES, LEARNING_LEVELS } from '@/lib/learning/content';
import type { ReviewMixTag, ReviewQueueCard } from './types';

type FlashcardFilters = {
  cardType?: string;
  level?: string;
  domain?: string;
  pool?: string;
};

function shuffleArray<T>(values: T[]) {
  const list = [...values];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [list[index], list[randomIndex]] = [list[randomIndex], list[index]];
  }
  return list;
}

function dueDaysFromToday(nextReviewDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextReviewDate);
  dueDate.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - dueDate.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function classifyReviewMixTag(card: Flashcard, isLeech: boolean): ReviewMixTag {
  if (isLeech || card.easeFactor <= 2.1) {
    return 'hard';
  }
  if (card.repetitions === 0) {
    return 'new';
  }
  if (card.repetitions >= 4 && card.easeFactor >= 2.6) {
    return 'easy';
  }
  return 'learning';
}

function buildMixedReviewQueue(
  cards: Flashcard[],
  leechSet: Set<number>,
  poolMode?: string | null
): ReviewQueueCard[] {
  const enriched: ReviewQueueCard[] = cards.map((card) => {
    const isLeech = leechSet.has(card.id);
    return {
      ...card,
      isLeech,
      dueDays: dueDaysFromToday(card.nextReviewDate),
      mixTag: classifyReviewMixTag(card, isLeech),
    };
  });

  if (poolMode === 'leech') {
    return enriched.sort((a, b) => b.dueDays - a.dueDays);
  }

  const hard = shuffleArray(enriched.filter((card) => card.mixTag === 'hard'));
  const fresh = shuffleArray(enriched.filter((card) => card.mixTag === 'new'));
  const learning = shuffleArray(enriched.filter((card) => card.mixTag === 'learning'));
  const easy = shuffleArray(enriched.filter((card) => card.mixTag === 'easy'));

  const pattern: ReviewMixTag[] = ['hard', 'new', 'learning', 'hard', 'new', 'easy', 'learning'];
  const byTag: Record<ReviewMixTag, ReviewQueueCard[]> = {
    hard,
    new: fresh,
    learning,
    easy,
  };
  const fallbackOrder: ReviewMixTag[] = ['hard', 'new', 'learning', 'easy'];

  const mixed: ReviewQueueCard[] = [];
  let index = 0;
  while (
    byTag.hard.length > 0 ||
    byTag.new.length > 0 ||
    byTag.learning.length > 0 ||
    byTag.easy.length > 0
  ) {
    const primaryTag = pattern[index % pattern.length];
    let picked = byTag[primaryTag].shift();

    if (!picked) {
      for (const fallbackTag of fallbackOrder) {
        picked = byTag[fallbackTag].shift();
        if (picked) break;
      }
    }

    if (picked) {
      mixed.push(picked);
    }
    index += 1;
  }

  return mixed;
}

function normalizeFlashcardFilters(filters: FlashcardFilters) {
  const normalizedType =
    filters.cardType && FLASHCARD_TYPES.includes(filters.cardType as (typeof FLASHCARD_TYPES)[number])
      ? filters.cardType
      : null;
  const normalizedLevel =
    filters.level && LEARNING_LEVELS.includes(filters.level as (typeof LEARNING_LEVELS)[number])
      ? filters.level
      : null;
  const normalizedDomain =
    filters.domain && ['business', 'tech', 'social'].includes(filters.domain)
      ? filters.domain
      : null;
  const normalizedPool = filters.pool === 'leech' ? 'leech' : null;

  return {
    cardType: normalizedType,
    level: normalizedLevel,
    domain: normalizedDomain,
    pool: normalizedPool,
  };
}

async function getLeechCardIds(userId: number) {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);
  const since = localDateString(sinceDate);

  const rows = await db
    .select({
      flashcardId: flashcardReviews.flashcardId,
      badCount: sql<number>`count(*)`,
    })
    .from(flashcardReviews)
    .innerJoin(flashcards, eq(flashcardReviews.flashcardId, flashcards.id))
    .where(
      and(
        eq(flashcards.userId, userId),
        gte(flashcardReviews.reviewDate, since),
        lte(flashcardReviews.quality, 2)
      )
    )
    .groupBy(flashcardReviews.flashcardId);

  return rows
    .filter((row) => Number(row.badCount) >= 3)
    .map((row) => row.flashcardId);
}

export async function getReviewQueue(filters: FlashcardFilters = {}) {
  const user = await requireUser();
  const today = localDateString();
  const normalized = normalizeFlashcardFilters(filters);
  const leechCardIds = await getLeechCardIds(user.id);
  const leechSet = new Set(leechCardIds);
  const conditions = [
    eq(flashcards.userId, user.id),
    lte(flashcards.nextReviewDate, today),
  ];

  if (normalized.cardType) {
    conditions.push(eq(flashcards.cardType, normalized.cardType));
  }
  if (normalized.level) {
    conditions.push(eq(flashcards.level, normalized.level));
  }
  if (normalized.domain) {
    conditions.push(eq(flashcards.domain, normalized.domain));
  }
  if (normalized.pool === 'leech') {
    if (leechCardIds.length === 0) {
      return [];
    }
    conditions.push(inArray(flashcards.id, leechCardIds));
  }

  const cards = await db
    .select()
    .from(flashcards)
    .where(and(...conditions))
    .orderBy(flashcards.nextReviewDate);

  return buildMixedReviewQueue(cards, leechSet, normalized.pool);
}

export async function getAllFlashcards(filters: FlashcardFilters = {}) {
  const user = await requireUser();
  const normalized = normalizeFlashcardFilters(filters);
  const conditions = [eq(flashcards.userId, user.id)];

  if (normalized.cardType) {
    conditions.push(eq(flashcards.cardType, normalized.cardType));
  }
  if (normalized.level) {
    conditions.push(eq(flashcards.level, normalized.level));
  }
  if (normalized.domain) {
    conditions.push(eq(flashcards.domain, normalized.domain));
  }
  if (normalized.pool === 'leech') {
    const leechCardIds = await getLeechCardIds(user.id);
    if (leechCardIds.length === 0) {
      return [];
    }
    conditions.push(inArray(flashcards.id, leechCardIds));
  }

  return db
    .select()
    .from(flashcards)
    .where(and(...conditions))
    .orderBy(flashcards.createdAt);
}

export async function getLeechSummary() {
  const user = await requireUser();
  const leechCardIds = await getLeechCardIds(user.id);
  if (leechCardIds.length === 0) {
    return { total: 0, due: 0 };
  }

  const today = localDateString();
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      due: sql<number>`sum(case when ${flashcards.nextReviewDate} <= ${today} then 1 else 0 end)`,
    })
    .from(flashcards)
    .where(
      and(eq(flashcards.userId, user.id), inArray(flashcards.id, leechCardIds))
    );

  return {
    total: Number(row?.total || 0),
    due: Number(row?.due || 0),
  };
}

export async function reviewFlashcard(flashcardId: number, quality: ReviewQuality) {
  const user = await requireUser();

  const [card] = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.id, flashcardId), eq(flashcards.userId, user.id)))
    .limit(1);

  if (!card) {
    return { error: 'Flashcard not found' };
  }

  const result = sm2({
    quality,
    repetitions: card.repetitions,
    interval: card.interval,
    easeFactor: card.easeFactor,
  });

  const today = localDateString();

  await db
    .update(flashcards)
    .set({
      repetitions: result.repetitions,
      interval: result.interval,
      easeFactor: result.easeFactor,
      nextReviewDate: result.nextReviewDate,
    })
    .where(eq(flashcards.id, flashcardId));

  await db.insert(flashcardReviews).values({
    flashcardId,
    reviewDate: today,
    quality,
    intervalAfter: result.interval,
    easeFactorAfter: result.easeFactor,
  });

  revalidatePath('/flashcards');
  return { success: true, nextReviewDate: result.nextReviewDate };
}

const addFlashcardSchema = z.object({
  front: z.string().min(1, 'Front text is required'),
  back: z.string().min(1, 'Back text is required'),
  keyPhrase: z.string().optional(),
  domain: z.string().optional(),
  level: z.string().optional(),
  cardType: z.string().optional(),
  source: z.string().optional(),
});

export async function addFlashcard(formData: FormData) {
  const user = await requireUser();

  const parsed = addFlashcardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const today = localDateString();

  // Check daily limit (max 10 new cards/day)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(flashcards)
    .where(
      and(
        eq(flashcards.userId, user.id),
        eq(flashcards.repetitions, 0),
        eq(flashcards.nextReviewDate, today)
      )
    );

  if (countResult.count >= 10) {
    return { error: 'Daily limit reached (max 10 new cards/day)' };
  }

  const [card] = await db
    .insert(flashcards)
    .values({
      userId: user.id,
      front: parsed.data.front,
      back: parsed.data.back,
      keyPhrase: parsed.data.keyPhrase || null,
      domain: parsed.data.domain || null,
      level:
        parsed.data.level && LEARNING_LEVELS.includes(parsed.data.level as (typeof LEARNING_LEVELS)[number])
          ? parsed.data.level
          : 'C1',
      cardType:
        parsed.data.cardType &&
        FLASHCARD_TYPES.includes(parsed.data.cardType as (typeof FLASHCARD_TYPES)[number])
          ? parsed.data.cardType
          : 'sentence',
      source: parsed.data.source || null,
      nextReviewDate: today,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    })
    .returning();

  revalidatePath('/flashcards');
  return { success: true, id: card.id };
}
