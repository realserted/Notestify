import type { Metadata } from 'next';
import { LegalPage, Section, Bullets, Notice } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — Notestify',
  description: 'What Notestify collects, where it goes, and how to get rid of it.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="29 August 2026">
      <p>
        Notestify (&ldquo;we&rdquo;, &ldquo;the service&rdquo;) is operated by Lester Lawrence
        Sanchez, based in the Philippines. This policy explains what we collect, why, who else sees
        it, and how to remove it.
      </p>

      <Section heading="What we collect">
        <Bullets
          items={[
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">
                Account details.
              </strong>{' '}
              Your email address, and — if you sign in with Google — the name and profile picture
              your Google account provides. We never receive your Google password.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">
                Content you create.
              </strong>{' '}
              Notebooks, notes, decks, flashcards, quizzes, and annotations you make on documents.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">
                Files you upload.
              </strong>{' '}
              PDFs you add, plus the text extracted from them and any summary generated from that
              text.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">
                Tutor conversations.
              </strong>{' '}
              Every message you send the AI tutor and every reply, stored so you can return to past
              sessions.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">
                Study activity.
              </strong>{' '}
              Which cards you reviewed and how you graded them, and your quiz attempts and answers.
              This is what streaks, due counts, and progress are calculated from.
            </>,
          ]}
        />
        <p>
          We do not collect payment details, we do not run advertising or third-party analytics, and
          we do not buy or sell personal data.
        </p>
      </Section>

      <Section heading="Where your content goes">
        <Notice>
          <p className="font-semibold text-espresso-700 dark:text-foam-50">
            AI features send your content to Google.
          </p>
          <p className="mt-2">
            When you generate flashcards, quizzes, or a summary, the relevant text is sent to
            Google&apos;s Gemini API. When you use the AI tutor, your messages and the recent
            history of that conversation are sent too. If a document contains something you would
            not want processed by a third party, do not run AI features on it.
          </p>
        </Notice>
        <p>We rely on these providers to run the service:</p>
        <Bullets
          items={[
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">Supabase</strong> —
              accounts, database, and file storage. All of your content lives here.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">
                Google (Gemini API)
              </strong>{' '}
              — processes text for the AI features, as described above.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">
                Google (Sign-In)
              </strong>{' '}
              — only if you choose to sign in with Google.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">Vercel</strong> —
              hosting. Handles requests and keeps standard server logs.
            </>,
          ]}
        />
        <p className="text-bark-500 dark:text-bark-300">
          Each of these processes data under its own terms, and may store it outside your country.
        </p>
      </Section>

      <Section heading="Cookies and local storage">
        <p>
          We use no advertising or tracking cookies. What we do store on your device is limited to:
        </p>
        <Bullets
          items={[
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">
                Session cookies
              </strong>{' '}
              set by Supabase to keep you signed in. Without these the service cannot work.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">
                Two preferences
              </strong>{' '}
              in your browser&apos;s local storage — your light/dark choice and your accent colour.
              These never leave your device.
            </>,
          ]}
        />
      </Section>

      <Section heading="How your data is protected">
        <p>
          Every table is protected by row-level security, enforced by the database itself: a
          signed-in account can only ever read or write its own rows. Traffic is encrypted in
          transit. That said, no service is perfectly secure, and this one is maintained by a small
          independent team rather than a dedicated security department — please weigh that when
          deciding what to upload.
        </p>
      </Section>

      <Section heading="Keeping and deleting data">
        <p>
          We keep your content until you delete it or close your account. You can delete individual
          tutor sessions, notes, decks, and documents from within the app at any time; deleting a
          conversation removes its messages with it.
        </p>
        <p>
          To delete your account and everything attached to it, contact us at{' '}
          <a href="mailto:realserted@gmail.com" className="font-semibold text-citrus-600 underline decoration-2 underline-offset-2 dark:text-citrus-500">realserted@gmail.com</a>. Account deletion cascades to all of your content. Copies may
          persist in encrypted backups for a short period, and text already sent to Google is
          governed by Google&apos;s retention terms rather than ours.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export, or delete
          your personal data, to withdraw consent, or to complain to a data protection authority. We
          extend these to everyone regardless of location. To exercise any of them, write to{' '}
          <a href="mailto:realserted@gmail.com" className="font-semibold text-citrus-600 underline decoration-2 underline-offset-2 dark:text-citrus-500">realserted@gmail.com</a>.
        </p>
      </Section>

      <Section heading="Age">
        <p>
          Notestify is not intended for children under 13, or under the minimum age of digital
          consent in your country where that is higher. We do not knowingly collect data from them.
          If you believe a child has created an account, contact us and we will remove it.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          If this policy changes in a way that materially affects you, we will update the date at
          the top and give notice in the app before the change takes effect.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about this policy, or a request about your data: <a href="mailto:realserted@gmail.com" className="font-semibold text-citrus-600 underline decoration-2 underline-offset-2 dark:text-citrus-500">realserted@gmail.com</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
