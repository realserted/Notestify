import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalPage, Section, Bullets } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'About — Notestify',
  description: 'What Notestify is, how it works, and what it is built on.',
};

export default function AboutPage() {
  return (
    <LegalPage title="About Notestify">
      <p className="text-[17.5px] leading-[1.6]">
        Notestify turns the material you already have — lecture PDFs, slides, your own notes — into
        flashcards, quizzes, and a tutor you can ask questions. It is a study tool, not a shortcut:
        everything it produces is meant to be reviewed, corrected, and actually learned.
      </p>

      <Section heading="How it works">
        <Bullets
          items={[
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">Upload.</strong> Add
              a PDF and Notestify extracts the text so it can be worked with.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">Generate.</strong>{' '}
              Turn that text — or any note you have written — into a deck of flashcards or a quiz.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">Review.</strong>{' '}
              Cards are scheduled with SM-2 spaced repetition. Grade each card honestly and the
              algorithm decides when you next see it: the ones you find hard come back sooner.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">Ask.</strong> The AI
              tutor is there for the parts that have not clicked yet, and keeps a history of your
              past sessions.
            </>,
          ]}
        />
      </Section>

      <Section heading="On the AI">
        <p>
          The generation and tutor features run on Google&apos;s Gemini models. That means two
          honest caveats worth stating plainly rather than burying:
        </p>
        <Bullets
          items={[
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">
                It can be confidently wrong.
              </strong>{' '}
              Generated cards, quiz answers, and tutor explanations should be checked against your
              actual course material before you commit them to memory.
            </>,
            <>
              <strong className="font-bold text-espresso-700 dark:text-foam-50">
                Your content is sent to Google to be processed.
              </strong>{' '}
              Text extracted from your uploads and the messages you send the tutor leave our servers.
              The{' '}
              <Link
                href="/privacy"
                className="font-semibold text-citrus-600 underline decoration-2 underline-offset-2 dark:text-citrus-500"
              >
                Privacy Policy
              </Link>{' '}
              covers exactly what goes where.
            </>,
          ]}
        />
      </Section>

      <Section heading="What it is built on">
        <p>
          Next.js and React on the front end, Supabase for accounts, database and file storage, and
          Google Gemini for the AI features. Hosted on Vercel. Spaced repetition uses the SM-2
          algorithm, the same scheduling approach behind most established flashcard software.
        </p>
      </Section>

      <Section heading="Who made it">
        <p>
          Notestify is an independent project, not a company with a support desk. It is built and
          maintained by a small team — realistically, one person and a lot of evenings. If something
          is broken or a generated card is wrong in an interesting way, that feedback is genuinely
          useful.
        </p>
        <p className="text-bark-500 dark:text-bark-300">
          Contact:{' '}
          <a
            href="mailto:realserted@gmail.com"
            className="font-semibold text-citrus-600 underline decoration-2 underline-offset-2 dark:text-citrus-500"
          >
            realserted@gmail.com
          </a>
        </p>
      </Section>
    </LegalPage>
  );
}
