import { cn, localDateString } from '@/lib/utils';

interface DayData {
  date: string;
  totalMins: number;
}

interface StreakCalendarProps {
  days: DayData[];
}

function getColor(mins: number): string {
  if (mins >= 30) return 'bg-green-500';
  if (mins >= 5) return 'bg-yellow-500';
  return 'bg-muted';
}

function getLabel(mins: number): string {
  if (mins >= 30) return '30+ min';
  if (mins >= 5) return `${mins} min`;
  return 'No activity';
}

export function StreakCalendar({ days }: StreakCalendarProps) {
  // Build 30-day grid (today backwards)
  const grid: DayData[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = localDateString(d);
    const match = days.find((r) => r.date === dateStr);
    grid.push({ date: dateStr, totalMins: match?.totalMins ?? 0 });
  }

  // Weekday labels for first column
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  // Figure out what day of week the first day is (0=Sun, adjust to Mon=0)
  const firstDate = new Date(grid[0].date + 'T12:00:00');
  const startDow = (firstDate.getDay() + 6) % 7; // Mon=0

  // Build columns (weeks), with empty cells for alignment
  const cells: (DayData | null)[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push(null);
  }
  cells.push(...grid);

  // Split into rows of 7
  const rows: (DayData | null)[][] = [];
  for (let i = 0; i < 7; i++) {
    rows.push([]);
  }
  for (let i = 0; i < cells.length; i++) {
    rows[i % 7].push(cells[i]);
  }

  return (
    <div className="border rounded-xl p-4 bg-card">
      <p className="text-sm font-medium mb-3">Last 30 Days</p>
      <div className="flex gap-1.5">
        {/* Weekday labels */}
        <div className="flex flex-col gap-1">
          {weekdays.map((label, i) => (
            <div
              key={i}
              className="h-4 w-4 flex items-center justify-center text-[9px] text-muted-foreground"
            >
              {i % 2 === 0 ? label : ''}
            </div>
          ))}
        </div>

        {/* Grid columns */}
        {Array.from({ length: Math.ceil(cells.length / 7) }).map((_, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-1">
            {rows.map((row, rowIdx) => {
              const cell = row[colIdx];
              if (!cell) {
                return <div key={rowIdx} className="h-4 w-4" />;
              }
              return (
                <div
                  key={rowIdx}
                  className={cn(
                    'h-4 w-4 rounded-sm transition-colors',
                    getColor(cell.totalMins)
                  )}
                  title={`${cell.date}: ${getLabel(cell.totalMins)}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-muted" />
          <span>0 min</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-yellow-500" />
          <span>5-29 min</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-green-500" />
          <span>30+ min</span>
        </div>
      </div>
    </div>
  );
}
