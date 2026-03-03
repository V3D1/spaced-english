'use client';

import { useState, useTransition } from 'react';
import { incrementAdoption, addCollocationToFlashcards, updateCollocationStatus } from './actions';
import { toast } from 'sonner';
import type { Collocation } from '@/lib/db/schema';
import { BookOpen, Plus } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  N: { label: 'New', className: 'bg-gray-100 text-gray-700' },
  P: { label: 'Passive', className: 'bg-yellow-100 text-yellow-800' },
  A: { label: 'Active', className: 'bg-green-100 text-green-800' },
};

interface CollocationTableProps {
  collocations: Collocation[];
}

export function CollocationTable({ collocations }: CollocationTableProps) {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [hardOnly, setHardOnly] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = collocations.filter((c) => {
    const matchesSearch =
      !search ||
      c.phrase.toLowerCase().includes(search.toLowerCase()) ||
      c.translation.toLowerCase().includes(search.toLowerCase());
    const matchesDomain = !domainFilter || c.domain === domainFilter;
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const matchesLevel = !levelFilter || c.level === levelFilter;
    const matchesHard = !hardOnly || c.wrongStreak >= 2;
    return matchesSearch && matchesDomain && matchesStatus && matchesLevel && matchesHard;
  });

  const domainCounts = {
    business: collocations.filter((c) => c.domain === 'business').length,
    tech: collocations.filter((c) => c.domain === 'tech').length,
    social: collocations.filter((c) => c.domain === 'social').length,
  };

  const statusCounts = {
    N: collocations.filter((c) => c.status === 'N').length,
    P: collocations.filter((c) => c.status === 'P').length,
    A: collocations.filter((c) => c.status === 'A').length,
  };

  function handleAdopt(id: number) {
    startTransition(async () => {
      const result = await incrementAdoption(id);
      if (result.error) toast.error(result.error);
      else toast.success(`Used! Count: ${result.newCount}`);
    });
  }

  function handleAddToFlashcards(id: number) {
    startTransition(async () => {
      const result = await addCollocationToFlashcards(id);
      if (result.error) toast.error(result.error);
      else toast.success('Added to flashcards');
    });
  }

  return (
    <div className="space-y-4">
      {/* Summary — reflects filtered results */}
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">
          {filtered.filter((c) => c.status === 'N').length} New,{' '}
          {filtered.filter((c) => c.status === 'P').length} Passive,{' '}
          {filtered.filter((c) => c.status === 'A').length} Active
        </span>
      </div>

      {/* Filters */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
        <input
          type="text"
          placeholder="Search collocations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:flex-1 sm:min-w-[200px] rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex gap-3">
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="flex-1 sm:flex-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">All domains</option>
            <option value="business">Business ({domainCounts.business})</option>
            <option value="tech">Tech ({domainCounts.tech})</option>
            <option value="social">Social ({domainCounts.social})</option>
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="flex-1 sm:flex-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">All levels</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">All statuses</option>
            <option value="N">New ({statusCounts.N})</option>
            <option value="P">Passive ({statusCounts.P})</option>
            <option value="A">Active ({statusCounts.A})</option>
          </select>
          <button
            type="button"
            onClick={() => setHardOnly((current) => !current)}
            className={`flex-1 sm:flex-none rounded-lg border px-3 py-2.5 text-sm ${
              hardOnly ? 'bg-primary text-primary-foreground' : 'bg-background'
            }`}
          >
            Hard only
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-x-auto table-scroll">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">Phrase</th>
              <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Translation</th>
              <th className="text-left px-3 py-2 font-medium w-20">Status</th>
              <th className="text-left px-3 py-2 font-medium w-20">Level</th>
              <th className="text-left px-3 py-2 font-medium w-24">Mastery</th>
              <th className="text-center px-3 py-2 font-medium w-16">Uses</th>
              <th className="text-right px-4 py-2 font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <span className="font-medium">{c.phrase}</span>
                  {c.category && (
                    <span className="ml-2 text-xs text-muted-foreground">{c.category}</span>
                  )}
                  <p className="text-xs text-muted-foreground md:hidden mt-0.5">{c.translation}</p>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{c.translation}</td>
                <td className="px-3 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[c.status].className}`}>
                    {STATUS_LABELS[c.status].label}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{c.level}</span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{c.masteryScore}%</span>
                    {c.wrongStreak >= 2 ? (
                      <span className="text-[10px] rounded-full bg-red-100 text-red-700 px-2 py-0.5">
                        HARD
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="text-center px-3 py-2.5 tabular-nums">{c.adoptionCount}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleAdopt(c.id)}
                      disabled={isPending}
                      title="Mark as used"
                      className="p-1.5 rounded hover:bg-accent disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    {!c.flashcardId && (
                      <button
                        onClick={() => handleAddToFlashcards(c.id)}
                        disabled={isPending}
                        title="Add to flashcards"
                        className="p-1.5 rounded hover:bg-accent disabled:opacity-50"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        {filtered.length} of {collocations.length} collocations
      </p>
    </div>
  );
}
