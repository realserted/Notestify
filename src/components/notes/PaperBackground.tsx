import type { PaperStyle } from '@/types/database';

const STYLES: Record<PaperStyle, React.CSSProperties> = {
  blank: {},
  ruled: {
    backgroundImage:
      'linear-gradient(to bottom, transparent 31px, rgba(99, 102, 241, 0.18) 32px)',
    backgroundSize: '100% 32px',
  },
  grid: {
    backgroundImage:
      'linear-gradient(to right, rgba(148, 163, 184, 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.18) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  },
  dotted: {
    backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.35) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  },
  cornell: {
    backgroundImage:
      'linear-gradient(to bottom, transparent 31px, rgba(99, 102, 241, 0.18) 32px), linear-gradient(to right, transparent 160px, rgba(217, 119, 87, 0.4) 161px, transparent 162px)',
    backgroundSize: '100% 32px, 100% 100%',
  },
};

interface PaperBackgroundProps {
  style: PaperStyle;
  className?: string;
}

export const PaperBackground = ({ style, className }: PaperBackgroundProps) => (
  <div
    aria-hidden
    className={className}
    style={{ ...STYLES[style], position: 'absolute', inset: 0 }}
  />
);
