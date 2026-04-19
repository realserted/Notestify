import type { SupabaseClient } from '@supabase/supabase-js';
import type { Flashcard, FlashcardSource } from '@/types/database';
import { calculateNextReview } from '@/lib/srs/sm2';

export const flashcardService = {
  listByDeck: async (supabase: SupabaseClient, deckId: string) => {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as Flashcard[];
  },

  getDue: async (supabase: SupabaseClient, userId: string, deckId?: string) => {
    let query = supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .lte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });
    if (deckId) query = query.eq('deck_id', deckId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Flashcard[];
  },

  create: async (
    supabase: SupabaseClient,
    payload: {
      user_id: string;
      deck_id: string;
      front: string;
      back: string;
      source?: FlashcardSource;
    }
  ) => {
    const { data, error } = await supabase.from('flashcards').insert(payload).select().single();
    if (error) throw error;
    return data as Flashcard;
  },

  createMany: async (
    supabase: SupabaseClient,
    rows: Array<{
      user_id: string;
      deck_id: string;
      front: string;
      back: string;
      source?: FlashcardSource;
    }>
  ) => {
    if (rows.length === 0) return [];
    const { data, error } = await supabase.from('flashcards').insert(rows).select();
    if (error) throw error;
    return data as Flashcard[];
  },

  update: async (supabase: SupabaseClient, id: string, patch: Partial<Flashcard>) => {
    const { data, error } = await supabase
      .from('flashcards')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Flashcard;
  },

  remove: async (supabase: SupabaseClient, id: string) => {
    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    if (error) throw error;
  },

  review: async (
    supabase: SupabaseClient,
    card: Flashcard,
    quality: number
  ): Promise<Flashcard> => {
    const next = calculateNextReview(
      {
        ease_factor: card.ease_factor,
        interval_days: card.interval_days,
        repetitions: card.repetitions,
      },
      quality
    );

    const { data, error } = await supabase
      .from('flashcards')
      .update({
        ease_factor: next.ease_factor,
        interval_days: next.interval_days,
        repetitions: next.repetitions,
        due_date: next.due_date.toISOString(),
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', card.id)
      .select()
      .single();
    if (error) throw error;

    await supabase.from('review_logs').insert({
      user_id: card.user_id,
      flashcard_id: card.id,
      quality,
    });

    return data as Flashcard;
  },
};
