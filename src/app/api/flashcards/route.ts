import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { flashcardService } from '@/services/flashcard.service';

const schema = z.object({
  deck_id: z.string().uuid(),
  front: z.string().min(1),
  back: z.string().min(1),
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

  const card = await flashcardService.create(supabase, {
    user_id: user.id,
    ...parsed.data,
  });
  return NextResponse.json({ flashcard: card });
}
