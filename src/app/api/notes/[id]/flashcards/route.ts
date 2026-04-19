import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { noteService } from '@/services/notes.service';
import { deckService } from '@/services/deck.service';
import { flashcardService } from '@/services/flashcard.service';
import { generateFlashcards } from '@/lib/ai/service';
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
    const deck = await deckService.create(supabase, {
      user_id: user.id,
      title: note.title || 'From a note',
      description: `Generated from note "${note.title}"`,
    });

    const generated = await generateFlashcards(text, 10);
    const rows = generated.map((c) => ({
      user_id: user.id,
      deck_id: deck.id,
      front: c.front,
      back: c.back,
      source: 'ai' as const,
    }));
    await flashcardService.createMany(supabase, rows);

    return NextResponse.json({ deck_id: deck.id });
  } catch (error) {
    console.error('[notes/flashcards]', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
