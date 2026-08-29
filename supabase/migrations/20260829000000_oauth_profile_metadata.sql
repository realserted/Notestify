-- ============================================================================
-- Capture OAuth profile metadata on signup
--
-- Google returns full_name/name and avatar_url/picture in raw_user_meta_data.
-- The original trigger only read full_name and dropped the avatar entirely.
-- Made idempotent so a repeat insert can never fail the signup transaction.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do update set
    full_name  = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  return new;
end;
$$ language plpgsql security definer;
