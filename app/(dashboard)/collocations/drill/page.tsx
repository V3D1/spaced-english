import { getAllCollocations } from '../actions';
import { DrillClient } from './drill-client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type PageParams = Promise<{ hard?: string }>;

export default async function DrillPage({
  searchParams,
}: {
  searchParams: PageParams;
}) {
  const params = await searchParams;
  const onlyHard = params.hard === '1';
  const allCollocations = await getAllCollocations();
  const drillCollocations = allCollocations.filter((c) => {
    if (onlyHard) {
      return c.wrongStreak >= 2;
    }
    return c.status === 'N' || c.status === 'P' || c.wrongStreak >= 2;
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/collocations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Collocations
        </Link>
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          Collocation Drill
        </h2>
        <p className="text-muted-foreground text-sm">
          {drillCollocations.length} collocations to practice
          {onlyHard ? ' (Hard mode)' : ' (New + Passive + Hard)'}
        </p>
        <div className="mt-3 flex gap-2">
          <Link href="/collocations/drill" prefetch className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
            Standard
          </Link>
          <Link href="/collocations/drill?hard=1" prefetch className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
            Hard words
          </Link>
        </div>
      </div>
      {drillCollocations.length === 0 ? (
        <div className="border rounded-xl p-8 bg-card text-center">
          <p className="text-muted-foreground">
            All collocations are Active! Nothing to drill.
          </p>
          <Link
            href="/collocations"
            className="text-sm text-primary underline mt-2 inline-block"
          >
            View Collocation Bank
          </Link>
        </div>
      ) : (
        <DrillClient collocations={drillCollocations} />
      )}
    </div>
  );
}
