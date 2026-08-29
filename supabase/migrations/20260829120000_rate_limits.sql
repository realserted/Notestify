-- ============================================================================
-- Per-user rate limiting for the AI endpoints
--
-- Fixed-window counters. The whole check is one atomic INSERT .. ON CONFLICT
-- DO UPDATE .. RETURNING, because serverless routes run concurrently and a
-- read-then-write from JS would race and leak over the limit.
--
-- The function takes no user id: it reads auth.uid() itself, so a caller can
-- never spend someone else's budget by passing a different id.
-- ============================================================================

create table public.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (user_id, action, window_start)
);

-- No policies: RLS on with none defined denies all direct access. The function
-- below is SECURITY DEFINER, so it is the only way in.
alter table public.rate_limits enable row level security;

create or replace function public.check_rate_limit(
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
as $$
declare
  v_user uuid := auth.uid();
  v_window timestamptz;
  v_count integer;
begin
  if v_user is null then
    return query select false, 0, now();
    return;
  end if;

  -- Truncate now() down to the current window bucket.
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits as rl (user_id, action, window_start, count)
  values (v_user, p_action, v_window, 1)
  on conflict (user_id, action, window_start)
  do update set count = rl.count + 1
  returning rl.count into v_count;

  -- Drop this user's expired buckets so the table stays small. Cheap: it hits
  -- the primary key prefix.
  delete from public.rate_limits
  where user_id = v_user and action = p_action and window_start < v_window;

  return query select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    v_window + make_interval(secs => p_window_seconds);
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;
