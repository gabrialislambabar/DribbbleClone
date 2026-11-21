-- 0006_feed_functions.sql
-- Keyset-paginated feed, search, and follow-list read functions.

create or replace function public.shot_tags_json(p_shot_id uuid)
returns jsonb
language sql
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', t.id, 'name', t.name)
      order by t.name
    ),
    '[]'::jsonb
  )
  from public.shot_tags st
  join public.tags t on t.id = st.tag_id
  where st.shot_id = p_shot_id;
$$;

-- ---------------------------------------------------------------------------
-- Feed
-- ---------------------------------------------------------------------------

create or replace function public.get_shots_feed(
  p_sort text default 'newest',
  p_category_id text default null,
  p_tag text default null,
  p_creator text default null,
  p_days integer default null,
  p_cursor_score double precision default null,
  p_cursor_time timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 25
)
returns table (
  id uuid,
  title text,
  cover_image_path text,
  category_id text,
  category_name text,
  creator_id uuid,
  creator_username text,
  creator_display_name text,
  creator_avatar_path text,
  published_at timestamptz,
  like_count integer,
  comment_count integer,
  rank_score double precision,
  tags jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sort text := lower(coalesce(nullif(btrim(p_sort), ''), 'newest'));
  v_days integer := p_days;
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 51);
begin
  if v_sort not in ('newest', 'popular', 'trending') then
    v_sort := 'newest';
  end if;

  if v_days is not null and v_days not in (7, 30, 90) then
    v_days := null;
  end if;

  if v_sort = 'newest' then
    return query
    select
      s.id,
      s.title,
      s.cover_image_path,
      s.category_id,
      c.name as category_name,
      s.creator_id,
      p.username as creator_username,
      p.display_name as creator_display_name,
      p.avatar_path as creator_avatar_path,
      s.published_at,
      s.like_count,
      s.comment_count,
      null::double precision as rank_score,
      public.shot_tags_json(s.id) as tags
    from public.shots s
    join public.profiles p on p.id = s.creator_id
    join public.categories c on c.id = s.category_id
    where s.status = 'published'
      and (p_category_id is null or s.category_id = p_category_id)
      and (
        p_creator is null
        or s.creator_id = (
          select p2.id
          from public.profiles p2
          where lower(p2.username) = lower(btrim(p_creator))
        )
      )
      and (
        p_tag is null
        or exists (
          select 1
          from public.shot_tags st
          join public.tags t on t.id = st.tag_id
          where st.shot_id = s.id
            and lower(t.name) = lower(btrim(p_tag))
        )
      )
      and (
        p_cursor_time is null
        or (s.published_at, s.id) < (p_cursor_time, p_cursor_id)
      )
    order by s.published_at desc, s.id desc
    limit (v_limit + 1);

  elsif v_sort = 'popular' and v_days is null then
    return query
    select
      s.id,
      s.title,
      s.cover_image_path,
      s.category_id,
      c.name as category_name,
      s.creator_id,
      p.username as creator_username,
      p.display_name as creator_display_name,
      p.avatar_path as creator_avatar_path,
      s.published_at,
      s.like_count,
      s.comment_count,
      s.like_count::double precision as rank_score,
      public.shot_tags_json(s.id) as tags
    from public.shots s
    join public.profiles p on p.id = s.creator_id
    join public.categories c on c.id = s.category_id
    where s.status = 'published'
      and (p_category_id is null or s.category_id = p_category_id)
      and (
        p_creator is null
        or s.creator_id = (
          select p2.id
          from public.profiles p2
          where lower(p2.username) = lower(btrim(p_creator))
        )
      )
      and (
        p_tag is null
        or exists (
          select 1
          from public.shot_tags st
          join public.tags t on t.id = st.tag_id
          where st.shot_id = s.id
            and lower(t.name) = lower(btrim(p_tag))
        )
      )
      and (
        p_cursor_score is null
        or (
          s.like_count::double precision,
          s.published_at,
          s.id
        ) < (p_cursor_score, p_cursor_time, p_cursor_id)
      )
    order by s.like_count desc, s.published_at desc, s.id desc
    limit (v_limit + 1);

  elsif v_sort = 'popular' then
    return query
    with window_likes as (
      select
        l.shot_id,
        count(*)::double precision as like_count_window
      from public.shot_likes l
      where l.created_at >= now() - make_interval(days => v_days)
      group by l.shot_id
    )
    select
      s.id,
      s.title,
      s.cover_image_path,
      s.category_id,
      c.name as category_name,
      s.creator_id,
      p.username as creator_username,
      p.display_name as creator_display_name,
      p.avatar_path as creator_avatar_path,
      s.published_at,
      s.like_count,
      s.comment_count,
      wl.like_count_window as rank_score,
      public.shot_tags_json(s.id) as tags
    from public.shots s
    join public.profiles p on p.id = s.creator_id
    join public.categories c on c.id = s.category_id
    join window_likes wl on wl.shot_id = s.id
    where s.status = 'published'
      and (p_category_id is null or s.category_id = p_category_id)
      and (
        p_creator is null
        or s.creator_id = (
          select p2.id
          from public.profiles p2
          where lower(p2.username) = lower(btrim(p_creator))
        )
      )
      and (
        p_tag is null
        or exists (
          select 1
          from public.shot_tags st
          join public.tags t on t.id = st.tag_id
          where st.shot_id = s.id
            and lower(t.name) = lower(btrim(p_tag))
        )
      )
      and (
        p_cursor_score is null
        or (
          wl.like_count_window,
          s.published_at,
          s.id
        ) < (p_cursor_score, p_cursor_time, p_cursor_id)
      )
    order by wl.like_count_window desc, s.published_at desc, s.id desc
    limit (v_limit + 1);

  else
    return query
    with recent_likes as (
      select
        l.shot_id,
        sum(
          1.0 / power(
            extract(epoch from (now() - l.created_at)) / 86400.0 + 2.0,
            1.5
          )
        )::double precision as score
      from public.shot_likes l
      where l.created_at >= now() - interval '7 days'
      group by l.shot_id
    )
    select
      s.id,
      s.title,
      s.cover_image_path,
      s.category_id,
      c.name as category_name,
      s.creator_id,
      p.username as creator_username,
      p.display_name as creator_display_name,
      p.avatar_path as creator_avatar_path,
      s.published_at,
      s.like_count,
      s.comment_count,
      rl.score as rank_score,
      public.shot_tags_json(s.id) as tags
    from public.shots s
    join public.profiles p on p.id = s.creator_id
    join public.categories c on c.id = s.category_id
    join recent_likes rl on rl.shot_id = s.id
    where s.status = 'published'
      and s.published_at >= now() - make_interval(days => coalesce(v_days, 30))
      and (p_category_id is null or s.category_id = p_category_id)
      and (
        p_creator is null
        or s.creator_id = (
          select p2.id
          from public.profiles p2
          where lower(p2.username) = lower(btrim(p_creator))
        )
      )
      and (
        p_tag is null
        or exists (
          select 1
          from public.shot_tags st
          join public.tags t on t.id = st.tag_id
          where st.shot_id = s.id
            and lower(t.name) = lower(btrim(p_tag))
        )
      )
      and (
        p_cursor_score is null
        or (rl.score, s.published_at, s.id) < (
          p_cursor_score,
          p_cursor_time,
          p_cursor_id
        )
      )
    order by rl.score desc, s.published_at desc, s.id desc
    limit (v_limit + 1);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Shot search
