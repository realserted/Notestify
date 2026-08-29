import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { chatWithTutor, MAX_TUTOR_MESSAGE_CHARS } from '@/lib/ai/service';
import { ContentBlockedError } from '@/lib/ai/gemini';
import { tutorWithContextPrompt } from '@/lib/ai/prompts';
import { buildTutorContext, type TutorContextType } from '@/lib/ai/tutorContext';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const schema = z.object({
  conversation_id: z.string().uuid().nullish(),
  message: z.string().min(1).max(MAX_TUTOR_MESSAGE_CHARS),
  // Only honoured when opening a new conversation; an existing one keeps the
  // context it was created with.
  context_type: z.enum(['deck', 'document', 'note']).nullish(),
  context_id: z.string().uuid().nullish(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = await checkRateLimit(supabase, 'tutor');
  if (!limit.allowed) return rateLimitResponse('tutor', limit);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    let conversationId = parsed.data.conversation_id;
    let contextType: TutorContextType | null = null;
    let contextId: string | null = null;

    if (!conversationId) {
      const hasContext = Boolean(parsed.data.context_type && parsed.data.context_id);
      contextType = hasContext ? (parsed.data.context_type as TutorContextType) : null;
      contextId = hasContext ? parsed.data.context_id! : null;

      // Resolve the label up front so the history list can show it without
      // re-reading the source (which may be deleted by then).
      const resolved =
        contextType && contextId
          ? await buildTutorContext(supabase, contextType, contextId)
          : null;

      const { data: conv, error } = await supabase
        .from('tutor_conversations')
        .insert({
          user_id: user.id,
          title: parsed.data.message.slice(0, 50),
          context_type: resolved ? contextType : null,
          context_id: resolved ? contextId : null,
          context_label: resolved?.label ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      conversationId = conv.id;
      if (!resolved) {
        contextType = null;
        contextId = null;
      }
    } else {
      const { data: conv } = await supabase
        .from('tutor_conversations')
        .select('context_type, context_id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      contextType = (conv?.context_type as TutorContextType | null) ?? null;
      contextId = conv?.context_id ?? null;
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
      .order('created_at', { ascending: false })
      .limit(20);

    // Reloaded each turn so edits to the deck or note are picked up, and so a
    // deleted source degrades to an ordinary tutor rather than erroring.
    const context =
      contextType && contextId ? await buildTutorContext(supabase, contextType, contextId) : null;

    const reply = await chatWithTutor(
      ((history ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>).reverse(),
      context ? tutorWithContextPrompt(context.label, context.material) : undefined
    );

    await supabase.from('tutor_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'assistant',
      content: reply,
    });

    // Messages live in their own table, so the conversation row needs an
    // explicit touch for the history list to sort by recent activity.
    await supabase
      .from('tutor_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', user.id);

    return NextResponse.json({ conversation_id: conversationId, reply });
  } catch (error) {
    console.error('[ai/tutor]', error);

    if (error instanceof ContentBlockedError) {
      return NextResponse.json(
        { error: "I can't help with that one. Try rephrasing, or ask something else." },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: 'The tutor is unavailable right now.' }, { status: 500 });
  }
}
