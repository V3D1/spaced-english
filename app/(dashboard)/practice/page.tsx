import { getPracticePool, getSentenceHistory, getPracticeStats } from './actions';
import { PracticeForm } from './practice-form';
import { isAIEnabled } from '@/lib/ai/client';
import Link from 'next/link';

type PageParams = Promise<{
  level?: string;
  domain?: string;
}>;

export default async function PracticePage({
  searchParams,
}: {
  searchParams: PageParams;
}) {
  const params = await searchParams;
  const [pool, history, stats] = await Promise.all([
    getPracticePool(),
    getSentenceHistory(),
    getPracticeStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          Sentence Practice
        </h2>
        <p className="text-muted-foreground text-sm">
          Write sentences using your collocations &middot; {stats.total} written
          {stats.byDomain.length > 0 && (
            <span>
              {' '}({stats.byDomain.map((d) => `${d.domain}: ${d.count}`).join(', ')})
            </span>
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/flashcards?type=word" prefetch className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
            Go to vocabulary
          </Link>
          <Link href="/practice?level=B2" prefetch className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
            B2
          </Link>
          <Link href="/practice?level=C1" prefetch className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
            C1
          </Link>
          <Link href="/practice?level=C2" prefetch className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
            C2
          </Link>
        </div>
      </div>

      <PracticeForm
        pool={pool}
        initialLevel={params.level}
        initialDomain={params.domain}
        aiEnabled={isAIEnabled()}
      />

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Recent Sentences</h3>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="border rounded-lg p-3 bg-card text-sm"
              >
                <p>{h.sentence}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {h.phrase}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {h.domain}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
