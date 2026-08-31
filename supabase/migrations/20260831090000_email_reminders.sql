-- ============================================================================
-- Daily study reminders
--
-- Opt-in by default. Sending mail to someone who did not ask for it is both a
-- deliverability problem and, in several jurisdictions, a legal one — and it
-- would contradict the privacy policy.
--
-- reminder_token lets the unsubscribe link work without a login. Someone
-- following it from their inbox is often not signed in, and a one-click
-- unsubscribe that demands authentication is one people ignore in favour of
-- marking the mail as spam.
-- ============================================================================

alter table public.profiles
  add column daily_reminders boolean not null default false,
  add column reminder_token uuid not null default gen_random_uuid(),
  add column last_reminder_sent_at timestamptz;

create index idx_profiles_daily_reminders
  on public.profiles(daily_reminders)
  where daily_reminders = true;

-- Unique so a token can identify exactly one account.
create unique index idx_profiles_reminder_token on public.profiles(reminder_token);

-- ============================================================================
-- Who should receive a reminder right now.
--
-- SECURITY DEFINER because the cron job has no user context — it runs for
-- everyone. It returns only what the email needs (address, first name, due
-- count) and never any study content.
-- ============================================================================
create or replace function public.users_due_for_reminder(p_min_hours_since integer default 20)
returns table (
  user_id uuid,
  email text,
  full_name text,
  reminder_token uuid,
  due_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.email,
    p.full_name,
    p.reminder_token,
    count(f.id) as due_count
  from public.profiles p
  join public.flashcards f
    on f.user_id = p.id
   and f.due_date <= now()
  where p.daily_reminders = true
    and p.email is not null
    and (
      p.last_reminder_sent_at is null
      or p.last_reminder_sent_at < now() - make_interval(hours => p_min_hours_since)
    )
  group by p.id, p.email, p.full_name, p.reminder_token
  having count(f.id) > 0;
$$;

-- Only the service role runs this; no end user should enumerate accounts.
revoke all on function public.users_due_for_reminder(integer) from public;
revoke all on function public.users_due_for_reminder(integer) from authenticated;

-- ============================================================================
-- Unsubscribe by token, without a session.
-- ============================================================================
create or replace function public.unsubscribe_by_token(p_token uuid)
returns boolean
language sql
volatile
security definer
set search_path = public
as $$
  with updated as (
    update public.profiles
    set daily_reminders = false
    where reminder_token = p_token
    returning 1
  )
  select exists (select 1 from updated);
$$;

grant execute on function public.unsubscribe_by_token(uuid) to anon, authenticated;
