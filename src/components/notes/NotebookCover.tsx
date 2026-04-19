import type { NotebookCover as Cover } from '@/types/database';
import { cn } from '@/utils/cn';

const COVER_STYLES: Record<Cover, string> = {
  coral: 'bg-gradient-to-br from-coral-500 to-coral-600 text-white',
  cream: 'bg-gradient-to-br from-cream-100 to-cream-200 text-ink-900',
  ink: 'bg-gradient-to-br from-ink-700 to-ink-900 text-cream-50',
  sage: 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white',
  sky: 'bg-gradient-to-br from-sky-400 to-sky-600 text-white',
  plum: 'bg-gradient-to-br from-purple-400 to-purple-600 text-white',
  butter: 'bg-gradient-to-br from-amber-200 to-amber-400 text-ink-900',
};

interface NotebookCoverProps {
  cover: Cover;
  title: string;
  pageCount: number;
}

export const NotebookCover = ({ cover, title, pageCount }: NotebookCoverProps) => (
  <div
    className={cn(
      'group relative aspect-[3/4] overflow-hidden rounded-xl shadow-md transition-all group-hover:-translate-y-1 group-hover:shadow-xl',
      COVER_STYLES[cover]
    )}
  >
    <div className="absolute left-0 top-0 h-full w-2 bg-black/20" />
    <div className="absolute left-2 top-0 h-full w-px bg-white/20" />
    <div className="flex h-full flex-col justify-between p-5 pl-7">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">Notebook</p>
        <h3 className="font-serif text-xl leading-tight tracking-tight">{title}</h3>
      </div>
      <p className="text-xs opacity-70">
        {pageCount} {pageCount === 1 ? 'page' : 'pages'}
      </p>
    </div>
  </div>
);
