import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Everything belonging to the signed-in user, as one JSON file.
 *
 * Read through the user's own client, so RLS is what scopes the export — a
 * bug here cannot leak another account's rows.
 */
const TABLES = [
  'profiles',
  'notebooks',
  'notes',
  'decks',
  'flashcards',
  'review_logs',
  'quizzes',
  'quiz_attempts',
  'documents',
  'document_annotations',
  'tutor_conversations',
  'tutor_messages',
] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const results = await Promise.all(
    TABLES.map(async (table) => {
      // profiles keys on `id`; everything else on `user_id`.
      const column = table === 'profiles' ? 'id' : 'user_id';
      const { data, error } = await supabase.from(table).select('*').eq(column, user.id);
      if (error) console.error('[account/export]', table, error);
      return [table, data ?? []] as const;
    })
  );

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    // Files themselves are not included — only the document rows that
    // reference them. Download anything you still need from the app first.
    data: Object.fromEntries(results),
  };

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="notestify-export-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
