import { getRecentActivity, getStreak } from './actions';
import { LogForm } from './log-form';
import { Flame } from 'lucide-react';

export default async function ActivityPage() {
  const [records, streak] = await Promise.all([
    getRecentActivity(),
    getStreak(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Activity Tracker</h2>
          <p className="text-muted-foreground text-sm">Log your daily learning minutes</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-card">
          <Flame className={`h-5 w-5 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          <span className="text-xl font-bold tabular-nums">{streak}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
      </div>

      <LogForm />

      {/* History */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Last 7 Days</h3>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity logged yet.</p>
        ) : (
          <div className="border rounded-xl overflow-x-auto table-scroll">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-right px-3 py-2 font-medium">Shadow</th>
                  <th className="text-right px-3 py-2 font-medium">Anki</th>
                  <th className="text-right px-3 py-2 font-medium">AI</th>
                  <th className="text-right px-3 py-2 font-medium hidden md:table-cell">Write</th>
                  <th className="text-right px-3 py-2 font-medium hidden md:table-cell">Talk</th>
                  <th className="text-right px-3 py-2 font-medium hidden md:table-cell">Coloc</th>
                  <th className="text-right px-4 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      {r.date}
                      {r.isBadDay && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                          MED
                        </span>
                      )}
                    </td>
                    <td className="text-right px-3 py-2.5 tabular-nums">{r.shadowingMins || '-'}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums">{r.ankiMins || '-'}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums">{r.aiConvMins || '-'}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums hidden md:table-cell">{r.writingMins || '-'}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums hidden md:table-cell">{r.selfTalkMins || '-'}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums hidden md:table-cell">{r.collocationMins || '-'}</td>
                    <td className="text-right px-4 py-2.5 font-medium tabular-nums">{r.totalMins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
