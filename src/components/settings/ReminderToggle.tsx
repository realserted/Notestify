'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

export const ReminderToggle = ({ initialEnabled }: { initialEnabled: boolean }) => {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = async () => {
    const next = !enabled;
    // Optimistic: the switch should feel instant, and a failure reverts it.
    setEnabled(next);
    setSaving(true);
    setError('');

    const res = await fetch('/api/account/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    });
    setSaving(false);

    if (!res.ok) {
      setEnabled(!next);
      setError('Could not save that. Please try again.');
      return;
    }

    // This page is a server component that read daily_reminders at render
    // time. Without invalidating the router cache, navigating away and back
    // replays the stale payload and the switch appears to have reset itself.
    router.refresh();
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <CardTitle className="text-[19px]">Daily study reminders</CardTitle>
          <p className="mt-2 text-sm text-bark-700 dark:text-foam-50/75">
            One email a day, only when you actually have cards due. Nothing is sent on days you
            have nothing to review, and every email has a one-click way out.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Daily study reminders"
          onClick={toggle}
          disabled={saving}
          className={cn(
            'relative mt-1 h-7 w-12 shrink-0 rounded-full border-2 border-espresso-700 transition-colors dark:border-espresso-900',
            enabled ? 'bg-citrus-500' : 'bg-paper-200 dark:bg-night-700',
            saving && 'opacity-60'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-espresso-700 transition-transform',
              enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm font-semibold text-clay-500 dark:text-clay-300">{error}</p>
      )}
    </Card>
  );
};
