'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { submitDrillAttempt } from '../actions';
import { toast } from 'sonner';
import type { Collocation } from '@/lib/db/schema';
import { CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { TtsButton } from '@/components/tts-button';

interface DrillClientProps {
  collocations: Collocation[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type DrillState = 'playing' | 'correct' | 'incorrect' | 'finished';

export function DrillClient({ collocations }: DrillClientProps) {
  const [queue, setQueue] = useState(() => shuffle(collocations));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [state, setState] = useState<DrillState>('playing');
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const current = queue[currentIndex];

  useEffect(() => {
    if (state === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state, currentIndex]);

  function checkAnswer() {
    if (!current || !answer.trim()) return;
    startTransition(async () => {
      const result = await submitDrillAttempt(current.id, answer);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setTotal((t) => t + 1);
      if (result.isCorrect) {
        setScore((s) => s + 1);
        setState('correct');
      } else {
        setState('incorrect');
      }

      if (result.isHard) {
        toast.message('This word has been added to the hard pool.');
      }
    });
  }

  function next() {
    setAnswer('');
    if (currentIndex + 1 >= queue.length) {
      setState('finished');
    } else {
      setCurrentIndex((i) => i + 1);
      setState('playing');
    }
  }

  function restart() {
    setQueue(shuffle(collocations));
    setCurrentIndex(0);
    setAnswer('');
    setState('playing');
    setScore(0);
    setTotal(0);
    setStartTime(Date.now());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (state === 'playing') checkAnswer();
      else if (state === 'correct' || state === 'incorrect') next();
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  if (state === 'finished') {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="border rounded-xl p-8 bg-card text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-yellow-500" />
        <h3 className="text-xl font-bold">Drill Complete!</h3>
        <div className="space-y-1">
          <p className="text-2xl font-bold tabular-nums">
            {score}/{total} correct ({pct}%)
          </p>
          <p className="text-sm text-muted-foreground">
            Time: {mins}m {secs}s
          </p>
        </div>
        <button
          onClick={restart}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <RotateCcw className="h-4 w-4" />
          Drill Again
        </button>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="border rounded-xl p-6 bg-card space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {currentIndex + 1} / {queue.length}
        </span>
        <span>
          {score} correct of {total} answered
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="text-center space-y-2 py-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Translate to English
        </p>
        <p className="text-xl font-medium">{current.translation}</p>
        <div className="flex justify-center">
          <TtsButton text={current.phrase} label="Listen answer" />
        </div>
        {current.domain && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {current.domain}
          </span>
        )}
      </div>

      {/* Input or result */}
      {state === 'playing' && (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type the collocation..."
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-center text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoComplete="off"
            autoCapitalize="off"
          />
          <button
            onClick={checkAnswer}
            disabled={!answer.trim()}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Check
          </button>
        </div>
      )}

      {state === 'correct' && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Correct!</span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {current.phrase}
          </p>
          <button
            onClick={next}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Next
          </button>
        </div>
      )}

      {state === 'incorrect' && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Not quite</span>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">Your answer:</p>
            <p className="text-sm line-through">{answer}</p>
            <p className="text-sm text-muted-foreground mt-2">Correct:</p>
            <p className="text-lg font-medium text-green-600">
              {current.phrase}
            </p>
          </div>
          <button
            onClick={next}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
