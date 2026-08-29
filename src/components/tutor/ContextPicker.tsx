'use client';

import { useEffect, useState } from 'react';
import { Layers, FileText, NotebookPen, X } from 'lucide-react';

export type ContextType = 'deck' | 'document' | 'note';

export interface TutorContext {
  type: ContextType;
  id: string;
  label: string;
}

interface Source {
  id: string;
  title: string;
}

interface Sources {
  decks: Source[];
  documents: Source[];
  notes: Source[];
}

const GROUPS: Array<{ key: keyof Sources; type: ContextType; label: string; Icon: typeof Layers }> =
  [
    { key: 'decks', type: 'deck', label: 'Decks', Icon: Layers },
    { key: 'documents', type: 'document', label: 'Documents', Icon: FileText },
    { key: 'notes', type: 'note', label: 'Notes', Icon: NotebookPen },
  ];

/**
 * Lets the student anchor a session to one piece of their material. Only shown
 * before the first message — a conversation keeps the context it started with.
 */
export const ContextPicker = ({
  value,
  onChange,
}: {
  value: TutorContext | null;
  onChange: (context: TutorContext | null) => void;
}) => {
  const [sources, setSources] = useState<Sources | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || sources) return;
    void fetch('/api/ai/tutor/sources')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setSources(data));
  }, [open, sources]);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-full border-2 border-espresso-700 bg-citrus-500 py-1.5 pl-3.5 pr-2 text-[13px] font-bold text-espresso-700 dark:border-espresso-900">
        <span className="max-w-[220px] truncate">Studying: {value.label}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove study material"
          className="rounded-full p-0.5 hover:bg-espresso-700/15"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  const isEmpty =
    sources !== null &&
    sources.decks.length === 0 &&
    sources.documents.length === 0 &&
    sources.notes.length === 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border-2 border-espresso-700 bg-paper-50 px-3.5 py-1.5 text-[13px] font-bold text-espresso-700 transition-colors hover:bg-paper-200 dark:border-night-600 dark:bg-night-800 dark:text-foam-50 dark:hover:bg-night-700"
      >
        + Add study material
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 max-h-[340px] w-[300px] overflow-y-auto rounded-pop border-2 border-espresso-700 bg-paper-50 p-2 shadow-pop dark:border-night-600 dark:bg-night-800 dark:shadow-pop-dark">
            {sources === null ? (
              <p className="px-2 py-3 text-[13px] text-bark-500 dark:text-bark-300">Loading…</p>
            ) : isEmpty ? (
              <p className="px-2 py-3 text-[13px] text-bark-500 dark:text-bark-300">
                Nothing to attach yet. Create a deck or upload a document first.
              </p>
            ) : (
              GROUPS.map(({ key, type, label, Icon }) => {
                const items = sources[key];
                if (items.length === 0) return null;
                return (
                  <div key={key} className="mb-1 last:mb-0">
                    <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-bark-500 dark:text-bark-300">
                      {label}
                    </p>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onChange({ type, id: item.id, label: item.title });
                          setOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13.5px] font-semibold hover:bg-paper-200 dark:hover:bg-night-700"
                      >
                        <Icon size={14} className="shrink-0 text-bark-500 dark:text-bark-300" />
                        <span className="truncate">{item.title}</span>
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
