'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bug, Lightbulb, MessageCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/utils/cn';

export type FeedbackStatus = 'new' | 'triaged' | 'done' | 'wont_fix';

export interface FeedbackItem {
  id: string;
  kind: 'bug' | 'idea' | 'other';
  message: string;
  status: FeedbackStatus;
  admin_note: string | null;
  context: {
    path?: string | null;
    viewport?: string | null;
    user_agent?: string | null;
    commit?: string | null;
  } | null;
  created_at: string;
}

const KIND_META = {
  bug: { label: 'Bug', Icon: Bug, chip: 'bg-clay-500' },
  idea: { label: 'Idea', Icon: Lightbulb, chip: 'bg-citrus-500' },
  other: { label: 'Other', Icon: MessageCircle, chip: 'bg-caramel-500' },
} as const;

const STATUSES: Array<{ id: FeedbackStatus; label: string }> = [
  { id: 'new', label: 'New' },
  { id: 'triaged', label: 'Triaged' },
  { id: 'done', label: 'Done' },
  { id: 'wont_fix', label: "Won't fix" },
];

/** Trims the user agent to the part that actually helps reproduce a bug. */
const shortAgent = (ua: string | null | undefined) => {
  if (!ua) return null;
  const browser = ua.match(/(Firefox|Edg|Chrome|Safari)\/[\d.]+/g)?.slice(-1)[0];
  const platform = ua.match(/\(([^)]+)\)/)?.[1]?.split(';')[0];
  return [platform, browser].filter(Boolean).join(' · ') || ua.slice(0, 60);
};

export const FeedbackRow = ({ item }: { item: FeedbackItem }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(item.admin_note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { label, Icon, chip } = KIND_META[item.kind];

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/admin/feedback/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) return setError('Could not save that.');
    router.refresh();
  };

  return (
    <li className="rounded-pop border-2 border-espresso-700 bg-paper-50 shadow-pop dark:border-night-600 dark:bg-night-800 dark:shadow-pop-dark">
      <div className="flex items-start gap-3.5 p-4">
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border-2 border-espresso-700 dark:border-espresso-900',
            chip
          )}
          aria-hidden
        >
          <Icon size={15} className="text-espresso-700" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-bold uppercase tracking-[0.12em] text-bark-500 dark:text-bark-300">
            <span>{label}</span>
            <span aria-hidden>·</span>
            <span>{new Date(item.created_at).toLocaleString()}</span>
            {item.context?.path && (
              <>
                <span aria-hidden>·</span>
                <span className="normal-case tracking-normal text-citrus-600 dark:text-citrus-500">
                  {item.context.path}
                </span>
              </>
            )}
          </div>

          <p className="mt-1.5 whitespace-pre-wrap text-[14.5px] leading-[1.6]">{item.message}</p>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-bark-500 hover:text-espresso-700 dark:text-bark-300 dark:hover:text-foam-50"
          >
            <ChevronDown
              size={13}
              className={cn('transition-transform', expanded && 'rotate-180')}
            />
            {expanded ? 'Hide' : 'Details & notes'}
          </button>
        </div>

        <select
          value={item.status}
          onChange={(e) => patch({ status: e.target.value })}
          disabled={saving}
          aria-label="Status"
          className="shrink-0 rounded-full border-2 border-espresso-700 bg-paper-50 px-3 py-1.5 text-[12px] font-bold outline-none dark:border-night-600 dark:bg-night-700 dark:text-foam-50"
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {expanded && (
        <div className="space-y-3 border-t-2 border-paper-200 p-4 dark:border-night-700">
          <dl className="grid gap-1.5 text-[12px] sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="font-bold text-bark-500 dark:text-bark-300">Browser</dt>
              <dd>{shortAgent(item.context?.user_agent) ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold text-bark-500 dark:text-bark-300">Viewport</dt>
              <dd>{item.context?.viewport ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold text-bark-500 dark:text-bark-300">Commit</dt>
              <dd className="font-mono">{item.context?.commit ?? '—'}</dd>
            </div>
          </dl>

          <Textarea
            id={`note-${item.id}`}
            label="Private note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Only you can see this."
          />

          {error && (
            <p className="text-sm font-semibold text-clay-500 dark:text-clay-300">{error}</p>
          )}

          <Button
            size="sm"
            loading={saving}
            disabled={note === (item.admin_note ?? '')}
            onClick={() => patch({ admin_note: note.trim() || null })}
          >
            Save note
          </Button>
        </div>
      )}
    </li>
  );
};
