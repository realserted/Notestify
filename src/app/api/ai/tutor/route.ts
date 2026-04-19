import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { chatWithTutor } from '@/lib/ai/service';

const schema = z.object({
  conversation_id: z.string().uuid().nullish(),
  message: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    let conversationId = parsed.data.conversation_id;

    if (!conversationId) {
      const { data: conv, error } = await supabase
        .from('tutor_conversations')
        .insert({ user_id: user.id, title: parsed.data.message.slice(0, 50) })
        .select()
        .single();
      if (error) throw error;
      conversationId = conv.id;
    }

    await supabase.from('tutor_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: parsed.data.message,
    });

    const { data: history } = await supabase
      .from('tutor_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    const reply = await chatWithTutor(
      (history ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>
    );

    await supabase.from('tutor_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'assistant',
      content: reply,
    });

    return NextResponse.json({ conversation_id: conversationId, reply });
  } catch (error) {
    console.error('[ai/tutor]', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
