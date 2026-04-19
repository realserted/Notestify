'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'text-slate-700 hover:bg-slate-100',
        'dark:text-slate-200 dark:hover:bg-slate-800',
        className
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
};