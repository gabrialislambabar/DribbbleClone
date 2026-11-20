-- 0008_rate_limits.sql
-- Per-user fixed-window rate limits for quota-limited or spam-prone actions.

begin;

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null,
  constraint rate_limits_count_check check (count >= 0)
);

create index if not exists rate_limits_reset_idx
  on public.rate_limits (reset_at);

alter table public.rate_limits enable row level security;

revoke all on public.rate_limits from anon, authenticated;

-- No policies: clients can only touch this table through the definer function.
create or replace function public.consume_rate_limit(
  p_action text,
  p_limit integer default 10,
  p_window_seconds integer default 60
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 1000);
  v_window integer := least(greatest(coalesce(p_window_seconds, 60), 1), 86400);
  v_key text;
  v_row public.rate_limits;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if p_action is null or p_action !~ '^[a-z][a-z0-9-]{0,39}$' then
    raise exception 'invalid_rate_limit_action';
  end if;

  v_key := p_action || ':' || v_uid::text;

  insert into public.rate_limits as rl (key, count, reset_at)
  values (v_key, 1, v_now + make_interval(secs => v_window))
  on conflict (key) do update
  set
    count = case
      when rl.reset_at <= v_now then 1
      else rl.count + 1
    end,
    reset_at = case
      when rl.reset_at <= v_now then v_now + make_interval(secs => v_window)
      else rl.reset_at
    end
  returning * into v_row;

  return query
  select
    v_row.count <= v_limit,
    greatest(v_limit - v_row.count, 0),
    v_row.reset_at;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer)
  from public;
grant execute on function public.consume_rate_limit(text, integer, integer)
  to authenticated;

notify pgrst, 'reload schema';

commit;
