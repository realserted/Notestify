'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type {
  DocumentAnnotation,
  HighlightData,
  NoteAnnotationData,
  StrokeAnnotationData,
} from '@/types/database';

interface AnnotationSidebarProps {
  annotations: DocumentAnnotation[];
  onDelete: (id: string) => void;
  onJump: (page: number) => void;
  onUpdateNote: (id: string, note: string) => void;
}

export const AnnotationSidebar = ({
  annotations,
  onDelete,
  onJump,
  onUpdateNote,
}: AnnotationSidebarProps) => {
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
                <AnnotationRow
                  key={a.id}
                  annotation={a}
                  onDelete={() => onDelete(a.id)}
                  onUpdateNote={(note) => onUpdateNote(a.id, note)}
                />
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
  onUpdateNote,
}: {
  annotation: DocumentAnnotation;
  onDelete: () => void;
  onUpdateNote: (note: string) => void;
}) => {
  if (annotation.kind === 'highlight') {
    const h = annotation.data as HighlightData;
    return (
      <AnnotationCard onDelete={onDelete}>
        <div className="flex items-start gap-2">
          <span
            className="mt-0.5 h-4 w-4 shrink-0 rounded"
            style={{ backgroundColor: h.color }}
            aria-hidden
          />
          <p className="flex-1 text-sm italic text-ink-700 dark:text-cream-50/90">
            “{(h.text ?? '').slice(0, 200)}”
          </p>
        </div>
        <NoteField value={h.note ?? ''} onSave={onUpdateNote} />
      </AnnotationCard>
    );
  }
  if (annotation.kind === 'note') {
    const n = annotation.data as NoteAnnotationData;
    return (
      <AnnotationCard onDelete={onDelete}>
        <div className="flex items-start gap-2">
          <span
            className="mt-0.5 h-4 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: n.color }}
            aria-hidden
          />
          <p className="flex-1 text-sm text-ink-700 dark:text-cream-50/90">{n.text}</p>
        </div>
      </AnnotationCard>
    );
  }
  const s = annotation.data as StrokeAnnotationData;
  return (
    <AnnotationCard onDelete={onDelete}>
      <div className="flex items-center gap-2">
        <span
          className="h-4 w-4 shrink-0 rounded"
          style={{ backgroundColor: s.color, opacity: s.tool === 'highlighter' ? 0.5 : 1 }}
          aria-hidden
        />
        <span className="flex-1 text-sm text-ink-500 dark:text-cream-50/60">
          {s.tool === 'highlighter' ? 'Highlighter stroke' : 'Ink stroke'}
        </span>
      </div>
      <NoteField value={s.note ?? ''} onSave={onUpdateNote} />
    </AnnotationCard>
  );
};

const AnnotationCard = ({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) => (
  <div className="group space-y-2 rounded-lg border border-cream-200 bg-cream-50 p-2 dark:border-ink-700 dark:bg-ink-900">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1">{children}</div>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete annotation"
        className="opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);

const NoteField = ({ value, onSave }: { value: string; onSave: (v: string) => void }) => {
  const [draft, setDraft] = useState(value);
  const [expanded, setExpanded] = useState(Boolean(value));

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-coral-500 dark:text-cream-50/60"
      >
        <Plus size={12} />
        Add description
      </button>
    );
  }

  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onSave(draft);
        if (!draft) setExpanded(false);
      }}
      placeholder="Describe or pin a note to this…"
      rows={2}
      className="w-full resize-none rounded-md border border-cream-200 bg-white px-2 py-1 text-sm text-ink-900 outline-none focus:border-coral-500 dark:border-ink-700 dark:bg-ink-900 dark:text-cream-50"
    />
  );
};
