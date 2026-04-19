import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { notebookService, noteService } from '@/services/notes.service';
import { NewPageButton } from '@/components/notes/NewPageButton';
import { Card } from '@/components/ui/Card';

interface Props {
  params: Promise<{ notebookId: string }>;
}

export default async function NotebookPage({ params }: Props) {
  const { notebookId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const notebook = await notebookService.get(supabase, notebookId).catch(() => null);
  if (!notebook || notebook.user_id !== user.id) notFound();

  const pages = await noteService.listByNotebook(supabase, notebookId);

  return (
    <div className="space-y-6">
      <Link
        href="/notes"
        className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 dark:text-cream-50/70 dark:hover:text-cream-50"
      >
        <ChevronLeft size={16} /> All notebooks
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl tracking-tight">{notebook.title}</h1>
        <NewPageButton notebookId={notebookId} />
      </div>

      {pages.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500 dark:text-cream-50/70">
            No pages yet. Start a new one.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <Link
              key={p.id}
              href={`/notes/${notebookId}/${p.id}`}
              className="block rounded-xl border border-cream-200 bg-white p-4 transition-colors hover:border-coral-500 dark:border-ink-700 dark:bg-ink-900/60 dark:hover:border-coral-500"
            >
              <p className="font-serif text-base text-ink-900 dark:text-cream-50">{p.title}</p>
              <p className="mt-2 text-xs text-ink-500 dark:text-cream-50/60">
                Edited {new Date(p.updated_at).toLocaleDateString()} · {p.paper_style}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
