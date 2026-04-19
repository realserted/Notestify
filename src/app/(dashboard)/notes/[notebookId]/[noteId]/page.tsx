import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { notebookService, noteService } from '@/services/notes.service';
import { NoteEditor } from '@/components/notes/NoteEditor';

interface Props {
  params: Promise<{ notebookId: string; noteId: string }>;
}

export default async function NoteEditorPage({ params }: Props) {
  const { notebookId, noteId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [notebook, note] = await Promise.all([
    notebookService.get(supabase, notebookId).catch(() => null),
    noteService.get(supabase, noteId).catch(() => null),
  ]);

  if (!notebook || !note || notebook.user_id !== user.id || note.notebook_id !== notebookId) {
    notFound();
  }

  return (
    <NoteEditor
      note={note}
      notebookId={notebookId}
      notebookTitle={notebook.title}
    />
  );
}
