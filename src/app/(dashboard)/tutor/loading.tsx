import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export default function TutorLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <Skeleton className="mb-4 h-9 w-32" />
      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="ml-auto h-10 w-1/2" />
          <Skeleton className="h-10 w-3/4" />
        </div>
        <div className="flex gap-2 border-t border-cream-200 p-4 dark:border-ink-700">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-16" />
        </div>
      </Card>
    </div>
  );
}
