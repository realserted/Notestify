-- ============================================================================
-- Let a tutor conversation be anchored to one piece of the user's material.
--
-- Explicit rather than retrieved: the student picks a deck, document or note
-- when starting a session. That is predictable (no retrieval misses), needs
-- no embeddings, and matches how studying actually works — you sit down with
-- one subject, not with your whole library.
--
-- No foreign key: if the deck is later deleted the conversation should stay
-- readable as history rather than cascading away. The server treats a missing
-- source as "no context".
-- ============================================================================

alter table public.tutor_conversations
  add column context_type text
    check (context_type in ('deck', 'document', 'note')),
  add column context_id uuid,
  add column context_label text;

-- Both or neither.
alter table public.tutor_conversations
  add constraint tutor_conversations_context_complete
  check (
    (context_type is null and context_id is null)
    or (context_type is not null and context_id is not null)
  );
