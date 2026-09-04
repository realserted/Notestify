-- ============================================================================
-- Backfill missing profile rows
--
-- handle_new_user creates a profile when an auth.users row is inserted, but
-- at least one account exists without one — most likely created while an
-- earlier version of the trigger was failing. The symptom is subtle: settings
-- reads daily_reminders and gets nothing, and any UPDATE against profiles
-- matches zero rows, which Supabase reports as success rather than an error.
--
-- Idempotent, so it is safe if it ever runs twice.
-- ============================================================================

insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    ''
  ),
  coalesce(
    u.raw_user_meta_data ->> 'avatar_url',
    u.raw_user_meta_data ->> 'picture'
  )
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- ============================================================================
-- Allow a user to create their own profile row.
--
-- profiles had SELECT and UPDATE policies but no INSERT one, so an upsert
-- from the app could never heal a missing row — RLS blocked the insert half.
-- The check restricts it to the caller's own id, so this grants nothing
-- beyond what the trigger already does on their behalf.
-- ============================================================================
create policy "Users can create own profile" on public.profiles
  for insert with check (auth.uid() = id);
