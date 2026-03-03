import { requireUser } from '@/lib/db/queries';
import { ActivatePlan } from './activate-plan';
import { EfSetForm } from './efset-form';
import { ResetProgress } from './reset-progress';

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Settings</h2>
        <p className="text-muted-foreground text-sm">Configure your 90-day learning plan</p>
      </div>

      {/* Plan Activation */}
      <div className="border rounded-xl p-5 sm:p-6 bg-card">
        <h3 className="font-semibold mb-3">90-Day Plan</h3>
        {user.planStartDate ? (
          <div>
            <p className="text-sm">
              Plan started: <span className="font-medium">{user.planStartDate}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Plan end date: {(() => {
                const end = new Date(user.planStartDate);
                end.setDate(end.getDate() + 90);
                return `${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`;
              })()}
            </p>
          </div>
        ) : (
          <ActivatePlan />
        )}
      </div>

      {/* EF SET Scores */}
      <div className="border rounded-xl p-5 sm:p-6 bg-card">
        <h3 className="font-semibold mb-3">EF SET Scores</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Record your EF SET test results to track progress.
        </p>
        <EfSetForm
          baseline={user.efSetBaseline}
          retest={user.efSetRetest}
        />
      </div>

      {/* Account Info */}
      <div className="border rounded-xl p-5 sm:p-6 bg-card">
        <h3 className="font-semibold mb-3">Account</h3>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="border rounded-xl p-5 sm:p-6 bg-card space-y-3">
        <h3 className="font-semibold">Reset</h3>
        <p className="text-sm text-muted-foreground">
          Clear current progress and restart the training cycle with clean stats.
        </p>
        <ResetProgress />
      </div>
    </div>
  );
}
