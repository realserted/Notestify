'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  className?: string;
  /** Compact circular button with no label — for headers rather than nav lists. */
  iconOnly?: boolean;
}

export const ThemeToggle = ({ className, iconOnly = false }: ThemeToggleProps) => {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-full border-2',
          'border-espresso-700 bg-paper-50 text-espresso-700 transition-all duration-100',
          'hover:bg-paper-200 active:translate-x-[2px] active:translate-y-[2px]',
          'dark:border-night-600 dark:bg-night-800 dark:text-foam-50 dark:hover:bg-night-700',
          className
        )}
      >
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-3 rounded-pop px-3.5 py-2.5 text-sm font-semibold transition-colors',
        'text-bark-700 hover:bg-paper-200',
        'dark:text-foam-50 dark:hover:bg-night-700',
        className
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
};
