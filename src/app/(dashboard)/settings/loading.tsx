import { Skeleton } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-[760px] space-y-5">
      <Skeleton className="h-10 w-36" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[168px] w-full rounded-pop" />
      ))}
    </div>
  );
}
