import { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'animate-pulse rounded-md bg-cream-100 dark:bg-ink-700/50',
      className
    )}
    {...props}
  />
);
