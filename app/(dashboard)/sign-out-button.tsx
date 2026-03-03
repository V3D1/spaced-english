'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.push('/sign-in');
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}
