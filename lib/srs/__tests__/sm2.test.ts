import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sm2, type SM2Input } from '../sm2';

function makeInput(overrides: Partial<SM2Input> = {}): SM2Input {
  return {
    quality: 3,
    repetitions: 0,
    interval: 1,
    easeFactor: 2.5,
    ...overrides,
  };
}

describe('SM-2 Algorithm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Quality 0 (Again) ---
  it('resets interval to 1 on quality 0 (Again)', () => {
    const result = sm2(makeInput({ quality: 0, repetitions: 5, interval: 30 }));
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
  });

  it('preserves ease factor on quality 0', () => {
    const result = sm2(makeInput({ quality: 0, easeFactor: 2.1 }));
    expect(result.easeFactor).toBe(2.1);
  });

  // --- Quality 2 (Hard) ---
  it('resets repetitions on quality 2 (Hard)', () => {
    const result = sm2(makeInput({ quality: 2, repetitions: 3, interval: 15 }));
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  // --- Quality 3 (Good) ---
  it('sets interval to 1 on first successful review', () => {
    const result = sm2(makeInput({ quality: 3, repetitions: 0 }));
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  it('sets interval to 6 on second successful review', () => {
    const result = sm2(makeInput({ quality: 3, repetitions: 1, interval: 1 }));
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  it('calculates interval as round(prevInterval * easeFactor) on third+ review', () => {
    const result = sm2(makeInput({ quality: 3, repetitions: 2, interval: 6, easeFactor: 2.5 }));
    expect(result.interval).toBe(15); // round(6 * 2.5) = 15
    expect(result.repetitions).toBe(3);
  });

  // --- Quality 5 (Easy) ---
  it('increases ease factor on quality 5', () => {
    const result = sm2(makeInput({ quality: 5, repetitions: 2, interval: 6, easeFactor: 2.5 }));
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  // --- Ease factor floor ---
  it('never drops ease factor below 1.3', () => {
    // quality 3 with low ease factor should clamp at 1.3
    const result = sm2(makeInput({ quality: 3, easeFactor: 1.3 }));
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('clamps ease factor at 1.3 even with repeated low quality', () => {
    // Simulate multiple Hard ratings pushing EF down
    let ef = 2.5;
    for (let i = 0; i < 20; i++) {
      const result = sm2(makeInput({ quality: 3, repetitions: 0, easeFactor: ef }));
      ef = result.easeFactor;
    }
    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  // --- Next review date ---
  it('nextReviewDate is in the future', () => {
    const result = sm2(makeInput({ quality: 3 }));
    const today = new Date('2026-03-01');
    const nextDate = new Date(result.nextReviewDate);
    expect(nextDate.getTime()).toBeGreaterThan(today.getTime());
  });

  it('nextReviewDate format is YYYY-MM-DD', () => {
    const result = sm2(makeInput({ quality: 3 }));
    expect(result.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('nextReviewDate is tomorrow for interval=1', () => {
    const result = sm2(makeInput({ quality: 3, repetitions: 0 }));
    expect(result.nextReviewDate).toBe('2026-03-02');
  });

  it('nextReviewDate is 6 days out for interval=6', () => {
    const result = sm2(makeInput({ quality: 3, repetitions: 1, interval: 1 }));
    expect(result.interval).toBe(6);
    expect(result.nextReviewDate).toBe('2026-03-07');
  });

  // --- Interval growth ---
  it('intervals grow exponentially over consecutive quality-5 reviews', () => {
    let input = makeInput({ quality: 5, repetitions: 0, interval: 1, easeFactor: 2.5 });
    const intervals: number[] = [];

    for (let i = 0; i < 5; i++) {
      const result = sm2(input);
      intervals.push(result.interval);
      input = {
        quality: 5,
        repetitions: result.repetitions,
        interval: result.interval,
        easeFactor: result.easeFactor,
      };
    }

    // Each interval should be >= the previous one
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
    }

    // After 5 quality-5 reviews, interval should be substantial (>30 days)
    expect(intervals[4]).toBeGreaterThan(30);
  });

  // --- Edge case: exact ease factor calculation ---
  it('calculates correct ease factor for quality 3', () => {
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    // For q=3: EF' = 2.5 + (0.1 - 2 * (0.08 + 2 * 0.02)) = 2.5 + (0.1 - 0.24) = 2.36
    const result = sm2(makeInput({ quality: 3, easeFactor: 2.5 }));
    expect(result.easeFactor).toBeCloseTo(2.36, 2);
  });

  it('calculates correct ease factor for quality 5', () => {
    // For q=5: EF' = 2.5 + (0.1 - 0 * (0.08 + 0 * 0.02)) = 2.5 + 0.1 = 2.6
    const result = sm2(makeInput({ quality: 5, easeFactor: 2.5 }));
    expect(result.easeFactor).toBeCloseTo(2.6, 2);
  });
});
