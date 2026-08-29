import { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-pop border-2 border-espresso-700 bg-paper-50 p-6 shadow-pop',
      'dark:border-night-600 dark:bg-night-800 dark:shadow-pop-dark',
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4 flex items-center justify-between', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      'font-display text-lg font-bold tracking-tight text-espresso-700 dark:text-foam-50',
      className
    )}
    {...props}
  />
);

/** Optional: a coloured strip across the top of a card, as on the landing feature cards. */
export const CardStripe = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('-mx-6 -mt-6 mb-5 h-9 border-b-2 border-espresso-700 bg-citrus-500', className)}
    {...props}
  />
);