-- ---------------------------------------------------------------------------

create or replace function public.search_shots(
  p_query text,
  p_category_id text default null,
  p_creator text default null,
  p_cursor_rank double precision default null,
  p_cursor_time timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 21
)
returns table (
  id uuid,
  title text,
  cover_image_path text,
  category_id text,
  category_name text,
  creator_id uuid,
  creator_username text,
  creator_display_name text,
  creator_avatar_path text,
  published_at timestamptz,
  like_count integer,
  comment_count integer,
  rank_score double precision,
  tags jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_tsquery tsquery;
  v_limit integer := least(greatest(coalesce(p_limit, 21), 1), 51);
begin
  if char_length(v_query) < 2 or char_length(v_query) > 100 then
    return;
  end if;

  v_tsquery := websearch_to_tsquery('english', v_query);

  return query
  with matched as (
    select
      s.id,
      s.title,
      s.cover_image_path,
      s.category_id,
      c.name as category_name,
      s.creator_id,
      p.username as creator_username,
      p.display_name as creator_display_name,
      p.avatar_path as creator_avatar_path,
      s.published_at,
      s.like_count,
      s.comment_count,
      ts_rank_cd(s.search_vector, v_tsquery)::double precision as rank_value
    from public.shots s
    join public.profiles p on p.id = s.creator_id
    join public.categories c on c.id = s.category_id
    where s.status = 'published'
      and s.search_vector @@ v_tsquery
      and (p_category_id is null or s.category_id = p_category_id)
      and (
        p_creator is null
        or s.creator_id = (
          select p2.id
          from public.profiles p2
          where lower(p2.username) = lower(btrim(p_creator))
        )
      )
  )
  select
    m.id,
    m.title,
    m.cover_image_path,
    m.category_id,
    m.category_name,
    m.creator_id,
    m.creator_username,
    m.creator_display_name,
    m.creator_avatar_path,
    m.published_at,
    m.like_count,
    m.comment_count,
    m.rank_value as rank_score,
    public.shot_tags_json(m.id) as tags
  from matched m
  where (
    p_cursor_rank is null
    or (m.rank_value, m.published_at, m.id) < (
      p_cursor_rank,
      p_cursor_time,
      p_cursor_id
    )
  )
  order by m.rank_value desc, m.published_at desc, m.id desc
  limit (v_limit + 1);
end;
$$;

-- ---------------------------------------------------------------------------
-- Designer search
-- ---------------------------------------------------------------------------

create or replace function public.search_designers(
  p_query text,
  p_cursor_rank double precision default null,
  p_cursor_username text default null,
  p_limit integer default 21
)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_path text,
  bio text,
  follower_count integer,
  rank_score double precision
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_tsquery tsquery;
  v_limit integer := least(greatest(coalesce(p_limit, 21), 1), 51);
begin
  if char_length(v_query) < 2 or char_length(v_query) > 100 then
    return;
  end if;

  v_tsquery := websearch_to_tsquery('english', v_query);

  return query
  with matched as (
    select
      p.id,
      p.username,
      p.display_name,
      p.avatar_path,
      p.bio,
      p.follower_count,
      ts_rank_cd(p.search_vector, v_tsquery)::double precision as rank_value
    from public.profiles p
    where p.search_vector @@ v_tsquery
  )
  select
    m.id,
    m.username,
    m.display_name,
    m.avatar_path,
    m.bio,
    m.follower_count,
    m.rank_value as rank_score
  from matched m
  where (
    p_cursor_rank is null
    or m.rank_value < p_cursor_rank
    or (m.rank_value = p_cursor_rank and m.username > p_cursor_username)
  )
  order by m.rank_value desc, m.username asc
  limit (v_limit + 1);
end;
$$;

-- ---------------------------------------------------------------------------
-- Follow lists
-- ---------------------------------------------------------------------------

create or replace function public.get_followers(
  p_profile_id uuid,
  p_cursor_time timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 31
)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_path text,
  follower_count integer,
  following_count integer,
  is_following boolean,
  followed_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 31), 1), 51);
