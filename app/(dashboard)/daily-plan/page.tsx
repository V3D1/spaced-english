import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, Rocket } from 'lucide-react';
import { getDailyPlanData } from './actions';

const SENTENCE_TARGET = 5;

export default async function DailyPlanPage() {
  const data = await getDailyPlanData();
  const sentenceRemaining = Math.max(0, SENTENCE_TARGET - data.practicedToday);
  const outputRemaining = Math.max(0, data.outputTargetMins - data.outputTodayMins);

  const steps = [
    {
      title: 'Hard words drill',
      description: 'Najpierw atakujemy trudne hasla',
      countLabel: `${data.hardWords} hard`,
      href: '/collocations/drill?hard=1',
      done: data.hardWords === 0,
    },
    {
      title: 'Flashcards: slowka',
      description: 'Powtorka slowek na dzis',
      countLabel: `${data.dueWords} due`,
      href: '/flashcards?type=word',
      done: data.dueWords === 0,
    },
    {
      title: 'Flashcards: sentencje',
      description: 'Powtorka sentencji na dzis',
      countLabel: `${data.dueSentences} due`,
      href: '/flashcards?type=sentence',
      done: data.dueSentences === 0,
    },
    {
      title: 'Practice writing',
      description: 'Cel dzienny: 5 zdan',
      countLabel: `${sentenceRemaining} left`,
      href: '/practice',
      done: sentenceRemaining === 0,
    },
    {
      title: 'Output sprint',
      description: `Mowienie + pisanie: ${data.outputTargetMins} min`,
      countLabel: `${outputRemaining} min left`,
      href: '/input-output',
      done: outputRemaining === 0,
    },
  ];

  const doneSteps = steps.filter((step) => step.done).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Daily Plan</h2>
          <p className="text-sm text-muted-foreground">
            Jedno klikniecie uruchamia najlepszy nastepny krok na teraz.
          </p>
        </div>
        <Link
          href="/daily-plan/start"
          prefetch
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
        >
          <Rocket className="h-4 w-4" />
          Start now
        </Link>
      </div>

      <div className="border rounded-xl p-4 bg-card">
        <p className="text-sm font-medium">Today progress</p>
        <p className="text-2xl font-bold mt-1 tabular-nums">
          {doneSteps}/{steps.length}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Output today: {data.outputTodayMins}/{data.outputTargetMins} min
        </p>
      </div>

      <div className="border rounded-xl bg-card divide-y">
        {steps.map((step) => (
          <div key={step.title} className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
            <Link
              href={step.href}
              prefetch
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium shrink-0 hover:bg-accent"
            >
              {step.countLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>

      <div className="border rounded-xl p-4 bg-card">
        <p className="text-sm font-medium mb-1">Mastery logic</p>
        <p className="text-xs text-muted-foreground">
          Haslo przechodzi do Active dopiero po serii poprawnych odpowiedzi (nie po jednym trafieniu).
          Dwie bledne odpowiedzi pod rzad wrzucaja je do puli Hard.
        </p>
      </div>
    </div>
  );
}
