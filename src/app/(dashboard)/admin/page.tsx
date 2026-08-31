import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/admin';
import { Card } from '@/components/ui/Card';
import { FeedbackRow, type FeedbackItem } from '@/components/admin/FeedbackRow';
import { cn } from '@/utils/cn';

const KIND_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'bug', label: 'Bugs' },
  { id: 'idea', label: 'Ideas' },
  { id: 'other', label: 'Other' },
] as const;

const STATUS_FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'triaged', label: 'Triaged' },
  { id: 'done', label: 'Done' },
  { id: 'wont_fix', label: "Won't fix" },
] as const;

const buildHref = (kind: string, status: string) => {
  const params = new URLSearchParams();
  if (kind !== 'all') params.set('kind', kind);
  if (status !== 'open') params.set('status', status);
  const qs = params.toString();
  return qs ? `/admin?${qs}` : '/admin';
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 404 rather than 403: a non-admin should not learn this route exists.
  if (!isAdmin(user)) notFound();

  const { kind = 'all', status = 'open' } = await searchParams;

  let query = supabase
    .from('feedback')
    .select('id, kind, message, status, admin_note, context, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (kind !== 'all') query = query.eq('kind', kind);
  if (status === 'open') query = query.in('status', ['new', 'triaged']);
  else if (status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) console.error('[admin]', error);
  const items = (data ?? []) as FeedbackItem[];

  // Counts across everything, so the tab badges do not shift with the filter.
  const { data: allRows } = await supabase.from('feedback').select('status');
  const counts = (allRows ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status as string] = (acc[r.status as string] ?? 0) + 1;
    return acc;
  }, {});
  const openCount = (counts.new ?? 0) + (counts.triaged ?? 0);

  return (
    <div className="mx-auto max-w-[860px] space-y-5">
      <div>
        <h1 className="font-display text-[32px] font-extrabold tracking-[-0.035em] sm:text-4xl">
          Feedback
        </h1>
        <p className="mt-1 text-[15px] text-bark-700 dark:text-foam-50/70">
          {openCount} open · {allRows?.length ?? 0} total
        </p>
      </div>

      <div className="space-y-2.5">
        <FilterRow
          label="Kind"
          options={KIND_FILTERS}
          current={kind}
          href={(id) => buildHref(id, status)}
        />
        <FilterRow
          label="Status"
          options={STATUS_FILTERS}
          current={status}
          href={(id) => buildHref(kind, id)}
        />
      </div>

      {items.length === 0 ? (
        <Card className="py-10 text-center">
          <p className="text-bark-500 dark:text-bark-300">Nothing here.</p>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <FeedbackRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

const FilterRow = ({
  label,
  options,
  current,
  href,
}: {
  label: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  current: string;
  href: (id: string) => string;
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="w-14 text-[11px] font-bold uppercase tracking-[0.12em] text-bark-500 dark:text-bark-300">
      {label}
    </span>
    {options.map((o) => (
      <Link
        key={o.id}
        href={href(o.id)}
        className={cn(
          'rounded-full border-2 px-3.5 py-1 text-[12.5px] font-bold transition-colors',
          current === o.id
            ? 'border-espresso-700 bg-espresso-500 text-paper-50 shadow-pop-sm dark:border-espresso-900 dark:bg-citrus-500 dark:text-espresso-900'
            : 'border-paper-300 text-bark-700 hover:bg-paper-200 dark:border-night-600 dark:text-foam-50 dark:hover:bg-night-700'
        )}
      >
        {o.label}
      </Link>
    ))}
  </div>
);
