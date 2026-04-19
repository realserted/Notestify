'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export const CreateDeckButton = () => {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    await supabase.from('decks').insert({ user_id: user.id, title, description });
    setLoading(false);
    setOpen(false);
    setTitle('');
    setDescription('');
    router.refresh();
  };

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ New Deck</Button>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70">
      <form
        onSubmit={handleCreate}
        className="w-full max-w-md space-y-4 rounded-lg border border-cream-200 bg-white p-6 text-ink-900 shadow-xl dark:border-ink-700 dark:bg-ink-900 dark:text-cream-100"
      >
        <h2 className="text-xl font-bold text-ink-900 dark:text-cream-100">Create Deck</h2>
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
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
