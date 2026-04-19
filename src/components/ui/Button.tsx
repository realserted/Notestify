'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-coral-500 text-white hover:bg-coral-600 disabled:bg-coral-500/50 dark:hover:bg-coral-600',
  secondary:
    'bg-cream-100 text-ink-900 hover:bg-cream-200 dark:bg-ink-700 dark:text-cream-50 dark:hover:bg-ink-700/80',
  outline:
    'border border-cream-200 text-ink-700 hover:bg-cream-100 dark:border-ink-700 dark:text-cream-50 dark:hover:bg-ink-700/40',
  ghost:
    'text-ink-700 hover:bg-cream-100 dark:text-cream-50 dark:hover:bg-ink-700/40',
  danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
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
