import { getDashboardData } from './actions';
import { MilestoneToggle } from './milestone-toggle';
import { StreakCalendar } from './streak-calendar';
import { DailyCollocation } from './daily-collocation';
import { Flame, BookOpen, Target, Plus, PenLine, ArrowRight, Rocket, Mic } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const data = await getDashboardData();

  const barActivities = [
    { label: 'Shadowing', value: data.weekStats.shadowing, color: 'bg-blue-500' },
    { label: 'Anki', value: data.weekStats.anki, color: 'bg-green-500' },
    { label: 'AI Conv', value: data.weekStats.aiConv, color: 'bg-purple-500' },
    { label: 'Writing', value: data.weekStats.writing, color: 'bg-orange-500' },
    { label: 'Self-talk', value: data.weekStats.selfTalk, color: 'bg-pink-500' },
    { label: 'Colloc.', value: data.weekStats.collocations, color: 'bg-teal-500' },
  ];
  const maxMins = Math.max(...barActivities.map((a) => a.value), 1);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h2>
        {!data.planActive && (
          <p className="text-sm text-muted-foreground">
            Plan not activated yet.{' '}
            <Link href="/settings" className="underline hover:text-foreground">
              Activate in Settings
            </Link>
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Link
          href="/daily-plan/start"
          prefetch
          className="border rounded-xl p-4 bg-primary text-primary-foreground hover:opacity-95 transition-opacity block"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary-foreground/80">One Click</p>
              <p className="text-lg font-semibold mt-1">Daily Plan Start</p>
              <p className="text-sm text-primary-foreground/85 mt-1">
                {data.cardStats.dueWords} vocabulary cards + {data.cardStats.dueSentences} sentence cards due today
              </p>
            </div>
            <Rocket className="h-5 w-5 text-primary-foreground/90" />
          </div>
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
            Start now <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <div className="grid md:grid-cols-3 gap-3">
          <Link
            href="/flashcards?type=word"
            prefetch
            className="border rounded-xl p-4 bg-card hover:bg-accent/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Quick Start</p>
                <p className="text-lg font-semibold mt-1">Vocabulary</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.cardStats.dueWords} due now
                </p>
              </div>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
              Start review <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/practice"
            prefetch
            className="border rounded-xl p-4 bg-card hover:bg-accent/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Quick Start</p>
                <p className="text-lg font-semibold mt-1">Sentences</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fast drills + sentence starters
                </p>
              </div>
              <PenLine className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
              Start practice <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/input-output"
            prefetch
            className="border rounded-xl p-4 bg-card hover:bg-accent/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Quick Start</p>
                <p className="text-lg font-semibold mt-1">Output Sprint</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Input/output balance + daily goals
                </p>
              </div>
              <Mic className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
              Open sprint <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Phase */}
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Phase</p>
          <p className="text-2xl font-bold tabular-nums">
            {data.currentPhase ? data.currentPhase.number : '-'}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {data.currentPhase ? data.currentPhase.name : 'Not started'}
          </p>
        </div>

        {/* Week */}
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Week</p>
          <p className="text-2xl font-bold tabular-nums">
            {data.currentWeek > 0 ? data.currentWeek : '-'}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">of 13</p>
        </div>

        {/* Streak */}
        <div className="border rounded-xl p-4 bg-card">
          <div className="flex items-center gap-1.5">
            <Flame className={`h-4 w-4 ${data.streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
          </div>
          <p className="text-2xl font-bold mt-1 tabular-nums">{data.streak}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">days</p>
        </div>

        {/* Cards due */}
        <div className="border rounded-xl p-4 bg-card">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Due</p>
          </div>
          <p className="text-2xl font-bold mt-1 tabular-nums">{data.cardStats.dueToday}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">of {data.cardStats.total} total</p>
        </div>
      </div>

      {/* Phase progress bar */}
      {data.planActive && data.allPhases.length > 0 && (
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-sm font-medium mb-3">90-Day Progress</p>
          <div className="flex gap-1">
            {data.allPhases.map((phase) => {
              const phaseWeeks = phase.weekEnd - phase.weekStart + 1;
              const widthPercent = (phaseWeeks / 13) * 100;
              const isActive = data.currentPhase?.number === phase.number;
              const isCompleted = data.currentWeek > phase.weekEnd;

              return (
                <div key={phase.id} style={{ width: `${widthPercent}%` }}>
                  <div
                    className={`h-3 rounded-sm ${
                      isCompleted
                        ? 'bg-primary'
                        : isActive
                        ? 'bg-primary/50'
                        : 'bg-muted'
                    }`}
                  />
                  <p className={`text-xs mt-1 truncate ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {phase.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly chart (CSS bars) */}
      <div className="border rounded-xl p-4 bg-card">
        <p className="text-sm font-medium mb-4">This Week (minutes per activity)</p>
        <div className="space-y-3">
          {barActivities.map((act) => (
            <div key={act.label} className="flex items-center gap-3">
              <span className="text-xs w-16 text-right text-muted-foreground">{act.label}</span>
              <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                <div
                  className={`h-full ${act.color} rounded transition-all`}
                  style={{ width: `${(act.value / maxMins) * 100}%` }}
                />
              </div>
              <span className="text-xs w-8 tabular-nums">{act.value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Total: {data.weekStats.total} min this week
        </p>
      </div>

      {/* Streak Calendar */}
      <StreakCalendar days={data.last30Days} />

      {/* Daily Collocation */}
      <DailyCollocation collocation={data.dailyCollocation} />

      {/* Milestones */}
      <div className="border rounded-xl p-4 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4" />
          <p className="text-sm font-medium">Milestones</p>
          <span className="text-xs text-muted-foreground">
            ({data.milestones.filter((m) => m.completed).length}/{data.milestones.length})
          </span>
        </div>
        <div className="divide-y">
          {data.milestones.map((m) => (
            <MilestoneToggle key={m.id} milestone={m} />
          ))}
        </div>
      </div>

      <Link
        href="/activity"
        className="md:hidden fixed right-4 bottom-24 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg"
      >
        <Plus className="h-4 w-4" />
        Log activity
      </Link>
    </div>
  );
}
