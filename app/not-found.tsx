import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold tabular-nums mb-2">404</p>
        <p className="text-muted-foreground mb-6">This page doesn't exist</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
