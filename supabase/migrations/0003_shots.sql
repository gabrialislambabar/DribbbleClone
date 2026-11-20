-- 0003_shots.sql
-- Categories, tags, shots, joins, RPCs, and row level security.

create table if not exists public.categories (
  id text primary key,
  name text not null,
  sort_order smallint not null default 0
);

insert into public.categories (id, name, sort_order)
values
  ('product-design', 'Product Design', 1),
  ('web-design', 'Web Design', 2),
  ('mobile-design', 'Mobile Design', 3),
  ('branding', 'Branding', 4),
  ('illustration', 'Illustration', 5),
  ('animation', 'Animation', 6)
on conflict (id) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order;

create table if not exists public.tags (
  id bigint generated always as identity primary key,
  name text not null,
  created_at timestamptz not null default now(),
  constraint tags_name_len check (char_length(btrim(name)) between 1 and 30)
);

create unique index if not exists tags_name_lower_key
  on public.tags (lower(name));

create table if not exists public.shots (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null references public.categories (id),
  title text not null,
  description text,
  cover_image_path text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint shots_status_check check (status in ('draft', 'published')),
  constraint shots_title_len check (char_length(btrim(title)) between 1 and 100),
  constraint shots_description_len check (
    description is null or char_length(description) <= 2000
  ),
  constraint shots_published_at_state check (
    (status = 'published') = (published_at is not null)
  ),
  constraint shots_cover_path_owner check (
    split_part(cover_image_path, '/', 1) = creator_id::text
  )
);

create index if not exists shots_feed_idx
  on public.shots (published_at desc)
  where status = 'published';

create index if not exists shots_creator_idx
  on public.shots (creator_id, created_at desc);

create index if not exists shots_category_idx
  on public.shots (category_id);

create table if not exists public.shot_tags (
  shot_id uuid not null references public.shots (id) on delete cascade,
  tag_id bigint not null references public.tags (id) on delete cascade,
  primary key (shot_id, tag_id)
);

drop trigger if exists shots_set_updated_at on public.shots;
create trigger shots_set_updated_at
before update on public.shots
for each row
execute function public.set_updated_at();

