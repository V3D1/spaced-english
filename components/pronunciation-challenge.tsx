'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square, RotateCcw } from 'lucide-react';

type PronunciationChallengeProps = {
  targetPhrase: string;
  lang?: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => (row === 0 ? col : col === 0 ? row : 0))
  );

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarityScore(target: string, spoken: string) {
  const normalizedTarget = normalizeText(target);
  const normalizedSpoken = normalizeText(spoken);
  if (!normalizedTarget || !normalizedSpoken) {
    return 0;
  }

  const distance = levenshteinDistance(normalizedTarget, normalizedSpoken);
  const maxLength = Math.max(normalizedTarget.length, normalizedSpoken.length, 1);
  const score = Math.round((1 - distance / maxLength) * 100);
  return Math.max(0, Math.min(100, score));
}

function readSpeechRecognitionSupport() {
  if (typeof window === 'undefined') {
    return null;
  }
  const windowAny = window as any;
  return windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition || null;
}

export function PronunciationChallenge({
  targetPhrase,
  lang = 'en-US',
}: PronunciationChallengeProps) {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(!!readSpeechRecognitionSupport());
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    setTranscript('');
    setError('');
  }, [targetPhrase]);

  const score = useMemo(
    () => similarityScore(targetPhrase, transcript),
    [targetPhrase, transcript]
  );

  function startListening() {
    const SpeechRecognitionCtor = readSpeechRecognitionSupport();
    if (!SpeechRecognitionCtor) {
      setError('Speech recognition is not available in this browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError('');
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const spokenText = event?.results?.[0]?.[0]?.transcript || '';
      setTranscript(spokenText);
    };

    recognition.onerror = (event: any) => {
      const code = event?.error || 'unknown_error';
      setError(`Speech recognition failed: ${code}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }

  function resetResult() {
    setTranscript('');
    setError('');
  }

  const scoreLabel =
    score >= 90
      ? 'Excellent'
      : score >= 75
      ? 'Good'
      : score >= 55
      ? 'Needs another try'
      : 'Try slower and clearer';

  return (
    <div className="border rounded-lg p-4 bg-card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Pronunciation challenge</p>
          <p className="text-xs text-muted-foreground">
            Say the phrase aloud and compare transcript similarity.
          </p>
        </div>
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={!isSupported}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
            isListening
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          } disabled:opacity-50`}
        >
          {isListening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {isListening ? 'Stop' : 'Start voice check'}
        </button>
      </div>

      <div className="text-xs text-muted-foreground">
        Target phrase: <span className="font-medium text-foreground">{targetPhrase}</span>
      </div>

      {!isSupported && (
        <p className="text-xs text-orange-600">
          Voice check is not supported by this browser. Use Safari/Chrome on mobile.
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {transcript && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Transcript: <span className="text-foreground">{transcript}</span>
          </p>
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${score}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{score}% match</span>
              <span className="text-muted-foreground">{scoreLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={resetResult}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset result
          </button>
        </div>
      )}
    </div>
  );
}
