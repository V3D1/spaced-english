'use client';

import { useTransition } from 'react';
import { resetLearningProgress } from './actions';
import { toast } from 'sonner';
import { Loader2, RotateCcw } from 'lucide-react';

export function ResetProgress() {
  const [isPending, startTransition] = useTransition();

  function onReset() {
    const ok = window.confirm(
      'Reset progress? This will clear streak, logs, weekly reviews, and review history.'
    );
    if (!ok) {
      return;
    }

    startTransition(async () => {
      const result = await resetLearningProgress();
      if (result.success) {
        toast.success('Progress reset complete');
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onReset}
      disabled={isPending}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
      Reset Progress
    </button>
  );
}
