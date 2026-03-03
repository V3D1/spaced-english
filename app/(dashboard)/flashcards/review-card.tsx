'use client';

import { useState, useTransition, type ComponentType } from 'react';
import { reviewFlashcard } from './actions';
import type { ReviewQuality } from '@/lib/srs/sm2';
import { RotateCcw, Flame, Sparkles, GraduationCap, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { TtsButton } from '@/components/tts-button';
import type { ReviewQueueCard, ReviewMixTag } from './types';

const qualityButtons: { quality: ReviewQuality; label: string; className: string }[] = [
  { quality: 0, label: 'Again', className: 'bg-red-500 hover:bg-red-600 text-white' },
  { quality: 2, label: 'Hard', className: 'bg-orange-500 hover:bg-orange-600 text-white' },
  { quality: 3, label: 'Good', className: 'bg-green-500 hover:bg-green-600 text-white' },
  { quality: 5, label: 'Easy', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
];

interface ReviewCardProps {
  cards: ReviewQueueCard[];
}

const mixMeta: Record<
  ReviewMixTag,
  {
    label: string;
    className: string;
    icon: ComponentType<{ className?: string }>;
  }
> = {
  hard: {
    label: 'Hard',
    className: 'bg-red-100 text-red-700',
    icon: Flame,
  },
  new: {
    label: 'New',
    className: 'bg-sky-100 text-sky-700',
    icon: Sparkles,
  },
  learning: {
    label: 'Learning',
    className: 'bg-amber-100 text-amber-700',
    icon: GraduationCap,
  },
  easy: {
    label: 'Easy',
    className: 'bg-green-100 text-green-700',
    icon: Leaf,
  },
};

export function ReviewCard({ cards: initialCards }: ReviewCardProps) {
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reviewedCount, setReviewedCount] = useState(0);

  if (cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-4">&#10003;</div>
        <h3 className="text-xl font-semibold mb-2">
          {reviewedCount > 0 ? 'All done!' : 'No cards to review'}
        </h3>
        <p className="text-muted-foreground">
          {reviewedCount > 0
            ? `You reviewed ${reviewedCount} card${reviewedCount !== 1 ? 's' : ''} today.`
            : 'Come back tomorrow or add new cards.'}
        </p>
      </div>
    );
  }

  const card = cards[currentIndex];
  const currentMix = mixMeta[card.mixTag];
  const MixIcon = currentMix.icon;
  const remaining = cards.length - currentIndex;

  function handleRate(quality: ReviewQuality) {
    setFlipped(false);
    startTransition(async () => {
      const result = await reviewFlashcard(card.id, quality);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      // If failed (quality < 3), re-add card to end of queue
      if (quality < 3) {
        setCards((prev) => [...prev, { ...card, mixTag: 'hard' }]);
      }

      setReviewedCount((c) => c + 1);
      setCurrentIndex((i) => i + 1);
    });
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <span>{remaining} card{remaining !== 1 ? 's' : ''} remaining</span>
        <span>{reviewedCount} reviewed</span>
      </div>

      {/* Card */}
      <div
        className="relative min-h-[240px] sm:min-h-[280px] border rounded-xl bg-card cursor-pointer select-none shadow-sm active:scale-[0.99] transition-transform"
        onClick={() => !flipped && setFlipped(true)}
      >
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[240px] sm:min-h-[280px]">
          {!flipped ? (
            <>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                {card.domain || 'general'} &middot; {card.level} &middot; {card.cardType}
              </p>
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${currentMix.className}`}>
                  <MixIcon className="h-3 w-3" />
                  {currentMix.label}
                </span>
              </div>
              <p className="text-xl text-center font-medium leading-relaxed">
                {card.front}
              </p>
              <div className="mt-4">
                <TtsButton text={card.front} label="Listen prompt" />
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Tap to reveal
              </p>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                answer
              </p>
              <p className="text-xl text-center font-medium leading-relaxed mb-3">
                {card.back}
              </p>
              {card.keyPhrase && (
                <p className="text-sm font-mono bg-muted px-3 py-1 rounded">
                  {card.keyPhrase}
                </p>
              )}
              <div className="mt-4">
                <TtsButton text={card.back} label="Listen answer" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quality buttons (only shown when flipped) */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {qualityButtons.map((btn) => (
            <button
              key={btn.quality}
              onClick={() => handleRate(btn.quality)}
              disabled={isPending}
              className={`px-3 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 active:scale-95 ${btn.className}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Flip back button */}
      {flipped && (
        <button
          onClick={() => setFlipped(false)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Show front
        </button>
      )}
    </div>
  );
}
