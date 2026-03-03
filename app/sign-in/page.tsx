'use client';

import { useActionState } from 'react';
import { signIn } from './actions';
import { Loader2, BookOpen } from 'lucide-react';

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signIn, { error: '' });

  return (
    <div className="min-h-dvh flex items-center justify-center bg-muted/30 px-4 safe-area-bottom">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-card border rounded-xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-4">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">English C1</h1>
            <p className="text-sm text-muted-foreground mt-1">
              90-day learning platform
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
              />
            </div>

            {/* Honeypot — hidden from humans, bots fill it */}
            <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px]">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive font-medium">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
