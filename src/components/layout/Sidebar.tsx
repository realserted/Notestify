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
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { BackgroundPicker } from '@/components/theme/BackgroundPicker';
import { TutorialButton } from '@/components/tutorial/TutorialButton';
import { cn } from '@/utils/cn';

// Each item keeps a dot colour so the nav reads as a set of tags, not a list of links.
const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tourId: 'dashboard', dot: 'bg-espresso-500' },
  { href: '/notes', label: 'Notes', icon: NotebookPen, tourId: 'notes', dot: 'bg-clay-500' },
  { href: '/decks', label: 'Decks', icon: BookOpen, tourId: 'decks', dot: 'bg-citrus-500' },
  { href: '/quizzes', label: 'Quizzes', icon: FileText, tourId: 'quizzes', dot: 'bg-citrus-300' },
  { href: '/uploads', label: 'Uploads', icon: Upload, tourId: 'uploads', dot: 'bg-olive-300' },
  { href: '/tutor', label: 'AI Tutor', icon: MessageSquare, tourId: 'tutor', dot: 'bg-bark-500' },
];

interface SidebarProps {
  onNavigate?: () => void;
  /** Optional: current streak, rendered in the block above Sign out. */
  streak?: number;
}

export const Sidebar = ({ onNavigate, streak = 0 }: SidebarProps) => {
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
    <aside className="flex h-[100dvh] w-64 flex-col border-r-2 border-espresso-700 bg-paper-50 dark:border-night-600 dark:bg-night-800 md:h-auto md:w-61">
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-2.5">
          <span className="h-3.5 w-3.5 rounded-[5px] border-2 border-espresso-700 bg-citrus-500 dark:border-espresso-900" />
          <h1 className="font-display text-xl font-bold tracking-tight text-espresso-700 dark:text-foam-50">
            Notestify
          </h1>
        </div>
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

      <nav className="flex-1 space-y-1 px-3">
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
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 px-3 py-3">
        <TutorialButton className="w-full justify-start" />
        <div data-tour="theme">
          <ThemeToggle className="w-full justify-start" />
        </div>
        <div data-tour="background">
          <BackgroundPicker />
        </div>
      </div>

      {streak > 0 && (
        <div className="mx-3 mb-3 rounded-pop border-2 border-espresso-700 bg-citrus-500 p-4 dark:border-espresso-900">
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

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-6 py-4 text-sm font-semibold text-bark-500 transition-colors hover:bg-paper-200 dark:text-bark-300 dark:hover:bg-night-700"
      >
        <LogOut size={18} />
        Sign out
      </button>
    </aside>
  );
};