-- Replaces a shot's tags. Trims, dedupes case-insensitively, and enforces
-- the 5-tag and 30-character limits inside the database.
create or replace function public.set_shot_tags(p_shot_id uuid, p_tags text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tags text[] := coalesce(p_tags, '{}'::text[]);
  v_keys text[] := '{}'::text[];
  v_names text[] := '{}'::text[];
  v_name text;
  v_key text;
  v_tag_id bigint;
  i integer;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if not exists (
    select 1
    from public.shots
    where id = p_shot_id and creator_id = v_uid
  ) then
    raise exception 'not_owner';
  end if;

  if coalesce(array_length(v_tags, 1), 0) > 5 then
    raise exception 'too_many_tags';
  end if;

  for i in 1 .. coalesce(array_length(v_tags, 1), 0) loop
    v_name := btrim(v_tags[i]);

    if v_name = '' then
      continue;
    end if;

    if char_length(v_name) > 30 then
      raise exception 'tag_too_long';
    end if;

    v_key := lower(v_name);

    if v_key = any(v_keys) then
      continue;
    end if;

    v_keys := array_append(v_keys, v_key);
    v_names := array_append(v_names, v_name);
  end loop;

  if coalesce(array_length(v_keys, 1), 0) > 5 then
    raise exception 'too_many_tags';
  end if;

  delete from public.shot_tags where shot_id = p_shot_id;

  for i in 1 .. coalesce(array_length(v_keys, 1), 0) loop
    insert into public.tags (name)
    values (v_names[i])
    on conflict (lower(name)) do nothing;

    select id into v_tag_id
    from public.tags
    where lower(name) = v_keys[i];

    insert into public.shot_tags (shot_id, tag_id)
    values (p_shot_id, v_tag_id)
    on conflict do nothing;
  end loop;
end;
$$;

create or replace function public.create_shot(
  p_title text,
  p_description text,
  p_category_id text,
  p_tags text[],
  p_cover_path text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_shot_id uuid;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'title_required';
  end if;

  if char_length(btrim(p_title)) > 100 then
    raise exception 'title_too_long';
  end if;

  if p_description is not null and char_length(p_description) > 2000 then
    raise exception 'description_too_long';
  end if;

  if p_category_id is null or not exists (
    select 1 from public.categories where id = p_category_id
  ) then
    raise exception 'invalid_category';
  end if;

  if p_cover_path is null or btrim(p_cover_path) = '' then
    raise exception 'cover_required';
  end if;

  insert into public.shots (
    creator_id,
    category_id,
    title,
    description,
    cover_image_path
  )
  values (
    v_uid,
    p_category_id,
    btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''),
    p_cover_path
  )
  returning id into v_shot_id;

  perform public.set_shot_tags(v_shot_id, p_tags);

  return v_shot_id;
end;
$$;

create or replace function public.update_shot(
  p_shot_id uuid,
  p_title text,
  p_description text,
  p_category_id text,
  p_tags text[],
  p_cover_path text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if not exists (
    select 1
    from public.shots
    where id = p_shot_id and creator_id = v_uid
  ) then
    raise exception 'not_owner';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'title_required';
  end if;

  if char_length(btrim(p_title)) > 100 then
    raise exception 'title_too_long';
  end if;

  if p_description is not null and char_length(p_description) > 2000 then
    raise exception 'description_too_long';
  end if;

  if p_category_id is null or not exists (
    select 1 from public.categories where id = p_category_id
  ) then
    raise exception 'invalid_category';
  end if;

  if p_cover_path is null or btrim(p_cover_path) = '' then
    raise exception 'cover_required';
  end if;

  update public.shots
  set
    title = btrim(p_title),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    category_id = p_category_id,
    cover_image_path = p_cover_path
  where id = p_shot_id and creator_id = v_uid;

  perform public.set_shot_tags(p_shot_id, p_tags);
end;
$$;

create or replace function public.set_shot_status(p_shot_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if p_status not in ('draft', 'published') then
    raise exception 'invalid_status';
  end if;

  if p_status = 'published' then
    update public.shots
    set
      status = 'published',
      published_at = case
        when status = 'published' then published_at
        else now()
      end
    where id = p_shot_id and creator_id = v_uid;
  else
    update public.shots
    set status = 'draft', published_at = null
    where id = p_shot_id and creator_id = v_uid;
  end if;

  if not found then
    raise exception 'not_owner';
  end if;
end;
$$;

revoke all on function public.set_shot_tags(uuid, text[]) from public;
revoke all on function public.create_shot(text, text, text, text[], text) from public;
revoke all on function public.update_shot(uuid, text, text, text, text[], text) from public;
revoke all on function public.set_shot_status(uuid, text) from public;

grant execute on function public.create_shot(text, text, text, text[], text)
  to authenticated;
grant execute on function public.update_shot(uuid, text, text, text, text[], text)
  to authenticated;
grant execute on function public.set_shot_status(uuid, text)
  to authenticated;

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.shots enable row level security;
alter table public.shot_tags enable row level security;

drop policy if exists "categories are publicly readable" on public.categories;
create policy "categories are publicly readable"
on public.categories
for select
using (true);

drop policy if exists "tags are publicly readable" on public.tags;
create policy "tags are publicly readable"
on public.tags
for select
using (true);

drop policy if exists "shot tags are publicly readable" on public.shot_tags;
create policy "shot tags are publicly readable"
on public.shot_tags
for select
using (true);

drop policy if exists "published shots are public, drafts are private" on public.shots;
create policy "published shots are public, drafts are private"
on public.shots
for select
using (
  status = 'published'
  or creator_id = (select auth.uid())
);

drop policy if exists "creators insert their own shots" on public.shots;
create policy "creators insert their own shots"
on public.shots
for insert
with check (creator_id = (select auth.uid()));

drop policy if exists "creators update their own shots" on public.shots;
create policy "creators update their own shots"
on public.shots
for update
using (creator_id = (select auth.uid()))
with check (creator_id = (select auth.uid()));

drop policy if exists "creators delete their own shots" on public.shots;
create policy "creators delete their own shots"
on public.shots
for delete
using (creator_id = (select auth.uid()));

-- Tags and shot_tags have no write policies: only the security definer RPCs above
-- can write them.

-- Table privileges. Shots are readable by everyone, deletable by their owner
-- through RLS, and written only through the RPCs above. Categories and tags are
-- read-only to clients.
revoke all on public.categories from anon, authenticated;
grant select on public.categories to anon, authenticated;

revoke all on public.tags from anon, authenticated;
grant select on public.tags to anon, authenticated;

revoke all on public.shot_tags from anon, authenticated;
grant select on public.shot_tags to anon, authenticated;

revoke all on public.shots from anon, authenticated;
grant select on public.shots to anon, authenticated;
grant delete on public.shots to authenticated;
