'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Rocket,
  ArrowLeftRight,
  BookOpen,
  Activity,
  PenLine,
  Library,
  CalendarCheck,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { SignOutButton } from './sign-out-button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/daily-plan', label: 'Daily Plan', icon: Rocket },
  { href: '/input-output', label: 'Input/Output', icon: ArrowLeftRight },
  { href: '/flashcards', label: 'Flashcards', icon: BookOpen },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/practice', label: 'Practice', icon: PenLine },
  { href: '/collocations', label: 'Collocations', icon: Library },
  { href: '/weekly-review', label: 'Review', icon: CalendarCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const mobilePrimaryHrefs = new Set(['/dashboard', '/daily-plan', '/flashcards', '/practice']);
const mobilePrimaryItems = navItems.filter((item) => mobilePrimaryHrefs.has(item.href));
const mobileMoreItems = navItems.filter((item) => !mobilePrimaryHrefs.has(item.href));

export function Sidebar() {
  const pathname = usePathname();
  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="w-64 border-r bg-card hidden md:flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-lg font-bold tracking-tight">Spaced English</h1>
        <p className="text-xs text-muted-foreground">90-day learning plan</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <SignOutButton />
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm safe-area-bottom">
      {isMoreOpen && (
        <div className="absolute left-2 right-2 bottom-16 rounded-xl border bg-card shadow-lg p-2 space-y-1">
          {mobileMoreItems.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => setIsMoreOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="border-t pt-1">
            <SignOutButton />
          </div>
        </div>
      )}
      <div className="flex items-center justify-around h-14">
        {mobilePrimaryItems.map((item) => {
          const isActive = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors ${
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setIsMoreOpen((current) => !current)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors ${
            isMoreOpen ? 'text-primary font-medium' : 'text-muted-foreground'
          }`}
          aria-expanded={isMoreOpen}
          aria-label="Open more navigation options"
        >
          <MoreHorizontal className={`h-5 w-5 ${isMoreOpen ? 'stroke-[2.5]' : ''}`} />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
