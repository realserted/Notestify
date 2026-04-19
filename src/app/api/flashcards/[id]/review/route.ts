import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { flashcardService } from '@/services/flashcard.service';

const schema = z.object({ quality: z.number().int().min(0).max(5) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const { data: card, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (error || !card) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await flashcardService.review(supabase, card, parsed.data.quality);
  return NextResponse.json({ flashcard: updated });
}
