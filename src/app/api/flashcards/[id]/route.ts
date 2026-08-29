import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  front: z.string().min(1).max(2000),
  back: z.string().min(1).max(2000),
});

/**
 * Edit a card's text. Deliberately does not touch the SM-2 fields: fixing a
 * typo mid-review should not reset the card's scheduling.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Front and back are required.' }, { status: 400 });
  }

  // The user_id filter is belt-and-braces alongside RLS.
  const { data, error } = await supabase
    .from('flashcards')
    .update({ front: parsed.data.front, back: parsed.data.back })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) {
    console.error('[flashcards/:id] patch', error);
    return NextResponse.json({ error: 'Could not save the card.' }, { status: 400 });
  }

  return NextResponse.json({ flashcard: data });
}
