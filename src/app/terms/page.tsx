import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalPage, Section, Bullets, Notice } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service — Notestify',
  description: 'The terms you agree to by using Notestify.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="29 August 2026">
      <p>
        By creating an account or using Notestify, you agree to these terms. If you do not agree,
        please do not use the service.
      </p>

      <Section heading="Who can use Notestify">
        <p>
          You must be at least 13 years old, or older if the country you live in sets a higher
          minimum age for agreeing to an online service on your own. If you are under that age
          where you live, you may only use Notestify with a parent or guardian&apos;s consent. You
          are responsible for what happens under your account, including keeping your sign-in
          secure. One person, one account.
        </p>
      </Section>

      <Section heading="Your content stays yours">
        <p>
          You keep ownership of everything you upload and create. You grant us only the permission
          needed to actually run the service: to store your content, display it back to you, and
          send it to our AI provider when you use a feature that requires it. We do not train
          models on your content ourselves, and we do not share it with anyone beyond the providers
          listed in the{' '}
          <Link
            href="/privacy"
            className="font-semibold text-citrus-600 underline decoration-2 underline-offset-2 dark:text-citrus-500"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <p>
          Our AI provider is a separate matter. Notestify currently runs on Google&apos;s free
          Gemini API tier, and on that tier Google may use content sent to it to improve their
          products, including review by people. We cannot promise otherwise on your behalf. If that
          is not acceptable for a particular document, do not run AI features on it.
        </p>
      </Section>

      <Section heading="What you upload">
        <p>
          You are responsible for having the right to upload what you upload. Course material,
          textbooks, and lecture slides are frequently protected by copyright, and permission to
          read something is not always permission to copy it into a third-party service. Do not
          upload:
        </p>
        <Bullets
          items={[
            'Material you do not have the right to use in this way.',
            "Other people's personal or confidential information.",
            'Anything unlawful, or content designed to harass or harm.',
            'Exam material you have been told not to share or reproduce.',
          ]}
        />
      </Section>

      <Section heading="Academic integrity">
        <Notice>
          <p>
            Notestify is a study aid. Using it to complete graded work, take-home exams, or
            assessments where outside help is not permitted is between you and your institution, and
            it is your responsibility to know your school&apos;s rules. We will not defend a
            misconduct case on your behalf.
          </p>
        </Notice>
      </Section>

      <Section heading="AI-generated content">
        <p>
          Flashcards, quizzes, summaries, and tutor replies are produced by a language model. They
          can be inaccurate, incomplete, or stated with more confidence than they deserve. Check
          anything that matters against your actual source material.
        </p>
        <p>
          The tutor is not a professional adviser. Nothing it says is medical, legal, financial, or
          psychological advice, whatever the subject you are studying.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <p>Please do not:</p>
        <Bullets
          items={[
            'Attempt to bypass usage limits, or automate requests to the AI features at scale.',
            'Probe, scan, or attempt to gain access to accounts or data that are not yours.',
            'Resell the service, or use it as a backend for another product.',
            'Deliberately generate harmful, abusive, or illegal content.',
          ]}
        />
        <p>
          Usage limits apply per account so that one user cannot exhaust capacity for everyone else.
          These limits may change without notice.
        </p>
      </Section>

      <Section heading="Availability">
        <p>
          Notestify is provided as-is, without warranty of any kind. It is an independent project:
          there is no uptime guarantee, no support commitment, and features may change or be removed.
          Keep your own copy of anything you cannot afford to lose.
        </p>
      </Section>

      <Section heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, we are not liable for indirect or consequential
          losses, lost data, or academic outcomes arising from your use of the service. Where
          liability cannot be excluded, it is limited to PHP 5,000 or the total amount you have
          paid us in the twelve months before the claim, whichever is greater.
        </p>
        <p className="text-bark-500 dark:text-bark-300">
          Some jurisdictions do not allow these exclusions, in which case they may not apply to you.
        </p>
      </Section>

      <Section heading="Ending your account">
        <p>
          You may stop using Notestify and request deletion at any time. We may suspend or close an
          account that breaks these terms, or that puts the service or other users at risk. If we do
          so without cause, you may request an export of your content first.
        </p>
      </Section>

      <Section heading="Changes to these terms">
        <p>
          We may update these terms. Material changes will be dated at the top and announced in the
          app before they take effect. Continuing to use Notestify afterwards means you accept them.
        </p>
      </Section>

      <Section heading="Governing law">
        <p>
          These terms are governed by the laws of the Republic of the Philippines, and disputes
          will be handled by the competent courts of the Philippines.
        </p>
        <p className="text-bark-500 dark:text-bark-300">
          Nothing here removes a right you have under the consumer protection law of the country
          you live in. Where that law lets you bring a claim locally, it takes precedence over this
          section.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about these terms: <a href="mailto:realserted@gmail.com" className="font-semibold text-citrus-600 underline decoration-2 underline-offset-2 dark:text-citrus-500">realserted@gmail.com</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
