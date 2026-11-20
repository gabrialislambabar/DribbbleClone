-- 0007_external_covers.sql
-- Allow allow-listed Unsplash hotlinks alongside Supabase Storage paths, with
-- attribution stored on the shot and written atomically by the shot RPCs.

begin;

alter table public.shots drop constraint if exists shots_cover_path_owner;
alter table public.shots drop constraint if exists shots_cover_location;

alter table public.shots add constraint shots_cover_location check (
  cover_image_path ~ '^https://images\.unsplash\.com/'
  or split_part(cover_image_path, '/', 1) = creator_id::text
);

alter table public.shots
  add column if not exists cover_credit_name text,
  add column if not exists cover_credit_url text,
  add column if not exists cover_photo_url text,
  add column if not exists cover_source_id text,
  add column if not exists cover_provider text;

alter table public.shots drop constraint if exists shots_credit_name_len;
alter table public.shots add constraint shots_credit_name_len check (
  cover_credit_name is null
  or char_length(btrim(cover_credit_name)) between 1 and 100
);

alter table public.shots drop constraint if exists shots_credit_url_format;
alter table public.shots add constraint shots_credit_url_format check (
  cover_credit_url is null
  or cover_credit_url ~ '^https://unsplash\.com/@[A-Za-z0-9_-]+$'
);

alter table public.shots drop constraint if exists shots_photo_url_format;
alter table public.shots add constraint shots_photo_url_format check (
  cover_photo_url is null
  or cover_photo_url ~ '^https://unsplash\.com/photos/[A-Za-z0-9_-]+$'
);

alter table public.shots drop constraint if exists shots_source_id_format;
alter table public.shots add constraint shots_source_id_format check (
  cover_source_id is null
  or cover_source_id ~ '^[A-Za-z0-9_-]{5,30}$'
);

alter table public.shots drop constraint if exists shots_provider_check;
alter table public.shots add constraint shots_provider_check check (
  cover_provider is null or cover_provider = 'unsplash'
);

alter table public.shots drop constraint if exists shots_external_credit_required;
alter table public.shots add constraint shots_external_credit_required check (
  cover_image_path not like 'https://%'
  or (
    cover_credit_name is not null
    and cover_credit_url is not null
    and cover_photo_url is not null
    and cover_source_id is not null
    and cover_provider = 'unsplash'
  )
);

alter table public.shots drop constraint if exists shots_storage_cover_no_credits;
alter table public.shots add constraint shots_storage_cover_no_credits check (
  cover_image_path like 'https://%'
  or (
    cover_credit_name is null
    and cover_credit_url is null
    and cover_photo_url is null
    and cover_source_id is null
    and cover_provider is null
  )
);

-- The RPC signatures change, so drop and recreate them. Covers and credits are
-- written in one statement so the external-credit check never sees a partial row.
drop function if exists public.create_shot(text, text, text, text[], text);
drop function if exists public.update_shot(uuid, text, text, text, text[], text);

create function public.create_shot(
  p_title text,
  p_description text,
  p_category_id text,
  p_tags text[],
  p_cover_path text,
  p_cover_credit_name text default null,
  p_cover_credit_url text default null,
  p_cover_photo_url text default null,
  p_cover_source_id text default null,
  p_cover_provider text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_shot_id uuid;
  v_external boolean := p_cover_path like 'https://%';
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

  if v_external then
    if p_cover_path !~ '^https://images\.unsplash\.com/' then
      raise exception 'invalid_cover_url';
    end if;

    if p_cover_provider is distinct from 'unsplash'
       or p_cover_credit_name is null
       or p_cover_credit_url is null
       or p_cover_photo_url is null
       or p_cover_source_id is null then
      raise exception 'unsplash_credit_required';
    end if;
  end if;

  insert into public.shots (
    creator_id,
    category_id,
    title,
    description,
    cover_image_path,
    cover_credit_name,
    cover_credit_url,
    cover_photo_url,
    cover_source_id,
    cover_provider
  )
  values (
    v_uid,
    p_category_id,
    btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''),
    p_cover_path,
    case when v_external then p_cover_credit_name else null end,
    case when v_external then p_cover_credit_url else null end,
    case when v_external then p_cover_photo_url else null end,
    case when v_external then p_cover_source_id else null end,
    case when v_external then 'unsplash' else null end
  )
  returning id into v_shot_id;

  perform public.set_shot_tags(v_shot_id, p_tags);

  return v_shot_id;
end;
$$;

create function public.update_shot(
  p_shot_id uuid,
  p_title text,
  p_description text,
  p_category_id text,
  p_tags text[],
  p_cover_path text,
  p_cover_credit_name text default null,
  p_cover_credit_url text default null,
  p_cover_photo_url text default null,
  p_cover_source_id text default null,
  p_cover_provider text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_external boolean := p_cover_path like 'https://%';
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

  if v_external then
    if p_cover_path !~ '^https://images\.unsplash\.com/' then
      raise exception 'invalid_cover_url';
    end if;

    if p_cover_provider is distinct from 'unsplash'
       or p_cover_credit_name is null
       or p_cover_credit_url is null
       or p_cover_photo_url is null
       or p_cover_source_id is null then
      raise exception 'unsplash_credit_required';
    end if;
  end if;

  update public.shots
  set
    title = btrim(p_title),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    category_id = p_category_id,
    cover_image_path = p_cover_path,
    cover_credit_name = case when v_external then p_cover_credit_name else null end,
    cover_credit_url = case when v_external then p_cover_credit_url else null end,
    cover_photo_url = case when v_external then p_cover_photo_url else null end,
    cover_source_id = case when v_external then p_cover_source_id else null end,
    cover_provider = case when v_external then 'unsplash' else null end
  where id = p_shot_id and creator_id = v_uid;

  perform public.set_shot_tags(p_shot_id, p_tags);
end;
$$;

revoke all on function public.create_shot(
  text, text, text, text[], text, text, text, text, text, text
) from public;
grant execute on function public.create_shot(
  text, text, text, text[], text, text, text, text, text, text
) to authenticated;

revoke all on function public.update_shot(
  uuid, text, text, text, text[], text, text, text, text, text, text
) from public;
grant execute on function public.update_shot(
  uuid, text, text, text, text[], text, text, text, text, text, text
) to authenticated;

notify pgrst, 'reload schema';

commit;
