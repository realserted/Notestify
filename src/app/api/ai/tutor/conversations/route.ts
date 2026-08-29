import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** List the signed-in user's tutor conversations, most recently active first. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('tutor_conversations')
    .select('id, title, updated_at, context_type, context_label')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[ai/tutor/conversations]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: data ?? [] });
}
