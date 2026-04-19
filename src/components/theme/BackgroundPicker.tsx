'use client';

import { Palette } from 'lucide-react';
import { useState } from 'react';
import { ACCENTS, useTheme } from './ThemeProvider';
import { cn } from '@/utils/cn';

interface BackgroundPickerProps {
  className?: string;
}

export const BackgroundPicker = ({ className }: BackgroundPickerProps) => {
  const { accent, setAccent } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change background color"
        aria-expanded={open}
        className={cn(
          'inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'text-ink-700 hover:bg-cream-100',
          'dark:text-cream-50 dark:hover:bg-ink-700/40',
        )}
      >
        <Palette size={18} />
        Background
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-cream-200 bg-white p-2 shadow-md dark:border-ink-700 dark:bg-ink-900"
          role="menu"
        >
          <div className="grid grid-cols-3 gap-1.5">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAccent(a.id);
                  setOpen(false);
                }}
                aria-label={a.label}
                title={a.label}
                className={cn(
                  'flex h-9 items-center justify-center rounded-md border-2 transition-transform',
                  accent === a.id
                    ? 'border-ink-900 scale-105 dark:border-cream-50'
                    : 'border-cream-200 dark:border-ink-700',
                )}
                style={{ backgroundColor: a.swatch }}
              >
                <span className="sr-only">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
