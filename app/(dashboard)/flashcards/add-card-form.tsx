'use client';

import { useState, useTransition } from 'react';
import { addFlashcard } from './actions';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

export function AddCardForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addFlashcard(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Card added');
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Add Card
      </button>
    );
  }

  return (
    <div className="border rounded-xl p-5 sm:p-6 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">New Flashcard</h3>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="front" className="block text-sm font-medium mb-1">Prompt</label>
          <textarea
            id="front"
            name="front"
            required
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Prompt..."
          />
        </div>
        <div>
          <label htmlFor="back" className="block text-sm font-medium mb-1">Answer</label>
          <textarea
            id="back"
            name="back"
            required
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Answer..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="keyPhrase" className="block text-sm font-medium mb-1">Key phrase</label>
            <input
              id="keyPhrase"
              name="keyPhrase"
              type="text"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. bridge the gap"
            />
          </div>
          <div>
            <label htmlFor="domain" className="block text-sm font-medium mb-1">Domain</label>
            <select
              id="domain"
              name="domain"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-</option>
              <option value="business">Business</option>
              <option value="tech">Tech</option>
              <option value="social">Social</option>
            </select>
          </div>
          <div>
            <label htmlFor="level" className="block text-sm font-medium mb-1">Level</label>
            <select
              id="level"
              name="level"
              defaultValue="C1"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="cardType" className="block text-sm font-medium mb-1">Card type</label>
            <select
              id="cardType"
              name="cardType"
              defaultValue="sentence"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="word">Word</option>
              <option value="sentence">Sentence</option>
            </select>
          </div>
          <div>
            <label htmlFor="source" className="block text-sm font-medium mb-1">Source</label>
            <input
              id="source"
              name="source"
              type="text"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. meeting, article"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Adding...' : 'Add Card'}
        </button>
      </form>
    </div>
  );
}
