import { getAllCollocations } from './actions';
import { CollocationTable } from './collocation-table';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default async function CollocationsPage() {
  const collocations = await getAllCollocations();
  const drillCount = collocations.filter(
    (c) => c.status === 'N' || c.status === 'P'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Collocation Bank</h2>
          <p className="text-muted-foreground text-sm">
            {collocations.length} collocations &middot; Track your vocabulary adoption
          </p>
        </div>
        {drillCount > 0 && (
          <Link
            href="/collocations/drill"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 shrink-0"
          >
            <Zap className="h-4 w-4" />
            Start Drill ({drillCount})
          </Link>
        )}
      </div>
      <CollocationTable collocations={collocations} />
    </div>
  );
}
