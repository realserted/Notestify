import { Skeleton } from '@/components/ui/Skeleton';

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[760px] space-y-5">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-12 w-full rounded-pop" />
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[86px] w-full rounded-pop" />
        ))}
      </div>
    </div>
  );
}
