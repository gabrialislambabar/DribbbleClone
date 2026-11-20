-- 0005_search.sql
-- Full-text search over shots and designers, plus feed indexes.

-- ---------------------------------------------------------------------------
-- Shot tags text + search vector
-- ---------------------------------------------------------------------------

alter table public.shots
  add column if not exists tags_text text not null default '';

create or replace function public.refresh_shot_tags_text()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shot_id uuid;
begin
  if tg_op = 'DELETE' then
    v_shot_id := old.shot_id;
  else
    v_shot_id := new.shot_id;
  end if;

  update public.shots s
  set tags_text = coalesce(
    (
      select string_agg(t.name, ' ' order by t.name)
      from public.shot_tags st
      join public.tags t on t.id = st.tag_id
      where st.shot_id = v_shot_id
    ),
    ''
  )
  where s.id = v_shot_id;

  return null;
end;
$$;

drop trigger if exists shot_tags_refresh_text on public.shot_tags;
create trigger shot_tags_refresh_text
after insert or delete or update on public.shot_tags
for each row
execute function public.refresh_shot_tags_text();

update public.shots s
set tags_text = tt.tags_text
from (
  select
    s2.id,
    coalesce(
      (
        select string_agg(t.name, ' ' order by t.name)
        from public.shot_tags st
        join public.tags t on t.id = st.tag_id
        where st.shot_id = s2.id
      ),
      ''
    ) as tags_text
  from public.shots s2
) tt
where s.id = tt.id
  and s.tags_text is distinct from tt.tags_text;

alter table public.shots
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(tags_text, '')), 'C')
  ) stored;

create index if not exists shots_search_vector_idx
  on public.shots using gin (search_vector);

-- ---------------------------------------------------------------------------
-- Designer search vector
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(display_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'C')
  ) stored;

create index if not exists profiles_search_vector_idx
  on public.profiles using gin (search_vector);

-- ---------------------------------------------------------------------------
-- Feed and filter indexes
-- ---------------------------------------------------------------------------

drop index if exists public.shots_feed_idx;

create index if not exists shots_published_newest_idx
  on public.shots (published_at desc, id desc)
  where status = 'published';

create index if not exists shots_published_popular_idx
  on public.shots (like_count desc, published_at desc, id desc)
  where status = 'published';

create index if not exists shots_published_category_idx
  on public.shots (category_id, published_at desc, id desc)
  where status = 'published';

create index if not exists shots_published_creator_idx
  on public.shots (creator_id, published_at desc, id desc)
  where status = 'published';

create index if not exists shot_tags_tag_shot_idx
  on public.shot_tags (tag_id, shot_id);
