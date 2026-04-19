'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { NotebookCover } from '@/types/database';
import { cn } from '@/utils/cn';

const COVERS: { value: NotebookCover; label: string; swatch: string }[] = [
  { value: 'coral', label: 'Coral', swatch: 'bg-coral-500' },
  { value: 'cream', label: 'Cream', swatch: 'bg-cream-200' },
  { value: 'ink', label: 'Ink', swatch: 'bg-ink-700' },
  { value: 'sage', label: 'Sage', swatch: 'bg-emerald-400' },
  { value: 'sky', label: 'Sky', swatch: 'bg-sky-400' },
  { value: 'plum', label: 'Plum', swatch: 'bg-purple-400' },
  { value: 'butter', label: 'Butter', swatch: 'bg-amber-300' },
];

export const CreateNotebookButton = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [cover, setCover] = useState<NotebookCover>('coral');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/notebooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, cover_color: cover }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setTitle('');
      setCover('coral');
      router.refresh();
    }
  };

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ New Notebook</Button>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70">
      <form
        onSubmit={handleCreate}
        className="w-full max-w-md space-y-4 rounded-2xl border border-cream-200 bg-white p-6 text-ink-900 shadow-xl dark:border-ink-700 dark:bg-ink-900 dark:text-cream-100"
      >
        <h2 className="font-serif text-xl text-ink-900 dark:text-cream-50">New notebook</h2>
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-cream-50/80">
            Cover color
          </label>
          <div className="flex flex-wrap gap-2">
            {COVERS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCover(c.value)}
                aria-label={c.label}
                className={cn(
                  'h-10 w-10 rounded-full border-2 transition-transform',
                  c.swatch,
                  cover === c.value
                    ? 'scale-110 border-ink-900 dark:border-cream-50'
                    : 'border-transparent'
                )}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create
          </Button>
        </div>
      </form>
    </div>
  );
};
