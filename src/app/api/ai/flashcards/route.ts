import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateFlashcards } from '@/lib/ai/service';
import { flashcardService } from '@/services/flashcard.service';

const schema = z.object({
  deck_id: z.string().uuid(),
  content: z.string().min(20),
  count: z.number().int().min(1).max(30).default(10),
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
    const generated = await generateFlashcards(parsed.data.content, parsed.data.count);
    const rows = generated.map((c) => ({
      user_id: user.id,
      deck_id: parsed.data.deck_id,
      front: c.front,
      back: c.back,
      source: 'ai' as const,
    }));
    const inserted = await flashcardService.createMany(supabase, rows);
    return NextResponse.json({ flashcards: inserted });
  } catch (error) {
    console.error('[ai/flashcards]', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
