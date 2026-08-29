import { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'animate-pulse rounded-md bg-paper-200 dark:bg-night-700',
      className
    )}
    {...props}
  />
);
