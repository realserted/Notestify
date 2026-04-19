'use client';

import { Trash2 } from 'lucide-react';
import type {
  DocumentAnnotation,
  HighlightData,
  NoteAnnotationData,
} from '@/types/database';

interface AnnotationSidebarProps {
  annotations: DocumentAnnotation[];
  onDelete: (id: string) => void;
  onJump: (page: number) => void;
}

export const AnnotationSidebar = ({ annotations, onDelete, onJump }: AnnotationSidebarProps) => {
  const grouped = annotations.reduce<Record<number, DocumentAnnotation[]>>((acc, a) => {
    acc[a.page] = acc[a.page] ?? [];
    acc[a.page].push(a);
    return acc;
  }, {});
  const pages = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  return (
    <aside className="hidden h-full w-80 shrink-0 overflow-y-auto border-l border-cream-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900/80 lg:block">
      <h2 className="mb-3 font-serif text-lg tracking-tight text-ink-900 dark:text-cream-50">
        Annotations
      </h2>
      {annotations.length === 0 ? (
        <p className="text-sm text-ink-500 dark:text-cream-50/60">
          No annotations yet. Highlight text, scribble, or drop a sticky note.
        </p>
      ) : (
        <div className="space-y-4">
          {pages.map((page) => (
            <div key={page} className="space-y-2">
              <button
                type="button"
                onClick={() => onJump(page)}
                className="text-xs uppercase tracking-wide text-ink-500 hover:text-coral-500 dark:text-cream-50/60"
              >
                Page {page}
              </button>
              {grouped[page].map((a) => (
                <AnnotationRow key={a.id} annotation={a} onDelete={() => onDelete(a.id)} />
              ))}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

const AnnotationRow = ({
  annotation,
  onDelete,
}: {
  annotation: DocumentAnnotation;
  onDelete: () => void;
}) => {
  if (annotation.kind === 'highlight') {
    const h = annotation.data as HighlightData;
    return (
      <div className="group flex items-start gap-2 rounded-lg border border-cream-200 bg-cream-50 p-2 dark:border-ink-700 dark:bg-ink-900">
        <span
          className="mt-0.5 h-4 w-4 shrink-0 rounded"
          style={{ backgroundColor: h.color }}
          aria-hidden
        />
        <p className="flex-1 text-sm italic text-ink-700 dark:text-cream-50/90">
          “{(h.text ?? '').slice(0, 200)}”
        </p>
        <DeleteButton onDelete={onDelete} />
      </div>
    );
  }
  if (annotation.kind === 'note') {
    const n = annotation.data as NoteAnnotationData;
    return (
      <div className="group flex items-start gap-2 rounded-lg border border-cream-200 bg-cream-50 p-2 dark:border-ink-700 dark:bg-ink-900">
        <span
          className="mt-0.5 h-4 w-4 shrink-0 rounded-full"
          style={{ backgroundColor: n.color }}
          aria-hidden
        />
        <p className="flex-1 text-sm text-ink-700 dark:text-cream-50/90">{n.text}</p>
        <DeleteButton onDelete={onDelete} />
      </div>
    );
  }
  return (
    <div className="group flex items-center gap-2 rounded-lg border border-cream-200 bg-cream-50 p-2 dark:border-ink-700 dark:bg-ink-900">
      <span className="flex-1 text-sm text-ink-500 dark:text-cream-50/60">Ink stroke</span>
      <DeleteButton onDelete={onDelete} />
    </div>
  );
};

const DeleteButton = ({ onDelete }: { onDelete: () => void }) => (
  <button
    type="button"
    onClick={onDelete}
    aria-label="Delete annotation"
    className="opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
  >
    <Trash2 size={14} />
  </button>
);
