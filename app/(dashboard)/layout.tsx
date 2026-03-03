export const dynamic = 'force-dynamic';

import { requireUser } from '@/lib/db/queries';
import { Sidebar, MobileBottomNav } from './nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="min-h-dvh flex">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden border-b px-4 pb-3 pt-3 safe-area-top bg-card/95 backdrop-blur-sm sticky top-0 z-40">
          <h1 className="text-lg font-bold tracking-tight">English C1</h1>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-20 md:pb-8 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
