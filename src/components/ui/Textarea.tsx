import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-ink-700 dark:text-cream-50"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-base text-ink-900 outline-none transition-colors focus:border-coral-500 focus:ring-1 focus:ring-coral-500 sm:text-sm',
          'placeholder:text-ink-500/60',
          'dark:border-ink-700 dark:bg-ink-900 dark:text-cream-50 dark:placeholder:text-cream-50/40 dark:focus:border-coral-500 dark:focus:ring-coral-500',
          error && 'border-red-500 dark:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';
