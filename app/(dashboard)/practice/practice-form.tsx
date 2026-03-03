'use client';

import { useMemo, useState, useTransition } from 'react';
import { submitSentence } from './actions';
import { toast } from 'sonner';
import type { Collocation } from '@/lib/db/schema';
import { RefreshCw, Send, WandSparkles } from 'lucide-react';
import { TtsButton } from '@/components/tts-button';
import { PronunciationChallenge } from '@/components/pronunciation-challenge';

interface PracticeFormProps {
  pool: Collocation[];
  initialLevel?: string;
  initialDomain?: string;
}

function pickRandom<T>(arr: T[], exclude?: T) {
  if (arr.length === 0) return null;
  if (arr.length === 1) return arr[0];

  let selected = arr[Math.floor(Math.random() * arr.length)];
  if (exclude && selected === exclude) {
    selected = arr[Math.floor(Math.random() * arr.length)];
  }
  return selected;
}

function buildSentenceStarters(collocation: Collocation | null) {
  if (!collocation) return [];
  return [
    `In our last ${collocation.domain} discussion, we had to ${collocation.phrase} `,
    `One practical way to ${collocation.phrase} is to `,
    `I used "${collocation.phrase}" today when `,
  ];
}

export function PracticeForm({
  pool,
  initialLevel,
  initialDomain,
}: PracticeFormProps) {
  const [levelFilter, setLevelFilter] = useState(initialLevel || '');
  const [domainFilter, setDomainFilter] = useState(initialDomain || '');
  const [manualPickId, setManualPickId] = useState<string>('');
  const [sentence, setSentence] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredPool = useMemo(() => {
    return pool.filter((item) => {
      const levelOk = !levelFilter || item.level === levelFilter;
      const domainOk = !domainFilter || item.domain === domainFilter;
      return levelOk && domainOk;
    });
  }, [pool, levelFilter, domainFilter]);

  const [randomCollocation, setRandomCollocation] = useState<Collocation | null>(
    filteredPool[0] || null
  );

  const selectedCollocation = useMemo(() => {
    if (manualPickId) {
      return filteredPool.find((item) => String(item.id) === manualPickId) || null;
    }
    return randomCollocation;
  }, [manualPickId, filteredPool, randomCollocation]);

  const sentenceStarters = useMemo(
    () => buildSentenceStarters(selectedCollocation),
    [selectedCollocation]
  );

  function applyFilters(nextLevel: string, nextDomain: string) {
    const nextPool = pool.filter((item) => {
      const levelOk = !nextLevel || item.level === nextLevel;
      const domainOk = !nextDomain || item.domain === nextDomain;
      return levelOk && domainOk;
    });
    setManualPickId('');
    setRandomCollocation(pickRandom(nextPool));
  }

  function handleSubmit() {
    if (!selectedCollocation || !sentence.trim()) return;

    startTransition(async () => {
      const result = await submitSentence(selectedCollocation.id, sentence);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Sentence saved');
      setSentence('');
      setManualPickId('');
      setRandomCollocation(pickRandom(filteredPool, selectedCollocation));
    });
  }

  function handleSkip() {
    setManualPickId('');
    setSentence('');
    setRandomCollocation(pickRandom(filteredPool, selectedCollocation || undefined));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  if (pool.length === 0) {
    return (
      <div className="border rounded-xl p-8 bg-card text-center">
        <p className="text-muted-foreground">No collocations available. Add some first.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-6 bg-card space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <select
            value={levelFilter}
            onChange={(e) => {
              const value = e.target.value;
              setLevelFilter(value);
              applyFilters(value, domainFilter);
            }}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">All levels</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Domain</label>
          <select
            value={domainFilter}
            onChange={(e) => {
              const value = e.target.value;
              setDomainFilter(value);
              applyFilters(levelFilter, value);
            }}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">All domains</option>
            <option value="business">Business</option>
            <option value="tech">Tech</option>
            <option value="social">Social</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Pick collocation</label>
          <select
            value={manualPickId}
            onChange={(e) => setManualPickId(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">Random</option>
            {filteredPool.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.phrase}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedCollocation ? (
        <div className="border rounded-lg p-5 text-sm text-muted-foreground">
          Brak materialu dla wybranych filtrow.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Write a sentence using this collocation
              </p>
              <button
                onClick={handleSkip}
                disabled={isPending}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className="h-3 w-3" />
                Skip
              </button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-lg font-medium">{selectedCollocation.phrase}</p>
              <p className="text-sm text-muted-foreground">{selectedCollocation.translation}</p>
              <p className="text-sm italic text-muted-foreground border-l-2 border-muted-foreground/30 pl-3 mt-2">
                {selectedCollocation.example}
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {selectedCollocation.domain}
                </span>
                <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {selectedCollocation.level}
                </span>
              </div>
              <div className="pt-1">
                <TtsButton
                  text={`${selectedCollocation.phrase}. ${selectedCollocation.example || ''}`}
                  label="Listen collocation"
                />
              </div>
            </div>
          </div>

          <PronunciationChallenge targetPhrase={selectedCollocation.phrase} />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <WandSparkles className="h-3.5 w-3.5" />
              Quick sentence starters
            </div>
            <div className="flex flex-wrap gap-2">
              {sentenceStarters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => setSentence(starter)}
                  className="rounded-full border px-3 py-1.5 text-xs hover:bg-accent"
                >
                  {starter}
                </button>
              ))}
            </div>

            <textarea
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your sentence here..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}
            />
            <button
              onClick={handleSubmit}
              disabled={isPending || !sentence.trim()}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Submit Sentence
            </button>
          </div>
        </>
      )}
    </div>
  );
}
