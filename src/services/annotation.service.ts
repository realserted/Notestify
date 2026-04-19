import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnnotationData, AnnotationKind, DocumentAnnotation } from '@/types/database';

export const annotationService = {
  listByDocument: async (supabase: SupabaseClient, documentId: string) => {
    const { data, error } = await supabase
      .from('document_annotations')
      .select('*')
      .eq('document_id', documentId)
      .order('page', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as DocumentAnnotation[];
  },

  create: async (
    supabase: SupabaseClient,
    payload: {
      user_id: string;
      document_id: string;
      page: number;
      kind: AnnotationKind;
      data: AnnotationData;
    }
  ) => {
    const { data, error } = await supabase
      .from('document_annotations')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as DocumentAnnotation;
  },

  update: async (
    supabase: SupabaseClient,
    id: string,
    patch: Partial<{ data: AnnotationData; page: number }>
  ) => {
    const { data, error } = await supabase
      .from('document_annotations')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as DocumentAnnotation;
  },

  remove: async (supabase: SupabaseClient, id: string) => {
    const { error } = await supabase.from('document_annotations').delete().eq('id', id);
    if (error) throw error;
  },
};
