'use client';

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface StickyNoteProps {
  x: number;
  y: number;
  color: string;
  text: string;
  onChange: (text: string) => void;
  onDelete: () => void;
}

export const StickyNote = ({ x, y, color, text, onChange, onDelete }: StickyNoteProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(text);

  return (
    <div className="absolute" style={{ left: x, top: y }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-md"
        style={{ backgroundColor: color }}
        aria-label="Note"
      >
        <MessageSquare size={12} />
      </button>
      {open && (
        <div className="absolute left-3 top-3 z-30 w-56 rounded-lg border border-cream-200 bg-white p-2 text-sm shadow-lg dark:border-ink-700 dark:bg-ink-900">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-ink-500">Note</span>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete note"
              className="text-ink-500 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft !== text) onChange(draft);
            }}
            rows={3}
            className="w-full resize-none rounded-md border border-cream-200 bg-cream-50 px-2 py-1 text-sm text-ink-900 outline-none focus:border-coral-500 dark:border-ink-700 dark:bg-ink-900 dark:text-cream-50"
          />
        </div>
      )}
    </div>
  );
};
