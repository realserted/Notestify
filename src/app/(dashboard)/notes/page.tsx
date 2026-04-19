import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { notebookService } from '@/services/notes.service';
import { CreateNotebookButton } from '@/components/notes/CreateNotebookButton';
import { NotebookCover } from '@/components/notes/NotebookCover';
import type { NotebookCover as Cover } from '@/types/database';

interface NotebookRow {
  id: string;
  title: string;
  cover_color: Cover;
  notes: { count: number }[];
}

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const notebooks = (await notebookService.list(supabase, user.id)) as NotebookRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Notes</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-cream-50/70">
            Write, sketch, and turn any page into flashcards or a quiz.
          </p>
        </div>
        <CreateNotebookButton />
      </div>

      {notebooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-200 p-10 text-center dark:border-ink-700">
          <p className="font-serif text-xl text-ink-900 dark:text-cream-50">
            Your shelf is empty.
          </p>
          <p className="mt-2 text-sm text-ink-500 dark:text-cream-50/60">
            Create your first notebook to start capturing ideas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {notebooks.map((n) => (
            <Link key={n.id} href={`/notes/${n.id}`} className="group block">
              <NotebookCover
                cover={n.cover_color}
                title={n.title}
                pageCount={n.notes[0]?.count ?? 0}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
