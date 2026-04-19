import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, Brain, FileText, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

const features = [
  {
    Icon: BookOpen,
    title: 'Flashcards that stick',
    body: 'Spaced repetition with the SM-2 algorithm. Generate decks from your notes and review what matters, when it matters.',
  },
  {
    Icon: FileText,
    title: 'Upload anything',
    body: 'Drop a PDF, DOCX, or PPTX. We extract the text and turn your lecture slides into study material in seconds.',
  },
  {
    Icon: Brain,
    title: 'An AI tutor, on call',
    body: 'Chat with a patient tutor who knows your material and meets you where you are. No judgement, just understanding.',
  },
  {
    Icon: Sparkles,
    title: 'Quizzes on demand',
    body: 'Auto-generated multiple choice, true/false, and short answer. Instant grading and insight into what to revisit.',
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-cream-50 text-ink-900 dark:bg-ink-900 dark:text-cream-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-serif text-xl tracking-tight">
          Notestify
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-cream-100 dark:text-cream-50 dark:hover:bg-ink-700/40"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-cream-50 transition-colors hover:bg-ink-700 dark:bg-cream-50 dark:text-ink-900 dark:hover:bg-cream-100"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 pb-24 pt-16 text-center md:pt-24">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white/60 px-4 py-1.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-700/30 dark:text-cream-50">
            <Sparkles className="h-3.5 w-3.5 text-coral-500" />
            AI-powered study companion
          </div>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Study smarter,
            <br />
            <span className="italic text-coral-500">one note at a time.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-500 dark:text-cream-50/70">
            Turn your PDFs, slides, and notes into flashcards, quizzes, and a personal AI tutor —
            all in one warm, focused workspace.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-coral-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-coral-600"
            >
              Start studying free
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-medium text-ink-900 transition-colors hover:bg-cream-100 dark:text-cream-50 dark:hover:bg-ink-700/40"
            >
              I already have an account →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-cream-200 bg-white p-6 transition-colors hover:border-cream-200/0 hover:bg-cream-100/50 dark:border-ink-700 dark:bg-ink-900/50 dark:hover:bg-ink-700/30"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cream-100 text-coral-500 dark:bg-ink-700/50">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-cream-50/70">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-32">
          <div className="rounded-3xl bg-ink-900 px-8 py-14 text-center text-cream-50 dark:bg-cream-100 dark:text-ink-900 md:px-16">
            <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
              Ready to make your notes{' '}
              <span className="italic text-coral-500">work for you?</span>
            </h2>
            <Link
              href="/register"
              className="mt-8 inline-flex h-11 items-center rounded-xl bg-coral-500 px-6 text-sm font-medium text-white transition-colors hover:bg-coral-600"
            >
              Get started — it&apos;s free
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl border-t border-cream-200 px-6 py-8 text-sm text-ink-500 dark:border-ink-700 dark:text-cream-50/60">
        <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Notestify</p>
          <p className="font-serif italic">Study smarter.</p>
        </div>
      </footer>
    </div>
  );
}
