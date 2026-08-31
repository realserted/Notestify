/**
 * Transactional email via Resend, called over fetch rather than adding the SDK
 * as a dependency — the API is a single POST.
 *
 * Returns false rather than throwing: a failed reminder should never take down
 * the cron run for everyone else.
 */
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export const emailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.REMINDER_FROM_EMAIL);

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative. Mail without one is far likelier to be filtered. */
  text: string;
}): Promise<boolean> => {
  if (!emailConfigured()) {
    console.warn('[email] RESEND_API_KEY or REMINDER_FROM_EMAIL not set; skipping');
    return false;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.REMINDER_FROM_EMAIL,
        to,
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      console.error('[email] send failed', res.status, await res.text().catch(() => ''));
      return false;
    }

    return true;
  } catch (error) {
    console.error('[email] send threw', error);
    return false;
  }
};
