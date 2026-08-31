import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, emailConfigured } from '@/lib/email/send';
import { reminderEmail } from '@/lib/email/reminder';

/** Long enough for a batch, short enough to stay inside the platform limit. */
export const maxDuration = 60;

interface DueRow {
  user_id: string;
  email: string;
  full_name: string | null;
  reminder_token: string;
  due_count: number;
}

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://www.notestify.com';

/**
 * Sends one reminder per opted-in user who has cards due.
 *
 * Uses the admin client deliberately: there is no user session on a cron run,
 * and the job must see every account. Authorisation is therefore entirely the
 * CRON_SECRET check below — Vercel Cron sends it as a bearer token.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  // Fail closed. Without a secret configured this endpoint would let anyone
  // trigger a send to every user.
  if (!secret) {
    console.error('[cron/reminders] CRON_SECRET is not set');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!emailConfigured()) {
    return NextResponse.json({ error: 'Email is not configured' }, { status: 503 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin.rpc('users_due_for_reminder', {
    p_min_hours_since: 20,
  });

  if (error) {
    console.error('[cron/reminders]', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  const recipients = (data ?? []) as DueRow[];
  let sent = 0;
  let failed = 0;

  for (const row of recipients) {
    const { subject, html, text } = reminderEmail({
      firstName: row.full_name?.split(' ')[0] ?? null,
      dueCount: Number(row.due_count),
      studyUrl: `${siteUrl()}/decks`,
      unsubscribeUrl: `${siteUrl()}/unsubscribe?token=${row.reminder_token}`,
    });

    const ok = await sendEmail({ to: row.email, subject, html, text });

    if (ok) {
      sent += 1;
      // Stamped only on success, so a provider outage means a retry tomorrow
      // rather than a silently skipped day.
      await admin
        .from('profiles')
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .eq('id', row.user_id);
    } else {
      failed += 1;
    }
  }

  console.info(`[cron/reminders] candidates=${recipients.length} sent=${sent} failed=${failed}`);
  return NextResponse.json({ candidates: recipients.length, sent, failed });
}
