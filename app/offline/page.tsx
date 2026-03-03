import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <section className="w-full max-w-sm border rounded-xl p-6 bg-card text-center space-y-3">
        <h1 className="text-xl font-semibold">You are offline</h1>
        <p className="text-sm text-muted-foreground">
          Open the app again after internet connection is back.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Retry
        </Link>
      </section>
    </main>
  );
}
