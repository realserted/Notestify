import { NotestifyMark } from '@/components/brand/NotestifyLogo';

/** Split-screen frame shared by /login and /register. */
export const AuthSplit = ({ children }: { children: React.ReactNode }) => (
  <div className="grid min-h-screen lg:grid-cols-[0.46fr_0.54fr]">
    <div className="hidden flex-col justify-between border-r-2 border-espresso-700 bg-espresso-500 p-10 dark:border-night-600 dark:bg-night-800 lg:flex">
      {/* Always the light-on-dark tone: this panel is espresso in both themes. */}
      <div className="flex items-center gap-2.5">
        <NotestifyMark size={30} tone="light" />
        <span className="font-display text-[22px] font-bold tracking-[-0.02em] text-paper-50">
          Notestify
        </span>
      </div>
      <p className="max-w-[380px] font-display text-[34px] font-extrabold leading-[1.15] tracking-[-0.03em] text-paper-50">
        Review what matters,{' '}
        <span className="rounded bg-citrus-500 px-2 text-espresso-700 [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
          when it matters.
        </span>
      </p>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-paper-200/70">
        SM-2 spaced repetition
      </p>
    </div>

    <div className="flex items-center justify-center bg-paper-100 p-6 dark:bg-night-900 sm:p-10">
      <div className="w-full max-w-[376px]">{children}</div>
    </div>
  </div>
);
