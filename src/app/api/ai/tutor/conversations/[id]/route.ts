import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

/** Full message history for one conversation. */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: conversation, error: convError } = await supabase
    .from('tutor_conversations')
    .select('id, title')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: messages, error } = await supabase
    .from('tutor_messages')
    .select('role, content')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[ai/tutor/conversations/:id]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation, messages: messages ?? [] });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Messages go with it via `on delete cascade`.
  const { error } = await supabase
    .from('tutor_conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[ai/tutor/conversations/:id] delete', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
