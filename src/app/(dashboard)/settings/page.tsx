import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardTitle } from '@/components/ui/Card';
import { AccountActions } from '@/components/settings/AccountActions';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
  const provider = user.app_metadata?.provider === 'google' ? 'Google' : 'Email and password';

  return (
    <div className="mx-auto max-w-[760px] space-y-5">
      <h1 className="font-display text-[32px] font-extrabold tracking-[-0.035em] sm:text-4xl">
        Settings
      </h1>

      <Card className="p-6">
        <CardTitle className="text-[19px]">Account</CardTitle>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="font-semibold text-bark-500 dark:text-bark-300">Email</dt>
            <dd className="font-bold">{user.email}</dd>
          </div>
          {fullName && (
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-semibold text-bark-500 dark:text-bark-300">Name</dt>
              <dd className="font-bold">{fullName}</dd>
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="font-semibold text-bark-500 dark:text-bark-300">Sign-in method</dt>
            <dd className="font-bold">{provider}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="font-semibold text-bark-500 dark:text-bark-300">Member since</dt>
            <dd className="font-bold">{new Date(user.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>
      </Card>

      <AccountActions email={user.email ?? ''} />

      <p className="text-[13px] text-bark-500 dark:text-bark-300">
        See the{' '}
        <Link
          href="/privacy"
          className="font-semibold text-citrus-600 underline decoration-2 underline-offset-2 dark:text-citrus-500"
        >
          Privacy Policy
        </Link>{' '}
        for what we store and how long we keep it.
      </p>
    </div>
  );
}
