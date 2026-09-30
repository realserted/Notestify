import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
import { SITE_URL } from '../layout';

export const metadata: Metadata = {
  title: 'FAQ — Notestify',
  description:
    'Answers about what Notestify is, what it costs, which files it accepts, how it uses Gemini, and what happens to your data.',
  alternates: { canonical: '/faq' },
};

/**
 * One source for both the page and the FAQPage markup.
 *
 * Google requires the answer in the structured data to match the answer a
 * visitor sees, and treats a mismatch as a reason to ignore the markup
 * entirely. Two hand-maintained copies drift the first time someone edits a
 * sentence, so answers are plain strings rendered into both.
 */
const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'What is Notestify?',
    a: 'Notestify is a free AI study platform. You upload a PDF, Word document or PowerPoint file, or import one from Google Drive, and it turns the text into flashcards, quizzes and summaries. Reviews are then scheduled using SM-2 spaced repetition, and an AI tutor can answer questions about your own material.',
  },
  {
    q: 'Is Notestify free?',
    a: 'Yes. Notestify is free to use and there is no paid tier. It runs on Google’s free Gemini API tier, which is why generation is rate limited per account rather than charged for.',
  },
  {
    q: 'What file types can I upload?',
    a: 'PDF, DOCX and PPTX, up to 15 MB. From Google Drive you can also import Google Docs and Google Slides, which are converted before the text is extracted. Google Sheets and image files are not supported, because a spreadsheet makes poor study material and no text can be read from an image.',
  },
  {
    q: 'How does Notestify create flashcards from a document?',
    a: 'The text is extracted from your file on the server, then sent to Google’s Gemini model with instructions to produce question and answer pairs. Nothing is generated from the file itself — only from the text it contains — so a scanned document with no text layer will not work.',
  },
  {
    q: 'What is SM-2 spaced repetition?',
    a: 'SM-2 is the scheduling algorithm behind SuperMemo and Anki. After each review you grade how well you recalled a card, and the algorithm sets the next interval from that grade and the card’s history. Cards you find difficult come back sooner, and cards you know well move further apart, so you spend your time on what you are about to forget.',
  },
  {
    q: 'Does Notestify use my content to train AI models?',
    a: 'Notestify does not train any models. However, Notestify runs on Google’s free Gemini API tier, and on that tier Google may use content sent to it to improve their products, and it may be reviewed by people. That is Google’s policy and it cannot be waived. If a document contains something you would not want a third party to process, do not run AI features on it.',
  },
  {
    q: 'Can Notestify see all of my Google Drive?',
    a: 'No. Notestify uses the drive.file scope only, which is the most limited Drive permission Google offers. You choose files in Google’s own file picker, and Google grants access to exactly those files and nothing else. Notestify cannot browse, search or list your Drive.',
  },
  {
    q: 'Does Notestify store the files I import from Drive?',
    a: 'No. The file is fetched, the text is extracted, and the original is discarded. Only the extracted text is kept.',
  },
  {
    q: 'Is my study material private?',
    a: 'Every table uses Postgres row-level security, so a signed-in account can only read or write its own rows. Nobody else using Notestify can see your documents, decks or notes. The exception is text sent to Gemini when you use an AI feature, which is described above and in the privacy policy.',
  },
  {
    q: 'Can I export or delete my data?',
    a: 'Yes, both from Settings, without contacting anyone. Export downloads your decks, notes and document records as a file. Deleting your account removes your rows and uploaded files, and is irreversible.',
  },
  {
    q: 'Does Notestify have a mobile app?',
    a: 'Not yet. Notestify is a web app and works in a mobile browser, and you can add it to your home screen. A companion mobile app is in development.',
  },
  {
    q: 'Who built Notestify?',
    a: 'Notestify was built by Lester Lawrence Sanchez, a developer based in Cebu, Philippines. It is an independent project rather than a company.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/faq#faq`,
  isPartOf: { '@id': `${SITE_URL}/#website` },
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function FaqPage() {
  return (
    <LegalPage title="Questions & answers">
      {/*
        FAQS is a hardcoded constant, so there is no untrusted input here. The
        escape is still worth the one line: a literal "</script>" inside any
        answer would otherwise close this tag early, and that stops being
        hypothetical the moment these answers come from anywhere else.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c'),
        }}
      />

      <p className="text-[17.5px] leading-[1.6]">
        What Notestify is, what it costs, and what happens to the material you put into it.
      </p>

      {FAQS.map(({ q, a }) => (
        <section key={q} className="space-y-3">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-espresso-700 dark:text-foam-50">
            {q}
          </h2>
          <p>{a}</p>
        </section>
      ))}
    </LegalPage>
  );
}
