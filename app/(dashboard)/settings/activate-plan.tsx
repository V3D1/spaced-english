'use client';

import { useTransition } from 'react';
import { activatePlan } from './actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function ActivatePlan() {
  const [isPending, startTransition] = useTransition();

  function handleActivate() {
    startTransition(async () => {
      const result = await activatePlan();
      if (result.success) {
        toast.success(`Plan activated! Start date: ${result.startDate}`);
      }
    });
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        Activate the 90-day plan to start tracking your progress. The plan starts today.
      </p>
      <button
        onClick={handleActivate}
        disabled={isPending}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Activate Plan'}
      </button>
    </div>
  );
}
