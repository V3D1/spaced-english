'use client';

import { useState } from 'react';
import type { Flashcard } from '@/lib/db/schema';
import { Flame, Sparkles, GraduationCap, Leaf } from 'lucide-react';

interface CardListProps {
  cards: Flashcard[];
}

function localMixTag(card: Flashcard) {
  if (card.easeFactor <= 2.1) return 'hard' as const;
  if (card.repetitions === 0) return 'new' as const;
  if (card.repetitions >= 4 && card.easeFactor >= 2.6) return 'easy' as const;
  return 'learning' as const;
}

const MIX_META = {
  hard: { label: 'Hard', className: 'bg-red-100 text-red-700', icon: Flame },
  new: { label: 'New', className: 'bg-sky-100 text-sky-700', icon: Sparkles },
  learning: { label: 'Learning', className: 'bg-amber-100 text-amber-700', icon: GraduationCap },
  easy: { label: 'Easy', className: 'bg-green-100 text-green-700', icon: Leaf },
};

export function CardList({ cards }: CardListProps) {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = cards.filter((card) => {
    const matchesSearch =
      !search ||
      card.front.toLowerCase().includes(search.toLowerCase()) ||
      card.back.toLowerCase().includes(search.toLowerCase()) ||
      (card.keyPhrase?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesDomain = !domainFilter || card.domain === domainFilter;
    const matchesLevel = !levelFilter || card.level === levelFilter;
    const matchesType = !typeFilter || card.cardType === typeFilter;
    return matchesSearch && matchesDomain && matchesLevel && matchesType;
  });

  if (cards.length === 0) {
    return <p className="text-sm text-muted-foreground">No flashcards yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All domains</option>
          <option value="business">Business</option>
          <option value="tech">Tech</option>
          <option value="social">Social</option>
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All levels</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
          <option value="C2">C2</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All types</option>
          <option value="word">Words</option>
          <option value="sentence">Sentences</option>
        </select>
      </div>

      <div className="border rounded-xl overflow-x-auto table-scroll">
        <table className="w-full text-sm min-w-[620px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">Prompt</th>
              <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Answer</th>
              <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Key Phrase</th>
              <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Meta</th>
              <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Mix</th>
              <th className="text-left px-4 py-2 font-medium w-20">Next</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((card) => {
              const mixTag = localMixTag(card);
              const mix = MIX_META[mixTag];
              const MixIcon = mix.icon;
              return (
                <tr key={card.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5">{card.front}</td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">{card.back}</td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    {card.keyPhrase && (
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{card.keyPhrase}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <div className="flex gap-1.5">
                      <span className="text-xs rounded-full bg-muted px-2 py-0.5">{card.level}</span>
                      <span className="text-xs rounded-full bg-muted px-2 py-0.5">{card.cardType}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${mix.className}`}>
                      <MixIcon className="h-3 w-3" />
                      {mix.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{card.nextReviewDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} of {cards.length} cards</p>
    </div>
  );
}
