import type { SupabaseClient } from '@supabase/supabase-js';
import type { Deck } from '@/types/database';

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
