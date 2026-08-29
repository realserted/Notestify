import type { SupabaseClient } from '@supabase/supabase-js';
import type { Deck } from '@/types/database';

/** A card counts as mature once SM-2 has pushed its interval past three weeks. */
const MATURE_INTERVAL_DAYS = 21;

export interface DeckSummary extends Deck {
  cardCount: number;
  dueCount: number;
  matureCount: number;
}

export const deckService = {
  list: async (supabase: SupabaseClient, userId: string) => {
    const { data, error } = await supabase
      .from('decks')
      .select('*, flashcards(count)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** `list` plus the per-deck due and maturity counts the decks grid renders. */
  listWithProgress: async (
    supabase: SupabaseClient,
    userId: string
  ): Promise<DeckSummary[]> => {
    const nowIso = new Date().toISOString();

    const [decksRes, cardsRes] = await Promise.all([
      supabase
        .from('decks')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('flashcards')
        .select('deck_id, due_date, interval_days')
        .eq('user_id', userId),
    ]);
    if (decksRes.error) throw decksRes.error;
    if (cardsRes.error) throw cardsRes.error;

    const tally = new Map<string, { cardCount: number; dueCount: number; matureCount: number }>();
    for (const card of (cardsRes.data ?? []) as Array<{
      deck_id: string;
      due_date: string;
      interval_days: number;
    }>) {
      const entry = tally.get(card.deck_id) ?? { cardCount: 0, dueCount: 0, matureCount: 0 };
      entry.cardCount += 1;
      if (card.due_date <= nowIso) entry.dueCount += 1;
      if (card.interval_days >= MATURE_INTERVAL_DAYS) entry.matureCount += 1;
      tally.set(card.deck_id, entry);
    }

    return ((decksRes.data ?? []) as Deck[]).map((deck) => ({
      ...deck,
      ...(tally.get(deck.id) ?? { cardCount: 0, dueCount: 0, matureCount: 0 }),
    }));
  },

  get: async (supabase: SupabaseClient, id: string) => {
    const { data, error } = await supabase.from('decks').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Deck;
  },

  create: async (
    supabase: SupabaseClient,
    payload: { user_id: string; title: string; description?: string; tags?: string[] }
  ) => {
    const { data, error } = await supabase.from('decks').insert(payload).select().single();
    if (error) throw error;
    return data as Deck;
  },

  update: async (supabase: SupabaseClient, id: string, patch: Partial<Deck>) => {
    const { data, error } = await supabase
      .from('decks')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Deck;
  },

  remove: async (supabase: SupabaseClient, id: string) => {
    const { error } = await supabase.from('decks').delete().eq('id', id);
    if (error) throw error;
  },
};
