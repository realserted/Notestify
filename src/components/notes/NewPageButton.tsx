'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface NewPageButtonProps {
  notebookId: string;
}

export const NewPageButton = ({ notebookId }: NewPageButtonProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notebook_id: notebookId }),
    });
    setLoading(false);
    if (res.ok) {
      const { note } = await res.json();
      router.push(`/notes/${notebookId}/${note.id}`);
    }
  };

  return (
    <Button onClick={handleCreate} loading={loading}>
      + New Page
    </Button>
  );
};
