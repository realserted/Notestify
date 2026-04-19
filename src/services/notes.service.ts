import type { SupabaseClient } from '@supabase/supabase-js';
import type { Note, Notebook, NotebookCover, PaperStyle, Stroke } from '@/types/database';

export const notebookService = {
  list: async (supabase: SupabaseClient, userId: string) => {
    const { data, error } = await supabase
      .from('notebooks')
      .select('*, notes(count)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  get: async (supabase: SupabaseClient, id: string) => {
    const { data, error } = await supabase.from('notebooks').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Notebook;
  },

  create: async (
    supabase: SupabaseClient,
    payload: { user_id: string; title: string; cover_color?: NotebookCover }
  ) => {
    const { data, error } = await supabase.from('notebooks').insert(payload).select().single();
    if (error) throw error;
    return data as Notebook;
  },

  update: async (supabase: SupabaseClient, id: string, patch: Partial<Notebook>) => {
    const { data, error } = await supabase
      .from('notebooks')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Notebook;
  },

  remove: async (supabase: SupabaseClient, id: string) => {
    const { error } = await supabase.from('notebooks').delete().eq('id', id);
    if (error) throw error;
  },
};

export const noteService = {
  listByNotebook: async (supabase: SupabaseClient, notebookId: string) => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('notebook_id', notebookId)
      .order('position', { ascending: true });
    if (error) throw error;
    return data as Note[];
  },

  get: async (supabase: SupabaseClient, id: string) => {
    const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Note;
  },

  create: async (
    supabase: SupabaseClient,
    payload: {
      user_id: string;
      notebook_id: string;
      title?: string;
      paper_style?: PaperStyle;
      position?: number;
    }
  ) => {
    const { data, error } = await supabase.from('notes').insert(payload).select().single();
    if (error) throw error;
    return data as Note;
  },

  update: async (
    supabase: SupabaseClient,
    id: string,
    patch: Partial<{
      title: string;
      paper_style: PaperStyle;
      content: unknown;
      strokes: Stroke[];
      position: number;
    }>
  ) => {
    const { data, error } = await supabase
      .from('notes')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Note;
  },

  remove: async (supabase: SupabaseClient, id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
  },
};
