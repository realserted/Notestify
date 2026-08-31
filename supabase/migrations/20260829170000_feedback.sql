-- ============================================================================
-- Feedback, bug reports and feature ideas
--
-- One table with a `kind` column rather than three features: they differ only
-- by what the user picked in a dropdown.
--
-- The admin policies are defined here so the inbox needs no later migration.
-- The role is read from app_metadata, NOT user_metadata: users can write to
-- user_metadata themselves via supabase.auth.updateUser(), so a role stored
-- there would let anyone make themselves an admin. app_metadata is only
-- writable with the service role key.
-- ============================================================================

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('bug', 'idea', 'other')),
  message text not null check (char_length(message) between 1 and 4000),
  status text not null default 'new'
    check (status in ('new', 'triaged', 'done', 'wont_fix')),
  -- Private to admins; never returned to the author.
  admin_note text,
  -- Route, viewport, user agent and deployed commit. Without these a bug
  -- report is not reproducible.
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_feedback_status_created on public.feedback(status, created_at desc);
create index idx_feedback_user_id on public.feedback(user_id);

create trigger trg_feedback_updated before update on public.feedback
  for each row execute function public.set_updated_at();

alter table public.feedback enable row level security;

-- Authors: submit, and read back what they sent. Deliberately no update or
-- delete — feedback should not be editable after the fact.
create policy "Users submit feedback" on public.feedback
  for insert with check (auth.uid() = user_id);

create policy "Users read own feedback" on public.feedback
  for select using (auth.uid() = user_id);

-- Admins: read everything and triage it.
create policy "Admins read all feedback" on public.feedback
  for select using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins update feedback" on public.feedback
  for update using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
