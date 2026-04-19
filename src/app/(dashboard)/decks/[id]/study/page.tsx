import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { flashcardService } from '@/services/flashcard.service';
import { StudySession } from '@/components/flashcards/StudySession';

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const due = await flashcardService.getDue(supabase, user.id, id);

  return <StudySession initialCards={due} deckId={id} />;
}
