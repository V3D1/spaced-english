import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Mic,
  PenLine,
  Sparkles,
} from 'lucide-react';
import { getInputOutputData } from './actions';

function progressPercent(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

export default async function InputOutputPage() {
  const data = await getInputOutputData();
  const inputProgress = progressPercent(data.inputTodayMins, data.inputTargetMins);
  const outputProgress = progressPercent(data.outputTodayMins, data.outputTargetMins);
  const sentenceProgress = progressPercent(data.sentenceToday, data.sentenceTarget);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Input / Output</h2>
        <p className="text-sm text-muted-foreground">
          Balans: najpierw wejscie jezykowe, potem mocny output.
        </p>
      </div>

      <div className="border rounded-xl p-4 bg-card">
        <p className="text-sm font-medium">This week balance</p>
        <p className="text-2xl font-bold mt-1 tabular-nums">
          Output share: {data.outputShare}%
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Input {data.inputWeekMins} min &middot; Output {data.outputWeekMins} min
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-xl p-4 bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            <p className="text-sm font-medium">Input block</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Cel dzienny: {data.inputTargetMins} min
          </p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${inputProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {data.inputTodayMins}/{data.inputTargetMins} min
            {data.inputGap > 0 ? ` (${data.inputGap} min left)` : ' (done)'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/flashcards?type=word" prefetch className="rounded-lg border px-3 py-1.5 text-xs hover:bg-accent">
              <BookOpen className="h-3.5 w-3.5 inline mr-1" />
              Words due {data.dueWords}
            </Link>
            <Link href="/flashcards?type=sentence" prefetch className="rounded-lg border px-3 py-1.5 text-xs hover:bg-accent">
              <BookOpen className="h-3.5 w-3.5 inline mr-1" />
              Sentences due {data.dueSentences}
            </Link>
            <Link href="/collocations/drill?hard=1" prefetch className="rounded-lg border px-3 py-1.5 text-xs hover:bg-accent">
              <Sparkles className="h-3.5 w-3.5 inline mr-1" />
              Hard words {data.hardWords}
            </Link>
          </div>
        </div>

        <div className="border rounded-xl p-4 bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <p className="text-sm font-medium">Output sprint</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Cel dzienny: {data.outputTargetMins} min + {data.sentenceTarget} zdan
          </p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${outputProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            Output mins: {data.outputTodayMins}/{data.outputTargetMins}
            {data.outputGap > 0 ? ` (${data.outputGap} min left)` : ' (done)'}
          </p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${sentenceProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            Sentences: {data.sentenceToday}/{data.sentenceTarget}
            {data.sentenceGap > 0 ? ` (${data.sentenceGap} left)` : ' (done)'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/practice" prefetch className="rounded-lg border px-3 py-1.5 text-xs hover:bg-accent">
              <PenLine className="h-3.5 w-3.5 inline mr-1" />
              Write now
            </Link>
            <Link href="/activity" prefetch className="rounded-lg border px-3 py-1.5 text-xs hover:bg-accent">
              <Mic className="h-3.5 w-3.5 inline mr-1" />
              Log speaking mins
            </Link>
          </div>
        </div>
      </div>

      <Link
        href="/daily-plan/start"
        prefetch
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Continue from Daily Plan
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
