import type { SupabaseClient } from '@supabase/supabase-js';
import { tiptapToPlainText } from '@/lib/notes/tiptapText';

export type TutorContextType = 'deck' | 'document' | 'note';

/**
 * Ceiling on how much material rides along with every turn of a conversation.
 * The system instruction is re-sent on each request, so this is a recurring
 * cost, not a one-off — keep it well below the per-request content cap.
 */
const MAX_CONTEXT_CHARS = 8_000;

const clip = (text: string) =>
  text.length > MAX_CONTEXT_CHARS
    ? `${text.slice(0, MAX_CONTEXT_CHARS)}\n\n[…truncated]`
    : text;

/**
 * Loads the material behind a conversation's context, through the user's own
 * client so RLS decides what is readable. Returns null when the source has
 * been deleted or is empty, in which case the tutor simply runs without it.
 */
export const buildTutorContext = async (
  supabase: SupabaseClient,
  type: TutorContextType,
  id: string
): Promise<{ label: string; material: string } | null> => {
  if (type === 'deck') {
    const [{ data: deck }, { data: cards }] = await Promise.all([
      supabase.from('decks').select('title').eq('id', id).single(),
      supabase.from('flashcards').select('front, back').eq('deck_id', id).limit(200),
    ]);
    if (!deck || !cards || cards.length === 0) return null;

    const material = (cards as Array<{ front: string; back: string }>)
      .map((c, i) => `${i + 1}. Q: ${c.front}\n   A: ${c.back}`)
      .join('\n');

    return {
      label: deck.title,
      material: clip(`Flashcards in the deck "${deck.title}":\n\n${material}`),
    };
  }

  if (type === 'document') {
    const { data: doc } = await supabase
      .from('documents')
      .select('title, extracted_text, summary')
      .eq('id', id)
      .single();
    if (!doc) return null;

    const body = doc.extracted_text || doc.summary;
    if (!body) return null;

    return {
      label: doc.title,
      material: clip(`Text of the document "${doc.title}":\n\n${body}`),
    };
  }

  const { data: note } = await supabase
    .from('notes')
    .select('title, content')
    .eq('id', id)
    .single();
  if (!note) return null;

  const body = tiptapToPlainText(note.content).trim();
  if (!body) return null;

  return {
    label: note.title,
    material: clip(`The student's note "${note.title}":\n\n${body}`),
  };
};
