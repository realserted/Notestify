import Link from 'next/link';
import { NotestifyLogo } from '@/components/brand/NotestifyLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

/** Shared frame for the public /about, /privacy and /terms pages. */
export const LegalPage = ({
  title,
  updated,
  children,
}: {
  title: string;
  /** Omitted on pages where an effective date makes no sense (e.g. About). */
  updated?: string;
  children: React.ReactNode;
}) => (
  <div className="min-h-screen bg-paper-100 text-espresso-700 dark:bg-night-900 dark:text-foam-50">
    <header className="border-b-2 border-espresso-700 bg-paper-50 dark:border-night-600 dark:bg-night-800">
      <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Notestify home">
          <NotestifyLogo size={30} />
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle iconOnly />
          <Link
            href="/"
            className="text-sm font-semibold text-bark-700 hover:text-espresso-700 dark:text-foam-50/80 dark:hover:text-foam-50"
          >
            ← Back
          </Link>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-[900px] px-6 py-12 sm:py-16">
      <h1 className="font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[52px]">
        {title}
      </h1>
      {updated && (
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-bark-500 dark:text-bark-300">
          Last updated {updated}
        </p>
      )}

      <div className="mt-10 space-y-8 text-[15.5px] leading-[1.7] text-bark-700 dark:text-foam-50/80">
        {children}
      </div>
    </main>

    <LegalFooter />
  </div>
);

export const Section = ({ heading, children }: { heading: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-espresso-700 dark:text-foam-50">
      {heading}
    </h2>
    {children}
  </section>
);

export const Bullets = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="space-y-2">
    {items.map((item, i) => (
      <li key={i} className="flex gap-3">
        <span className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-citrus-500" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

/** Callout for the things a reader genuinely needs to notice. */
export const Notice = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-pop border-2 border-espresso-700 bg-citrus-500/15 p-5 dark:border-night-600 dark:bg-citrus-500/10">
    {children}
  </div>
);

export const LegalFooter = () => (
  <footer className="border-t-2 border-espresso-700 bg-paper-50 dark:border-night-600 dark:bg-night-800">
    <div className="mx-auto flex max-w-[900px] flex-col items-center justify-between gap-3 px-6 py-6 text-[13px] font-semibold text-bark-500 dark:text-bark-300 sm:flex-row">
      <p>&copy; {new Date().getFullYear()} Notestify</p>
      <nav className="flex gap-5">
        <Link href="/about" className="hover:text-espresso-700 dark:hover:text-foam-50">
          About
        </Link>
        <Link href="/privacy" className="hover:text-espresso-700 dark:hover:text-foam-50">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-espresso-700 dark:hover:text-foam-50">
          Terms
        </Link>
      </nav>
    </div>
  </footer>
);
