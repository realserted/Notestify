import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NotestifyLogo } from '@/components/brand/NotestifyLogo';

// Copy is unchanged from the previous landing page; only the strip colour is new.
const features = [
  {
    strip: 'bg-citrus-500',
    title: 'Flashcards that stick',
    body: 'Spaced repetition with the SM-2 algorithm. Generate decks from your notes and review what matters, when it matters.',
  },
  {
    strip: 'bg-citrus-300',
    title: 'Upload anything',
    body: 'Drop a PDF, DOCX, or PPTX. We extract the text and turn your lecture slides into study material in seconds.',
  },
  {
    strip: 'bg-caramel-500',
    title: 'An AI tutor, on call',
    body: 'Chat with a patient tutor who knows your material and meets you where you are. No judgement, just understanding.',
  },
  {
    strip: 'bg-clay-500',
    title: 'Quizzes on demand',
    body: 'Auto-generated multiple choice, true/false, and short answer. Instant grading and insight into what to revisit.',
  },
];

// The four grade pills on the decorative hero flashcard.
const grades = [
  { label: 'Again', className: 'bg-clay-500 text-espresso-700' },
  { label: 'Hard', className: 'bg-citrus-300 text-espresso-700' },
  { label: 'Good', className: 'bg-citrus-500 text-espresso-700' },
  { label: 'Easy', className: 'bg-espresso-500 text-paper-50' },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-paper-100 text-espresso-700 dark:bg-night-900 dark:text-foam-50">
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-11">
        <Link href="/" aria-label="Notestify home">
          <NotestifyLogo size={34} />
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-sm font-semibold text-bark-700 hover:text-espresso-700 dark:text-foam-50/80 dark:hover:text-foam-50"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full border-2 border-espresso-700 bg-espresso-500 px-5 py-2.5 text-sm font-bold text-paper-50 shadow-pop-sm transition-all duration-100 hover:bg-espresso-700 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none dark:border-espresso-900 dark:bg-citrus-500 dark:text-espresso-900 dark:shadow-pop-dark"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 pb-16 pt-6 sm:px-11 lg:grid-cols-[1.06fr_0.94fr] lg:pb-16">
          <div>
            <span className="inline-block rounded-full border-2 border-espresso-700 bg-paper-50 px-3.5 py-1.5 text-[12.5px] font-bold dark:border-night-600 dark:bg-night-800">
              AI-powered study companion
            </span>
            <h1 className="mt-[22px] font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[52px] lg:text-[64px]">
              Study smarter,
              <br />
              <span className="rounded bg-citrus-500 px-2 text-espresso-700 [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
                one note at a time.
              </span>
            </h1>
            <p className="mt-6 max-w-[460px] text-[17.5px] leading-[1.6] text-bark-700 dark:text-foam-50/75">
              Turn your PDFs, slides, and notes into flashcards, quizzes, and a personal AI tutor —
              all in one warm, focused workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-[18px]">
              <Link
                href="/register"
                className="rounded-full border-2 border-espresso-700 bg-espresso-500 px-[26px] py-3.5 text-[15px] font-bold text-paper-50 shadow-pop transition-all duration-100 hover:bg-espresso-700 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none dark:border-espresso-900 dark:bg-citrus-500 dark:text-espresso-900 dark:shadow-pop-dark"
              >
                Start studying free
              </Link>
              <Link
                href="/login"
                className="text-[14.5px] font-semibold underline decoration-citrus-500 decoration-2 underline-offset-4 dark:text-foam-50"
              >
                I already have an account →
              </Link>
            </div>
          </div>

          {/* Decorative sticker cluster. Hard-coded per the design reference. */}
          <div className="relative hidden h-[360px] lg:block" aria-hidden>
            <div className="absolute left-11 top-[34px] w-[400px] -rotate-[2.5deg] overflow-hidden rounded-[22px] border-2 border-espresso-700 bg-paper-50 shadow-pop-lg dark:border-espresso-900 dark:bg-night-800">
              <div className="h-2.5 border-b-2 border-espresso-700 bg-espresso-500 dark:border-espresso-900 dark:bg-citrus-500" />
              <div className="px-6 pb-7 pt-6">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-bark-500 dark:text-bark-300">
                  Question · card 3 of 10
                </p>
                <p className="mt-3 font-display text-[23px] font-semibold leading-[1.3] tracking-[-0.02em]">
                  What does the SM-2 ease factor actually change?
                </p>
                <div className="mt-[22px] flex gap-2">
                  {grades.map(({ label, className }) => (
                    <span
                      key={label}
                      className={`flex-1 rounded-full border-2 border-espresso-700 py-2 text-center text-xs font-bold dark:border-espresso-900 ${className}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -top-1 right-1.5 rotate-[4deg] rounded-2xl border-2 border-espresso-700 bg-citrus-500 px-4 py-3 shadow-pop dark:border-espresso-900 dark:shadow-pop-dark">
              <p className="font-display text-[26px] font-extrabold leading-none text-espresso-700">12</p>
              <p className="mt-0.5 text-[11.5px] font-bold text-espresso-700">day streak</p>
            </div>

            <div className="absolute bottom-1.5 right-[34px] flex -rotate-[3deg] items-center gap-[11px] rounded-2xl border-2 border-espresso-700 bg-paper-50 px-[18px] py-3 shadow-pop dark:border-espresso-900 dark:bg-night-800 dark:shadow-pop-dark">
              <span className="h-[34px] w-[34px] rounded-full border-2 border-espresso-700 bg-espresso-500 dark:border-espresso-900 dark:bg-citrus-500" />
              <div>
                <p className="font-display text-xl font-extrabold leading-none">84%</p>
                <p className="mt-0.5 text-[11.5px] font-semibold text-bark-500 dark:text-bark-300">
                  last quiz
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t-2 border-espresso-700 bg-paper-50 dark:border-night-600 dark:bg-night-800">
          <div className="mx-auto max-w-[1280px] px-6 py-13 sm:px-11">
            <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ strip, title, body }) => (
                <div
                  key={title}
                  className="overflow-hidden rounded-[18px] border-2 border-espresso-700 bg-paper-50 shadow-pop dark:border-night-600 dark:bg-night-700 dark:shadow-pop-dark"
                >
                  <div className={`h-[38px] border-b-2 border-espresso-700 dark:border-night-600 ${strip}`} />
                  <div className="px-5 pb-[22px] pt-[18px]">
                    <h3 className="font-display text-[19px] font-bold tracking-[-0.02em]">{title}</h3>
                    <p className="mt-2 text-[13.5px] leading-[1.6] text-bark-700 dark:text-foam-50/70">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto max-w-[1280px] px-6 pb-14 sm:px-11">
            <div className="rounded-[26px] border-2 border-espresso-700 bg-espresso-500 px-8 py-14 text-center shadow-pop-lg dark:border-espresso-900 dark:bg-night-700 sm:px-11">
              <h2 className="font-display text-[28px] font-extrabold leading-[1.12] tracking-[-0.035em] text-paper-50 sm:text-[34px] lg:text-[40px]">
                Ready to make your notes{' '}
                <span className="rounded bg-citrus-500 px-2 text-espresso-700 [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
                  work for you?
                </span>
              </h2>
              <Link
                href="/register"
                className="mt-[26px] inline-block rounded-full border-2 border-espresso-700 bg-paper-50 px-7 py-3.5 text-[15px] font-bold text-espresso-700 shadow-pop transition-all duration-100 hover:bg-paper-200 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none dark:border-espresso-900"
              >
                Get started — it&apos;s free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-espresso-700 bg-paper-50 dark:border-night-600 dark:bg-night-800">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-6 py-5 text-[13px] font-semibold text-bark-500 dark:text-bark-300 sm:flex-row sm:px-11">
          <p>&copy; {new Date().getFullYear()} Notestify</p>
          <p className="text-espresso-700 dark:text-foam-50">Study smarter.</p>
        </div>
      </footer>
    </div>
  );
}
