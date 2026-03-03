'use client';

import { useTransition } from 'react';
import { toggleMilestone } from './milestone-actions';
import { toast } from 'sonner';
import type { Milestone } from '@/lib/db/schema';

interface MilestoneToggleProps {
  milestone: Milestone;
}

export function MilestoneToggle({ milestone }: MilestoneToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleMilestone(milestone.id);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-start gap-3 py-2.5">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`mt-0.5 flex-shrink-0 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors ${
          milestone.completed
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border hover:border-primary/50'
        } ${isPending ? 'opacity-50' : ''}`}
      >
        {milestone.completed && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
          {milestone.description}
        </p>
        <p className="text-xs text-muted-foreground">
          Day {milestone.day} &middot; {milestone.type}
          {milestone.completedDate && ` &middot; Done ${milestone.completedDate}`}
        </p>
      </div>
    </div>
  );
}
