'use client';

import { useTransition } from 'react';
import { logActivity } from './actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const activities = [
  { name: 'shadowingMins', label: 'Shadowing', emoji: '' },
  { name: 'ankiMins', label: 'Anki', emoji: '' },
  { name: 'aiConvMins', label: 'AI Conversation', emoji: '' },
  { name: 'writingMins', label: 'Writing', emoji: '' },
  { name: 'selfTalkMins', label: 'Self-talk', emoji: '' },
  { name: 'collocationMins', label: 'Collocations', emoji: '' },
];

export function LogForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await logActivity(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Logged ${result.totalMins} min`);
    });
  }

  return (
    <form action={handleSubmit} className="border rounded-xl p-5 sm:p-6 bg-card">
      <h3 className="font-semibold mb-4">Log Today's Activity</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
        {activities.map((act) => (
          <div key={act.name}>
            <label htmlFor={act.name} className="block text-sm font-medium mb-1">
              {act.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                id={act.name}
                name={act.name}
                type="number"
                min={0}
                max={120}
                defaultValue={0}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Minimum 5 min to keep your streak alive (bad day mode).
      </p>
      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Activity'}
      </button>
    </form>
  );
}
