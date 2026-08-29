import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** What the student can attach to a tutor session. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [decks, documents, notes] = await Promise.all([
    supabase
      .from('decks')
      .select('id, title')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50),
    // Only documents with text worth grounding an answer in.
    supabase
      .from('documents')
      .select('id, title')
      .eq('user_id', user.id)
      .not('extracted_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('notes')
      .select('id, title')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    decks: decks.data ?? [],
    documents: documents.data ?? [],
    notes: notes.data ?? [],
  });
}
