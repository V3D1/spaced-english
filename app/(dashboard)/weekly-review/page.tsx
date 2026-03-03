import { getWeeklyReviews, getCurrentWeekStats } from './actions';
import { getStreak } from '../activity/actions';
import { ReviewForm } from './review-form';

export default async function WeeklyReviewPage() {
  const [reviews, weekStats, streak] = await Promise.all([
    getWeeklyReviews(),
    getCurrentWeekStats(),
    getStreak(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Weekly Review</h2>
        <p className="text-muted-foreground text-sm">
          Reflect on your progress each week
        </p>
      </div>

      {/* Current week form */}
      <ReviewForm
        weekNumber={weekStats.weekNumber || 1}
        phase={weekStats.phase}
        totalMins={weekStats.totalMins}
        activeDays={weekStats.activeDays}
        streak={streak}
      />

      {/* Previous reviews */}
      {reviews.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-4">Previous Reviews</h3>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-xl p-5 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Week {review.weekNumber}</h4>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Phase {review.phase}</span>
                    <span>{review.totalMins} min</span>
                    <span>{review.streak} day streak</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-700 mb-1">Went well</p>
                    <p className="text-muted-foreground">{review.wentWell}</p>
                  </div>
                  <div>
                    <p className="font-medium text-orange-700 mb-1">Was difficult</p>
                    <p className="text-muted-foreground">{review.wasDifficult}</p>
                  </div>
                  {review.insightOfWeek && (
                    <div>
                      <p className="font-medium text-blue-700 mb-1">Insight</p>
                      <p className="text-muted-foreground">{review.insightOfWeek}</p>
                    </div>
                  )}
                  {review.nextFocus && (
                    <div>
                      <p className="font-medium text-purple-700 mb-1">Next focus</p>
                      <p className="text-muted-foreground">{review.nextFocus}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
