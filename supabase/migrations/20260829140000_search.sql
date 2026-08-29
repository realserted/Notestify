-- ============================================================================
-- Cross-content search
--
-- SECURITY INVOKER, so every underlying table's row-level security still
-- applies and a user can only ever match their own rows. Written as a
-- function rather than five client queries because note bodies are jsonb and
-- PostgREST cannot cast a column inside a filter.
--
-- ILIKE rather than tsvector: one user's corpus is small, and it avoids
-- committing to a stemming configuration before we know what people search
-- for. Revisit with a GIN index if this ever gets slow.
-- ============================================================================

create or replace function public.search_all(p_query text)
returns table (
  kind text,
  id uuid,
  title text,
  snippet text,
  parent_id uuid
)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (select '%' || trim(p_query) || '%' as pattern)

  select 'deck'::text, d.id, d.title, coalesce(d.description, '')::text, null::uuid
  from public.decks d, q
  where d.title ilike q.pattern or d.description ilike q.pattern

  union all
  -- Note bodies are searched, but the snippet stays empty: content is a
  -- ProseMirror document and a raw JSON excerpt reads as noise.
  select 'note'::text, n.id, n.title, ''::text, n.notebook_id
  from public.notes n, q
  where n.title ilike q.pattern or n.content::text ilike q.pattern

  union all
  select 'document'::text, doc.id, doc.title,
         left(coalesce(doc.extracted_text, ''), 160)::text, null::uuid
  from public.documents doc, q
  where doc.title ilike q.pattern or doc.extracted_text ilike q.pattern

  union all
  select 'flashcard'::text, f.id, f.front, left(f.back, 160)::text, f.deck_id
  from public.flashcards f, q
  where f.front ilike q.pattern or f.back ilike q.pattern

  union all
  select 'quiz'::text, z.id, z.title, ''::text, z.deck_id
  from public.quizzes z, q
  where z.title ilike q.pattern

  limit 50;
$$;

revoke all on function public.search_all(text) from public;
grant execute on function public.search_all(text) to authenticated;
