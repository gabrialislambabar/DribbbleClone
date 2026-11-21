-- 0013_saved_designs.sql
-- Bookmarks for stock/CC imagery used by the design discovery gallery.
--
-- Only metadata needed to redisplay and credit an item is stored. Images are
-- never downloaded or rehosted: image_url points at the provider's CDN.

begin;

create table if not exists public.saved_designs (
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null,
  source_item_id text not null,
  title text not null,
  category text not null,
  image_url text not null,
  thumbnail_url text,
  source_url text not null,
  creator_name text,
  creator_url text,
  license_name text,
  license_url text,
  saved_at timestamptz not null default now(),
  primary key (user_id, source, source_item_id),
  constraint saved_designs_source_check
    check (source in ('pexels', 'unsplash', 'openverse', 'pixabay')),
  constraint saved_designs_title_len
    check (char_length(btrim(title)) between 1 and 200),
  constraint saved_designs_category_len
    check (char_length(btrim(category)) between 1 and 40)
);

create index if not exists saved_designs_user_saved_idx
  on public.saved_designs (user_id, saved_at desc);

alter table public.saved_designs enable row level security;

drop policy if exists "users read their own saved designs" on public.saved_designs;
create policy "users read their own saved designs"
on public.saved_designs
for select
using (user_id = (select auth.uid()));

drop policy if exists "users save designs as themselves" on public.saved_designs;
create policy "users save designs as themselves"
on public.saved_designs
for insert
with check (user_id = (select auth.uid()));

drop policy if exists "users delete their own saved designs" on public.saved_designs;
create policy "users delete their own saved designs"
on public.saved_designs
for delete
using (user_id = (select auth.uid()));

revoke all on public.saved_designs from anon, authenticated;
grant select on public.saved_designs to authenticated;
grant insert (
  user_id,
  source,
  source_item_id,
  title,
  category,
  image_url,
  thumbnail_url,
  source_url,
  creator_name,
  creator_url,
  license_name,
  license_url
) on public.saved_designs to authenticated;
grant delete on public.saved_designs to authenticated;

notify pgrst, 'reload schema';

commit;
