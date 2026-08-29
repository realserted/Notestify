'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

// Every filled/outlined variant carries the 2px ink border. Primary and danger
// also carry the hard offset shadow and press into it on :active.
const variants: Record<Variant, string> = {
  primary:
    'border-2 border-espresso-700 bg-espresso-500 text-paper-50 shadow-pop-sm hover:bg-espresso-700 ' +
    'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ' +
    'dark:border-espresso-900 dark:bg-citrus-500 dark:text-espresso-900 dark:shadow-pop-dark dark:hover:bg-citrus-300',
  secondary:
    'border-2 border-espresso-700 bg-citrus-500 text-espresso-700 shadow-pop-sm hover:bg-citrus-300 ' +
    'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ' +
    'dark:border-espresso-900 dark:shadow-pop-dark',
  outline:
    'border-2 border-espresso-700 bg-paper-50 text-espresso-700 hover:bg-paper-200 ' +
    'dark:border-night-600 dark:bg-night-800 dark:text-foam-50 dark:hover:bg-night-700',
  ghost:
    'border-2 border-transparent text-bark-700 hover:bg-paper-200 ' +
    'dark:text-foam-50 dark:hover:bg-night-700',
  danger:
    'border-2 border-espresso-700 bg-clay-500 text-paper-50 shadow-pop-sm hover:brightness-110 ' +
    'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ' +
    'dark:border-espresso-900 dark:shadow-pop-dark',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold transition-all duration-100',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-x-0 disabled:active:translate-y-0',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? 'Loading…' : children}
    </button>
  )
);
Button.displayName = 'Button';
