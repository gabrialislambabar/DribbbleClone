-- 0004_social.sql
-- Likes, comments, follows, and denormalized counters.

-- ---------------------------------------------------------------------------
-- Columns (created before the triggers that reference them)
-- ---------------------------------------------------------------------------

alter table public.shots
  add column if not exists like_count integer not null default 0,
  add column if not exists comment_count integer not null default 0;

alter table public.profiles
  add column if not exists follower_count integer not null default 0,
  add column if not exists following_count integer not null default 0;

alter table public.shots drop constraint if exists shots_like_count_check;
alter table public.shots add constraint shots_like_count_check check (like_count >= 0);

alter table public.shots drop constraint if exists shots_comment_count_check;
alter table public.shots add constraint shots_comment_count_check check (comment_count >= 0);

alter table public.profiles drop constraint if exists profiles_follower_count_check;
alter table public.profiles add constraint profiles_follower_count_check check (follower_count >= 0);

alter table public.profiles drop constraint if exists profiles_following_count_check;
alter table public.profiles add constraint profiles_following_count_check check (following_count >= 0);

-- ---------------------------------------------------------------------------
-- Likes
-- ---------------------------------------------------------------------------

create table if not exists public.shot_likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  shot_id uuid not null references public.shots (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, shot_id)
);

create index if not exists shot_likes_shot_created_idx
  on public.shot_likes (shot_id, created_at desc);

create index if not exists shot_likes_created_shot_idx
  on public.shot_likes (created_at desc, shot_id);

create index if not exists shot_likes_user_created_idx
  on public.shot_likes (user_id, created_at desc);

create or replace function public.sync_shot_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.shots
    set like_count = like_count + 1
    where id = new.shot_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.shots
    set like_count = greatest(like_count - 1, 0)
    where id = old.shot_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists shot_likes_update_count on public.shot_likes;
create trigger shot_likes_update_count
after insert or delete on public.shot_likes
for each row
execute function public.sync_shot_like_count();

alter table public.shot_likes enable row level security;

drop policy if exists "users read their own likes" on public.shot_likes;
create policy "users read their own likes"
on public.shot_likes
for select
using (user_id = (select auth.uid()));

drop policy if exists "users like published shots" on public.shot_likes;
create policy "users like published shots"
on public.shot_likes
for insert
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.shots s
    where s.id = shot_id and s.status = 'published'
  )
);

drop policy if exists "users unlike their own likes" on public.shot_likes;
create policy "users unlike their own likes"
on public.shot_likes
for delete
using (user_id = (select auth.uid()));

revoke all on public.shot_likes from anon, authenticated;
grant select on public.shot_likes to authenticated;
grant insert (user_id, shot_id) on public.shot_likes to authenticated;
grant delete on public.shot_likes to authenticated;

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  shot_id uuid not null references public.shots (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_body_len check (char_length(btrim(body)) between 1 and 1000)
);

create index if not exists comments_shot_created_idx
  on public.comments (shot_id, created_at, id);

create index if not exists comments_author_created_idx
  on public.comments (author_id, created_at desc);

create or replace function public.sync_shot_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.shots
    set comment_count = comment_count + 1
    where id = new.shot_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.shots
    set comment_count = greatest(comment_count - 1, 0)
    where id = old.shot_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists comment_insert_delete_count on public.comments;
create trigger comment_insert_delete_count
after insert or delete on public.comments
for each row
execute function public.sync_shot_comment_count();

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
before update on public.comments
for each row
execute function public.set_updated_at();

create or replace function public.guard_comment_identity()
returns trigger
language plpgsql
as $$
begin
  if new.shot_id is distinct from old.shot_id
     or new.author_id is distinct from old.author_id
     or new.created_at is distinct from old.created_at then
    raise exception 'comment_identity_immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_guard_identity on public.comments;
create trigger comments_guard_identity
before update on public.comments
for each row
execute function public.guard_comment_identity();

alter table public.comments enable row level security;

drop policy if exists "comments on visible shots" on public.comments;
create policy "comments on visible shots"
on public.comments
for select
using (
  exists (
    select 1
    from public.shots s
    where s.id = shot_id
      and (s.status = 'published' or s.creator_id = (select auth.uid()))
  )
);

drop policy if exists "users comment on published shots" on public.comments;
create policy "users comment on published shots"
on public.comments
for insert
with check (
  author_id = (select auth.uid())
  and exists (
    select 1
    from public.shots s
    where s.id = shot_id and s.status = 'published'
  )
);

drop policy if exists "authors update their comments" on public.comments;
create policy "authors update their comments"
on public.comments
for update
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

drop policy if exists "authors or shot owners delete comments" on public.comments;
create policy "authors or shot owners delete comments"
on public.comments
for delete
using (
  author_id = (select auth.uid())
  or exists (
    select 1
    from public.shots s
    where s.id = shot_id and s.creator_id = (select auth.uid())
  )
);

revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (shot_id, author_id, body) on public.comments to authenticated;
grant update (body) on public.comments to authenticated;
grant delete on public.comments to authenticated;

-- ---------------------------------------------------------------------------
-- Follows
-- ---------------------------------------------------------------------------

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists follows_following_created_idx
  on public.follows (following_id, created_at desc, follower_id);

create index if not exists follows_follower_created_idx
  on public.follows (follower_id, created_at desc, following_id);

create or replace function public.sync_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
    set following_count = following_count + 1
    where id = new.follower_id;

    update public.profiles
    set follower_count = follower_count + 1
    where id = new.following_id;

    return new;
  elsif tg_op = 'DELETE' then
    update public.profiles
    set following_count = greatest(following_count - 1, 0)
    where id = old.follower_id;

    update public.profiles
    set follower_count = greatest(follower_count - 1, 0)
    where id = old.following_id;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists follows_update_counts on public.follows;
create trigger follows_update_counts
after insert or delete on public.follows
for each row
execute function public.sync_follow_counts();

alter table public.follows enable row level security;

drop policy if exists "follows are publicly readable" on public.follows;
create policy "follows are publicly readable"
on public.follows
for select
using (true);

drop policy if exists "users follow as themselves" on public.follows;
create policy "users follow as themselves"
on public.follows
for insert
with check (follower_id = (select auth.uid()));

drop policy if exists "users unfollow as themselves" on public.follows;
create policy "users unfollow as themselves"
on public.follows
for delete
using (follower_id = (select auth.uid()));

revoke all on public.follows from anon, authenticated;
grant select on public.follows to anon, authenticated;
grant insert (follower_id, following_id) on public.follows to authenticated;
grant delete on public.follows to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill (safe to rerun; only touches rows whose counts changed)
-- ---------------------------------------------------------------------------

with like_counts as (
  select
    s.id,
    (select count(*)::integer from public.shot_likes l where l.shot_id = s.id)
      as like_count,
    (select count(*)::integer from public.comments c where c.shot_id = s.id)
      as comment_count
  from public.shots s
)
update public.shots s
set
  like_count = lc.like_count,
  comment_count = lc.comment_count
from like_counts lc
where s.id = lc.id
  and (
    s.like_count <> lc.like_count
    or s.comment_count <> lc.comment_count
  );

with follow_counts as (
  select
    p.id,
    (select count(*)::integer from public.follows f where f.following_id = p.id)
      as follower_count,
    (select count(*)::integer from public.follows f where f.follower_id = p.id)
      as following_count
  from public.profiles p
)
update public.profiles p
set
  follower_count = fc.follower_count,
  following_count = fc.following_count
from follow_counts fc
where p.id = fc.id
  and (
    p.follower_count <> fc.follower_count
    or p.following_count <> fc.following_count
  );
