import { getReviewQueue, getAllFlashcards, getLeechSummary } from './actions';
import { ReviewCard } from './review-card';
import { AddCardForm } from './add-card-form';
import { CardList } from './card-list';
import Link from 'next/link';
import { Flame, Sparkles, GraduationCap, Leaf } from 'lucide-react';

type PageParams = Promise<{
  type?: string;
  level?: string;
  domain?: string;
  pool?: string;
}>;

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: PageParams;
}) {
  const params = await searchParams;
  const filters = {
    cardType: params.type,
    level: params.level,
    domain: params.domain,
    pool: params.pool,
  };
  const isLeechMode = params.pool === 'leech';

  const [queue, allCards, leechSummary] = await Promise.all([
    getReviewQueue(filters),
    getAllFlashcards(filters),
    getLeechSummary(),
  ]);
  const queueMix = {
    hard: queue.filter((card) => card.mixTag === 'hard').length,
    new: queue.filter((card) => card.mixTag === 'new').length,
    learning: queue.filter((card) => card.mixTag === 'learning').length,
    easy: queue.filter((card) => card.mixTag === 'easy').length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Flashcards</h2>
          <p className="text-muted-foreground text-sm">
            {queue.length} card{queue.length !== 1 ? 's' : ''} due today &middot; {allCards.length} total
          </p>
          {isLeechMode && (
            <p className="text-xs text-orange-600 mt-1">
              Leech mode: karty z czestymi bledami (min. 3 bledne oceny w 30 dni).
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href="/flashcards?type=word"
            prefetch
            className="inline-flex items-center rounded-lg border px-3 py-2 text-xs font-medium hover:bg-accent"
          >
            Slowka
          </Link>
          <Link
            href="/flashcards?type=sentence"
            prefetch
            className="inline-flex items-center rounded-lg border px-3 py-2 text-xs font-medium hover:bg-accent"
          >
            Sentencje
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/flashcards" prefetch className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
          Wszystko
        </Link>
        <Link href="/flashcards?pool=leech" prefetch className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
          Leech mode ({leechSummary.due} due / {leechSummary.total})
        </Link>
        <Link href="/flashcards?level=B2" prefetch className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
          B2
        </Link>
        <Link href="/flashcards?level=C1" prefetch className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
          C1
        </Link>
        <Link href="/flashcards?level=C2" prefetch className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
          C2
        </Link>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-1">Tryb nauki</h3>
        <p className="text-muted-foreground text-sm">Przegladaj i utrwalaj material dopasowany do poziomu.</p>
        {!isLeechMode && queue.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5">
              <Flame className="h-3 w-3" />
              Hard {queueMix.hard}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-700 px-2 py-0.5">
              <Sparkles className="h-3 w-3" />
              New {queueMix.new}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
              <GraduationCap className="h-3 w-3" />
              Learning {queueMix.learning}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5">
              <Leaf className="h-3 w-3" />
              Easy {queueMix.easy}
            </span>
          </div>
        )}
      </div>

      {/* Review Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Review</h3>
        <ReviewCard cards={queue} />
      </section>

      {/* Add Card */}
      <section>
        <AddCardForm />
      </section>

      {/* All Cards Table */}
      <section>
        <h3 className="text-lg font-semibold mb-4">All Cards ({allCards.length})</h3>
        <CardList cards={allCards} />
      </section>
    </div>
  );
}
