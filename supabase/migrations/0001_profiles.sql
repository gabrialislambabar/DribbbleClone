-- 0001_profiles.sql
-- Application profile data linked one-to-one to Supabase Auth users.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  bio text,
  portfolio_url text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$'),
  constraint profiles_display_name_len check (
    char_length(btrim(display_name)) between 1 and 60
  ),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 300),
  constraint profiles_portfolio_url check (
    portfolio_url is null
    or (
      char_length(portfolio_url) <= 500
      and portfolio_url ~* '^https?://[^\s]+$'
    )
  ),
  constraint profiles_avatar_path_owner check (
    avatar_path is null
    or split_part(avatar_path, '/', 1) = id::text
  )
);

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Creates the profile row whenever Supabase Auth creates an account.
-- The signup form passes username and display_name in auth metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
  v_display_name text;
begin
  v_username := lower(
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
      'designer_' || substr(replace(new.id::text, '-', ''), 1, 10)
    )
  );

  v_display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    'Designer'
  );

  insert into public.profiles (id, username, display_name)
  values (new.id, v_username, v_display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable"
on public.profiles
for select
using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Usernames are public URLs and are fixed after signup.
create or replace function public.prevent_username_change()
returns trigger
language plpgsql
as $$
begin
  if new.username is distinct from old.username then
    raise exception 'username_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_username_immutable on public.profiles;
create trigger profiles_username_immutable
before update on public.profiles
for each row
execute function public.prevent_username_change();

-- Profiles are publicly readable. Owners may update only mutable public fields;
-- inserts and deletes stay server-side.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (display_name, bio, portfolio_url, avatar_path)
  on public.profiles to authenticated;

-- No insert or delete policies: the signup trigger creates rows, and account
-- deletion runs through the service role.
