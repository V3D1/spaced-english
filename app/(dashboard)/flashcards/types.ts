import type { Flashcard } from '@/lib/db/schema';

export type ReviewMixTag = 'hard' | 'new' | 'learning' | 'easy';

export type ReviewQueueCard = Flashcard & {
  mixTag: ReviewMixTag;
  isLeech: boolean;
  dueDays: number;
};
