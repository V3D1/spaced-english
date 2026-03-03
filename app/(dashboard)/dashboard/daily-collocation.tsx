'use client';

import { useTransition } from 'react';
import { incrementAdoption } from '../collocations/actions';
import { toast } from 'sonner';
import type { Collocation } from '@/lib/db/schema';
import { Sparkles, Check } from 'lucide-react';
import { TtsButton } from '@/components/tts-button';

interface DailyCollocationProps {
  collocation: Collocation | null;
}

export function DailyCollocation({ collocation }: DailyCollocationProps) {
  const [isPending, startTransition] = useTransition();

  if (!collocation) return null;

  function handleUsed() {
    if (!collocation) return;
    startTransition(async () => {
      const result = await incrementAdoption(collocation.id);
      if (result.error) toast.error(result.error);
      else toast.success(`Marked as used! Count: ${result.newCount}`);
    });
  }

  return (
    <div className="border rounded-xl p-4 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-yellow-500" />
        <p className="text-sm font-medium">Collocation of the Day</p>
      </div>
      <div className="space-y-2">
        <p className="text-lg font-medium">{collocation.phrase}</p>
        <p className="text-sm text-muted-foreground">{collocation.translation}</p>
        {collocation.example && (
          <p className="text-sm italic text-muted-foreground border-l-2 border-muted-foreground/30 pl-3">
            {collocation.example}
          </p>
        )}
        <div className="pt-1">
          <TtsButton text={`${collocation.phrase}. ${collocation.example || ''}`} label="Listen" />
        </div>
      </div>
      <button
        onClick={handleUsed}
        disabled={isPending}
        className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:bg-accent disabled:opacity-50 transition-colors"
      >
        <Check className="h-3.5 w-3.5" />
        I used it today
      </button>
    </div>
  );
}
