import { NotestifyMark } from '@/components/brand/NotestifyLogo';

/**
 * Root fallback, streamed immediately while a server component resolves.
 *
 * The landing page awaits a Supabase auth check before it can render, so
 * without this the visitor sees a bare background for the length of that
 * round trip. Reuses the progress-indeterminate keyframe from globals.css.
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper-100 dark:bg-night-900">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex dark:hidden">
          <NotestifyMark size={34} tone="dark" />
        </span>
        <span className="hidden dark:inline-flex">
          <NotestifyMark size={34} tone="light" />
        </span>
        <span className="font-display text-[22px] font-bold tracking-[-0.02em] text-espresso-700 dark:text-foam-50">
          Notestify
        </span>
      </div>

      <div
        className="relative h-2.5 w-[180px] overflow-hidden rounded-full border-2 border-espresso-700 bg-paper-50 dark:border-night-600 dark:bg-night-800"
        role="status"
        aria-label="Loading"
      >
        <div
          className="absolute h-full w-1/3 bg-citrus-500"
          style={{ animation: 'progress-indeterminate 1.5s ease-in-out infinite' }}
        />
      </div>
    </div>
  );
}
