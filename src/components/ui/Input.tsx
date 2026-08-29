import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold uppercase tracking-wider text-bark-500 dark:text-bark-300"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-pop border-2 border-espresso-700 bg-paper-50 px-4 py-2.5 text-base text-espresso-700 outline-none transition-shadow sm:text-sm',
          'placeholder:text-bark-500/70',
          'focus:shadow-pop-sm',
          'dark:border-night-600 dark:bg-night-800 dark:text-foam-50 dark:placeholder:text-bark-300/60 dark:focus:shadow-pop-dark',
          error && 'border-clay-500 dark:border-clay-300',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-semibold text-clay-500 dark:text-clay-300">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
