import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { quizService } from '@/services/quiz.service';

const schema = z.object({
  answers: z.record(z.string(), z.string()),
  time_taken_seconds: z.number().int().nonnegative().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;
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
    const result = await quizService.submit(supabase, {
      user_id: user.id,
      quiz_id: quizId,
      answers: parsed.data.answers,
      time_taken_seconds: parsed.data.time_taken_seconds,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[quiz/submit]', error);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
