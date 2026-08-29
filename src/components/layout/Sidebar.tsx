'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  MessageSquare,
  NotebookPen,
  Upload,
  LogOut,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { BackgroundPicker } from '@/components/theme/BackgroundPicker';
import { TutorialButton } from '@/components/tutorial/TutorialButton';
import { NotestifyLogo } from '@/components/brand/NotestifyLogo';
import { cn } from '@/utils/cn';

// Each item keeps a dot colour so the nav reads as a set of tags, not a list of links.
const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tourId: 'dashboard', dot: 'bg-espresso-500' },
  { href: '/notes', label: 'Notes', icon: NotebookPen, tourId: 'notes', dot: 'bg-clay-500' },
  { href: '/decks', label: 'Decks', icon: BookOpen, tourId: 'decks', dot: 'bg-citrus-500' },
  { href: '/quizzes', label: 'Quizzes', icon: FileText, tourId: 'quizzes', dot: 'bg-citrus-300' },
  { href: '/uploads', label: 'Uploads', icon: Upload, tourId: 'uploads', dot: 'bg-olive-300' },
  { href: '/tutor', label: 'AI Tutor', icon: MessageSquare, tourId: 'tutor', dot: 'bg-bark-500' },
  { href: '/search', label: 'Search', icon: Search, tourId: 'search', dot: 'bg-caramel-500' },
];

interface SidebarProps {
  onNavigate?: () => void;
  /** Optional: current streak, rendered in the block above Sign out. */
  streak?: number;
  /** Cards due now — badged on Decks so there is a visible reason to return. */
  dueCount?: number;
}

export const Sidebar = ({ onNavigate, streak = 0, dueCount = 0 }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const week = Array.from({ length: 7 }, (_, i) => i < Math.min(streak, 7));

  return (
    <aside className="flex h-[100dvh] w-64 flex-col overflow-y-auto border-r-2 border-espresso-700 bg-paper-50 dark:border-night-600 dark:bg-night-800 md:h-full md:w-61">
      <div className="flex items-center justify-between p-5">
        <NotestifyLogo size={30} />
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close menu"
            className="-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-bark-700 hover:bg-paper-200 dark:text-foam-50 dark:hover:bg-night-700 md:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon, tourId, dot }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              data-tour={tourId}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 whitespace-nowrap rounded-pop border-2 px-3.5 py-2.5 text-sm font-semibold transition-colors',
                active
                  ? 'border-espresso-700 bg-espresso-500 text-paper-50 shadow-pop-sm dark:border-espresso-900 dark:bg-citrus-500 dark:text-espresso-900 dark:shadow-pop-dark'
                  : 'border-transparent text-bark-700 hover:bg-paper-200 dark:text-foam-50/80 dark:hover:bg-night-700'
              )}
            >
              <span
                className={cn(
                  'h-2.5 w-2.5 shrink-0 rounded-full',
                  active ? 'bg-citrus-500 dark:bg-espresso-900' : dot
                )}
                aria-hidden
              />
              <Icon size={17} className="shrink-0" />
              {label}
              {href === '/decks' && dueCount > 0 && (
                <span
                  className={cn(
                    'ml-auto rounded-full border-2 px-2 py-0.5 text-[11px] font-bold tabular-nums',
                    active
                      ? 'border-espresso-900 bg-paper-50 text-espresso-700'
                      : 'border-espresso-700 bg-citrus-500 text-espresso-700 dark:border-espresso-900'
                  )}
                >
                  {dueCount > 99 ? '99+' : dueCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 space-y-1 border-t-2 border-paper-200 px-3 pt-3 dark:border-night-700">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-pop px-3.5 py-2.5 text-sm font-semibold transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-paper-200 text-espresso-700 dark:bg-night-700 dark:text-foam-50'
              : 'text-bark-700 hover:bg-paper-200 dark:text-foam-50 dark:hover:bg-night-700'
          )}
        >
          <Settings size={18} />
          Settings
        </Link>
        <TutorialButton className="w-full justify-start" />
        <div data-tour="theme">
          <ThemeToggle className="w-full justify-start" />
        </div>
        <div data-tour="background">
          <BackgroundPicker />
        </div>
      </div>

      {streak > 0 && (
        <div className="mx-3 mt-3 rounded-pop border-2 border-espresso-700 bg-citrus-500 p-4 dark:border-espresso-900">
          <p className="font-display text-3xl font-bold leading-none text-espresso-700">{streak}</p>
          <p className="mt-1 text-xs font-semibold text-espresso-700">day streak</p>
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {week.map((on, i) => (
              <span
                key={i}
                className={cn('h-2.5 w-2.5 rounded-[4px]', on ? 'bg-espresso-700' : 'bg-espresso-700/25')}
              />
            ))}
          </div>
        </div>
      )}

      <nav className="mt-3 flex flex-wrap gap-x-3 gap-y-1 px-6 text-[11px] font-semibold text-bark-500 dark:text-bark-300">
        <Link href="/about" onClick={onNavigate} className="hover:underline">
          About
        </Link>
        <Link href="/privacy" onClick={onNavigate} className="hover:underline">
          Privacy
        </Link>
        <Link href="/terms" onClick={onNavigate} className="hover:underline">
          Terms
        </Link>
      </nav>

      <button
        onClick={handleLogout}
        className="mt-1 flex items-center gap-3 px-6 py-3 text-sm font-semibold text-bark-500 transition-colors hover:bg-paper-200 dark:text-bark-300 dark:hover:bg-night-700"
      >
        <LogOut size={18} />
        Sign out
      </button>
    </aside>
  );
};
