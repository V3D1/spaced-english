'use client';

import { useTransition } from 'react';
import { submitWeeklyReview } from './actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  weekNumber: number;
  phase: number;
  totalMins: number;
  activeDays: number;
  streak: number;
}

export function ReviewForm({ weekNumber, phase, totalMins, activeDays, streak }: ReviewFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitWeeklyReview(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Weekly review saved');
    });
  }

  return (
    <form action={handleSubmit} className="border rounded-xl p-5 sm:p-6 bg-card space-y-5">
      <div>
        <h3 className="font-semibold text-lg">Week {weekNumber} Review</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
          <span>Phase {phase}</span>
          <span>{totalMins} min</span>
          <span>{activeDays} active days</span>
          <span>{streak} day streak</span>
        </div>
      </div>

      {/* Hidden fields */}
      <input type="hidden" name="weekNumber" value={weekNumber} />
      <input type="hidden" name="phase" value={phase} />
      <input type="hidden" name="streak" value={streak} />
      <input type="hidden" name="totalMins" value={totalMins} />

      <div>
        <label htmlFor="wentWell" className="block text-sm font-medium mb-1">
          What went well?
        </label>
        <textarea
          id="wentWell"
          name="wentWell"
          required
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="What worked this week? What are you proud of?"
        />
      </div>

      <div>
        <label htmlFor="wasDifficult" className="block text-sm font-medium mb-1">
          What was difficult?
        </label>
        <textarea
          id="wasDifficult"
          name="wasDifficult"
          required
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="What challenges did you face? Where did you struggle?"
        />
      </div>

      <div>
        <label htmlFor="insightOfWeek" className="block text-sm font-medium mb-1">
          Insight of the week
        </label>
        <textarea
          id="insightOfWeek"
          name="insightOfWeek"
          rows={2}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Any aha moment or key learning?"
        />
      </div>

      <div>
        <label htmlFor="nextFocus" className="block text-sm font-medium mb-1">
          Next week's focus
        </label>
        <textarea
          id="nextFocus"
          name="nextFocus"
          rows={2}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="What will you prioritize next week?"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Review'}
      </button>
    </form>
  );
}
