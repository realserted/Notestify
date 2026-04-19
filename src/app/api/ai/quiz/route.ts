import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateQuiz } from '@/lib/ai/service';
import { quizService } from '@/services/quiz.service';

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(20),
  count: z.number().int().min(1).max(20).default(10),
  deck_id: z.string().uuid().optional(),
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
    const questions = await generateQuiz(parsed.data.content, parsed.data.count);
    const quiz = await quizService.create(
      supabase,
      {
        user_id: user.id,
        title: parsed.data.title,
        deck_id: parsed.data.deck_id,
        source: 'ai',
      },
      questions
    );
    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('[ai/quiz]', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