begin
  return query
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_path,
    p.follower_count,
    p.following_count,
    (
      v_uid is not null
      and exists (
        select 1
        from public.follows f2
        where f2.follower_id = v_uid
          and f2.following_id = p.id
      )
    ) as is_following,
    f.created_at as followed_at
  from public.follows f
  join public.profiles p on p.id = f.follower_id
  where f.following_id = p_profile_id
    and (
      p_cursor_time is null
      or (f.created_at, f.follower_id) < (p_cursor_time, p_cursor_id)
    )
  order by f.created_at desc, f.follower_id desc
  limit v_limit;
end;
$$;

create or replace function public.get_following(
  p_profile_id uuid,
  p_cursor_time timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 31
)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_path text,
  follower_count integer,
  following_count integer,
  is_following boolean,
  followed_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 31), 1), 51);
begin
  return query
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_path,
    p.follower_count,
    p.following_count,
    (
      v_uid is not null
      and exists (
        select 1
        from public.follows f2
        where f2.follower_id = v_uid
          and f2.following_id = p.id
      )
    ) as is_following,
    f.created_at as followed_at
  from public.follows f
  join public.profiles p on p.id = f.following_id
  where f.follower_id = p_profile_id
    and (
      p_cursor_time is null
      or (f.created_at, f.following_id) < (p_cursor_time, p_cursor_id)
    )
  order by f.created_at desc, f.following_id desc
  limit v_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function public.get_shots_feed(
  text, text, text, text, integer, double precision, timestamptz, uuid, integer
) from public;
grant execute on function public.get_shots_feed(
  text, text, text, text, integer, double precision, timestamptz, uuid, integer
) to anon, authenticated;

revoke all on function public.search_shots(
  text, text, text, double precision, timestamptz, uuid, integer
) from public;
grant execute on function public.search_shots(
  text, text, text, double precision, timestamptz, uuid, integer
) to anon, authenticated;

revoke all on function public.search_designers(
  text, double precision, text, integer
) from public;
grant execute on function public.search_designers(
  text, double precision, text, integer
) to anon, authenticated;

revoke all on function public.get_followers(
  uuid, timestamptz, uuid, integer
) from public;
grant execute on function public.get_followers(
  uuid, timestamptz, uuid, integer
) to anon, authenticated;

revoke all on function public.get_following(
  uuid, timestamptz, uuid, integer
) from public;
grant execute on function public.get_following(
  uuid, timestamptz, uuid, integer
) to anon, authenticated;

notify pgrst, 'reload schema';
