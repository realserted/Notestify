-- ============================================================================
-- Google Drive as an upload source
--
-- Two changes: a table holding one encrypted Drive refresh token per user, and
-- documents learning to hold a row with no stored file.
--
-- A Drive import fetches the bytes, extracts the text and discards the
-- original. storage_path being null IS the record of that. Readers must treat
-- it as the answer to "do we still have the original?" rather than as a merely
-- optional field.
-- ============================================================================

-- ============================================================================
-- Drive connections
--
-- The refresh token is encrypted by the application (AES-256-GCM, key in
-- DRIVE_TOKEN_KEY) before it ever reaches Postgres. Deliberately NOT pgcrypto:
-- pgp_sym_encrypt takes the key as a SQL literal, which would put it in the
-- query logs on every single call.
--
-- user_id is the primary key, so reconnecting is an upsert and a user can
-- never accumulate stale rows pointing at revoked grants.
-- ============================================================================
create table public.drive_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Ciphertext, IV and GCM auth tag, base64. Inert without DRIVE_TOKEN_KEY,
  -- which exists only in the deployment environment.
  --
  -- text/base64 rather than bytea on purpose: PostgREST returns bytea as a
  -- "\x..." hex string and needs explicit casts on the way in, so every read
  -- and write would carry an encoding dance that is easy to get subtly wrong.
  -- The bytes are already opaque; base64 costs a third more storage on three
  -- short values and removes that whole class of bug.
  refresh_token_ciphertext text not null,
  iv       text not null,
  auth_tag text not null,

  -- Recorded so a token issued under a narrower scope than we now require can
  -- be detected here, rather than discovered on a failed API call later.
  scope text not null,

  -- Which Google account this is, for display in settings. Never used for
  -- authorization — that is always auth.uid().
  google_sub   text,
  google_email text,

  connected_at    timestamptz not null default now(),
  last_refresh_at timestamptz,

  -- Never the token. Just enough to tell a revoked grant from an outage.
  last_refresh_error text
);

alter table public.drive_connections enable row level security;

-- Same shape as every other per-user table in 20250101000001_rls_policies.sql.
--
-- This does let the owning user read their own ciphertext from the browser.
-- That is acceptable: it is useless without the key, and keeping token reads
-- on the caller's own client means Postgres enforces ownership even if a
-- route's logic is wrong. Service-role-only access would be marginally tighter
-- but would add a second exception to that invariant for no real gain.
create policy "Users manage own drive connection" on public.drive_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Documents: allow rows that have no stored file
-- ============================================================================
alter table public.documents
  alter column storage_path drop not null;

alter table public.documents
  add column if not exists source text not null default 'upload'
    check (source in ('upload', 'drive'));

-- The Drive file a row was imported from. Nothing reads this yet. It is what a
-- future re-import or "you already imported this" check would need, and it is
-- free to record now but impossible to backfill later.
alter table public.documents
  add column if not exists drive_file_id text;

-- Dropping NOT NULL above would otherwise weaken the invariant for uploads
-- too. Only Drive imports may omit a path, and that is enforced here rather
-- than left to application code to remember.
alter table public.documents
  add constraint documents_storage_path_required_for_uploads
    check (source = 'drive' or storage_path is not null);

create index if not exists idx_documents_drive_file
  on public.documents(user_id, drive_file_id)
  where drive_file_id is not null;
