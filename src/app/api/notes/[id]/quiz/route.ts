import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { noteService } from '@/services/notes.service';
import { quizService } from '@/services/quiz.service';
import { generateQuiz } from '@/lib/ai/service';
import { tiptapToPlainText } from '@/lib/notes/tiptapText';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const note = await noteService.get(supabase, id).catch(() => null);
  if (!note || note.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const text = tiptapToPlainText(note.content);
  if (text.length < 20) {
    return NextResponse.json({ error: 'Note is too short to generate from' }, { status: 400 });
  }

  try {
    const questions = await generateQuiz(text, 10);
    const quiz = await quizService.create(
      supabase,
      {
        user_id: user.id,
        title: note.title || 'From a note',
        source: 'ai',
      },
      questions
    );
    return NextResponse.json({ quiz_id: quiz.id });
  } catch (error) {
    console.error('[notes/quiz]', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
