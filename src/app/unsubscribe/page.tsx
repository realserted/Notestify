import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { NotestifyLogo } from '@/components/brand/NotestifyLogo';

export const metadata: Metadata = {
  title: 'Unsubscribe — Notestify',
  robots: { index: false, follow: false },
};

/**
 * Reached from a link in a reminder email, where the reader is often not
 * signed in. The token identifies the account, so no session is required —
 * an unsubscribe that demands a login is one people replace with "mark as
 * spam", which costs far more than the lost opt-in.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let ok = false;
  if (token) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('unsubscribe_by_token', { p_token: token });
    if (error) console.error('[unsubscribe]', error);
    ok = data === true;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 bg-paper-100 px-6 text-center dark:bg-night-900">
      <Link href="/" aria-label="Notestify home">
        <NotestifyLogo size={32} />
      </Link>

      <div className="w-full max-w-[420px] rounded-pop-lg border-2 border-espresso-700 bg-paper-50 p-8 shadow-pop dark:border-night-600 dark:bg-night-800 dark:shadow-pop-dark">
        <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] text-espresso-700 dark:text-foam-50">
          {ok ? 'Reminders turned off' : "That link didn't work"}
        </h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-bark-700 dark:text-foam-50/75">
          {ok
            ? "You won't get daily study reminders any more. Everything else about your account is unchanged, and you can turn them back on in Settings whenever you like."
            : 'The link may have expired or been altered. You can always change reminders from Settings while signed in.'}
        </p>
        <Link
          href="/settings"
          className="mt-6 inline-block rounded-full border-2 border-espresso-700 bg-paper-50 px-6 py-3 text-sm font-bold text-espresso-700 transition-colors hover:bg-paper-200 dark:border-night-600 dark:bg-night-700 dark:text-foam-50 dark:hover:bg-night-600"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  );
}
