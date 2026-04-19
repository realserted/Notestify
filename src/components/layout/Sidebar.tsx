'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Upload,
  LogOut,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { TutorialButton } from '@/components/tutorial/TutorialButton';
import { cn } from '@/utils/cn';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tourId: 'dashboard' },
  { href: '/decks', label: 'Decks', icon: BookOpen, tourId: 'decks' },
  { href: '/quizzes', label: 'Quizzes', icon: FileText, tourId: 'quizzes' },
  { href: '/uploads', label: 'Uploads', icon: Upload, tourId: 'uploads' },
  { href: '/tutor', label: 'AI Tutor', icon: MessageSquare, tourId: 'tutor' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <aside className="flex h-[100dvh] w-64 flex-col border-r border-cream-200 bg-white dark:border-ink-700 dark:bg-ink-900/80 md:h-auto md:w-60">
      <div className="flex items-center justify-between border-b border-cream-200 p-5 dark:border-ink-700">
        <h1 className="font-serif text-xl tracking-tight text-ink-900 dark:text-cream-50">
          Notestify
        </h1>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close menu"
            className="-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 hover:bg-cream-100 dark:text-cream-50 dark:hover:bg-ink-700/40 md:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon, tourId }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              data-tour={tourId}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-cream-100 text-coral-600 dark:bg-ink-700/60 dark:text-coral-500'
                  : 'text-ink-700 hover:bg-cream-100 dark:text-cream-50/80 dark:hover:bg-ink-700/40'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-cream-200 p-3 dark:border-ink-700">
        <TutorialButton className="w-full justify-start" />
        <div data-tour="theme">
          <ThemeToggle className="w-full justify-start" />
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 border-t border-cream-200 px-6 py-4 text-sm text-ink-500 transition-colors hover:bg-cream-100 dark:border-ink-700 dark:text-cream-50/70 dark:hover:bg-ink-700/40"
      >
        <LogOut size={18} />
        Sign out
      </button>
    </aside>
  );
};
