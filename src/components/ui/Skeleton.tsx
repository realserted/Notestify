import { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'animate-pulse rounded-md bg-slate-200 dark:bg-slate-800',
      className
    )}
    {...props}
  />
);
