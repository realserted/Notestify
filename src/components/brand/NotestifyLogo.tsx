// Notestify logo — mark + wordmark lockup.
//
// Retoned from the original brand package (ink #1F1E1D / paper #F4EFE7 /
// brick #A8482E) into the cold-brew palette, so the pencil carries the same
// citrus accent as the rest of the app instead of a competing brick red.
// Artwork and construction are unchanged: 128 grid, cover x40-98 / y18-110,
// pencil x26-38, spiral rings drawn over the pencil, N at 0.62 scale.

type Tone = 'light' | 'dark';

const CITRUS = '#F2A61E'; // pencil shaft — the only accent in the mark
const ESPRESSO = '#2E1A0E';
const PAPER = '#FFFBF4';

/** `tone="light"` for dark surfaces, `tone="dark"` for light ones. */
export const NotestifyMark = ({ size = 32, tone = 'light' }: { size?: number; tone?: Tone }) => {
  const cover = tone === 'dark' ? ESPRESSO : PAPER;
  const line = tone === 'dark' ? PAPER : ESPRESSO;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      role="img"
      aria-label="Notestify"
      className="shrink-0"
    >
      <rect x="40" y="18" width="58" height="92" rx="6" fill={cover} />
      <rect x="26" y="12" width="12" height="10" rx="3" fill={cover} />
      <rect x="26" y="20" width="12" height="70" fill={CITRUS} />
      <path d="M26 90 H38 L32 106 Z" fill={cover} />
      <path d="M28.6 99 H35.4 L32 106 Z" fill={line} />
      {/* Rings sit over the pencil so it reads as threaded through the wire. */}
      <g fill={line}>
        <rect x="26" y="30" width="22" height="5" rx="2.5" />
        <rect x="26" y="48" width="22" height="5" rx="2.5" />
        <rect x="26" y="66" width="22" height="5" rx="2.5" />
        <rect x="26" y="84" width="22" height="5" rx="2.5" />
      </g>
      <g transform="translate(30 24) scale(0.62)">
        <path d="M34 96 V32 H47 L81 74 V32 H83 L94 43 V96 H81 L47 54 V96 Z" fill={line} />
      </g>
    </svg>
  );
};

/** Theme-aware mark. Both variants render; CSS picks one, so this stays
 *  correct during SSR and through a theme toggle without any JS. */
export const ThemedMark = ({ size = 32 }: { size?: number }) => (
  <>
    <span className="inline-flex dark:hidden">
      <NotestifyMark size={size} tone="dark" />
    </span>
    <span className="hidden dark:inline-flex">
      <NotestifyMark size={size} tone="light" />
    </span>
  </>
);

/** Mark + wordmark. The wordmark is Bricolage Grotesque, matching every other
 *  display face in the app rather than loading Sora for one word. */
export const NotestifyLogo = ({ size = 32, className }: { size?: number; className?: string }) => (
  <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
    <ThemedMark size={size} />
    <span
      className="font-display font-bold tracking-[-0.02em] text-espresso-700 dark:text-foam-50"
      style={{ fontSize: size * 0.62 }}
    >
      Notestify
    </span>
  </span>
);
