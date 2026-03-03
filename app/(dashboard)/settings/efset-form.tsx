'use client';

import { useTransition } from 'react';
import { updateEfSetScores } from './actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EfSetFormProps {
  baseline: number | null;
  retest: number | null;
}

export function EfSetForm({ baseline, retest }: EfSetFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateEfSetScores(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('EF SET scores updated');
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="efSetBaseline" className="block text-sm font-medium mb-1">
            Baseline Score
          </label>
          <input
            id="efSetBaseline"
            name="efSetBaseline"
            type="number"
            step="0.1"
            min="0"
            max="100"
            defaultValue={baseline ?? ''}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="e.g. 62.5"
          />
        </div>
        <div>
          <label htmlFor="efSetRetest" className="block text-sm font-medium mb-1">
            Retest Score (Day 90)
          </label>
          <input
            id="efSetRetest"
            name="efSetRetest"
            type="number"
            step="0.1"
            min="0"
            max="100"
            defaultValue={retest ?? ''}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="e.g. 71.0"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Scores'}
      </button>
    </form>
  );
}
