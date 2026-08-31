/** Plain, short, and honest — a study nudge, not a marketing email. */
export const reminderEmail = ({
  firstName,
  dueCount,
  studyUrl,
  unsubscribeUrl,
}: {
  firstName: string | null;
  dueCount: number;
  studyUrl: string;
  unsubscribeUrl: string;
}) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const cards = `${dueCount} ${dueCount === 1 ? 'card' : 'cards'}`;
  const minutes = Math.max(1, Math.round(dueCount / 3));

  const subject = `${cards} due today`;

  const text = [
    greeting,
    '',
    `You have ${cards} ready for review — about ${minutes} ${
      minutes === 1 ? 'minute' : 'minutes'
    }.`,
    '',
    `Review them: ${studyUrl}`,
    '',
    '---',
    `Stop these reminders: ${unsubscribeUrl}`,
  ].join('\n');

  // Table-based and inline-styled: email clients strip <style> blocks and have
  // patchy flexbox support.
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#F7E9D6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2E1A0E;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:460px;margin:0 auto;background:#FFFBF4;border:2px solid #2E1A0E;border-radius:16px;">
      <tr>
        <td style="padding:28px;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">${greeting}</p>
          <p style="margin:0 0 6px;font-size:40px;font-weight:800;line-height:1;">${dueCount}</p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">
            ${dueCount === 1 ? 'card is' : 'cards are'} ready for review — about ${minutes} ${
              minutes === 1 ? 'minute' : 'minutes'
            }.
          </p>
          <a href="${studyUrl}" style="display:inline-block;background:#3A2112;color:#FFFBF4;text-decoration:none;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px;border:2px solid #2E1A0E;">
            Start reviewing
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 24px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8A6E55;border-top:2px solid #EFE0CB;padding-top:16px;">
            You're getting this because you turned on daily reminders in Notestify.
            <a href="${unsubscribeUrl}" style="color:#8A6E55;">Turn them off</a>.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
};
