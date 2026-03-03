'use client';

import { useState } from 'react';
import { Volume2, Square } from 'lucide-react';

type TtsButtonProps = {
  text: string;
  lang?: string;
  label?: string;
  className?: string;
};

export function TtsButton({
  text,
  lang = 'en-US',
  label = 'Listen',
  className = '',
}: TtsButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  function stop() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function speak() {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = lang;
    utterance.rate = 0.96;
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={speaking ? stop : speak}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent ${className}`}
      aria-label={label}
    >
      {speaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      {speaking ? 'Stop' : label}
    </button>
  );
}
