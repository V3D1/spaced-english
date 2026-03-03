/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak.
 * Quality ratings: 0 (Again), 2 (Hard), 3 (Good), 5 (Easy)
 */

export type ReviewQuality = 0 | 2 | 3 | 5;

export interface SM2Input {
  quality: ReviewQuality;
  repetitions: number;
  interval: number;
  easeFactor: number;
}

export interface SM2Output {
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string; // ISO date string YYYY-MM-DD
}

export function sm2(input: SM2Input): SM2Output {
  const { quality, repetitions: prevReps, interval: prevInterval, easeFactor: prevEF } = input;

  let repetitions: number;
  let interval: number;
  let easeFactor: number;

  if (quality < 3) {
    // Failed review — reset
    repetitions = 0;
    interval = 1;
    easeFactor = prevEF;
  } else {
    // Successful review
    if (prevReps === 0) {
      interval = 1;
    } else if (prevReps === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * prevEF);
    }

    easeFactor = Math.max(
      1.3,
      prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    repetitions = prevReps + 1;
  }

  const today = new Date();
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + interval);
  const y = nextDate.getFullYear();
  const m = String(nextDate.getMonth() + 1).padStart(2, '0');
  const d = String(nextDate.getDate()).padStart(2, '0');
  const nextReviewDate = `${y}-${m}-${d}`;

  return { repetitions, interval, easeFactor, nextReviewDate };
}

export const QUALITY_LABELS: Record<ReviewQuality, { label: string; color: string }> = {
  0: { label: 'Again', color: 'destructive' },
  2: { label: 'Hard', color: 'orange' },
  3: { label: 'Good', color: 'green' },
  5: { label: 'Easy', color: 'blue' },
};
