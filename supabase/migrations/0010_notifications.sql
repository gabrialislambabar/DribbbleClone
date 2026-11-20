-- 0010_notifications.sql
-- In-app notifications for follows and comments, plus per-event preferences.

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete cascade,
  type text not null,
  shot_id uuid references public.shots (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in ('follow', 'comment')),
  constraint notifications_target_check check (
    (type = 'follow' and shot_id is null and comment_id is null)
    or (type = 'comment' and shot_id is not null and comment_id is not null)
  )
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc, id desc);

create index if not exists notifications_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  follows boolean not null default true,
  comments boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists notification_preferences_set_updated_at
  on public.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Event triggers
-- ---------------------------------------------------------------------------

create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.notification_preferences np
    where np.user_id = new.following_id and np.follows = false
  ) then
    return new;
  end if;

  insert into public.notifications (recipient_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');

  return new;
end;
$$;

drop trigger if exists follows_create_notification on public.follows;
create trigger follows_create_notification
after insert on public.follows
for each row
execute function public.notify_on_follow();

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select s.creator_id
  into v_owner
  from public.shots s
  where s.id = new.shot_id;

  if v_owner is null or v_owner = new.author_id then
    return new;
  end if;

  if exists (
    select 1
    from public.notification_preferences np
    where np.user_id = v_owner and np.comments = false
  ) then
    return new;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    shot_id,
    comment_id
  )
  values (v_owner, new.author_id, 'comment', new.shot_id, new.id);

  return new;
end;
$$;

drop trigger if exists comments_create_notification on public.comments;
create trigger comments_create_notification
after insert on public.comments
for each row
execute function public.notify_on_comment();

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "users read their notifications" on public.notifications;
create policy "users read their notifications"
on public.notifications
for select
using (recipient_id = (select auth.uid()));

drop policy if exists "users mark their notifications read" on public.notifications;
create policy "users mark their notifications read"
on public.notifications
for update
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

drop policy if exists "users read their notification preferences"
  on public.notification_preferences;
create policy "users read their notification preferences"
on public.notification_preferences
for select
using (user_id = (select auth.uid()));

drop policy if exists "users create their notification preferences"
  on public.notification_preferences;
create policy "users create their notification preferences"
on public.notification_preferences
for insert
with check (user_id = (select auth.uid()));

drop policy if exists "users update their notification preferences"
  on public.notification_preferences;
create policy "users update their notification preferences"
on public.notification_preferences
for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke all on public.notification_preferences from anon, authenticated;
grant select on public.notification_preferences to authenticated;
grant insert (user_id, follows, comments) on public.notification_preferences
  to authenticated;
grant update (follows, comments) on public.notification_preferences
  to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime publication (Postgres Changes for the signed-in user)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
