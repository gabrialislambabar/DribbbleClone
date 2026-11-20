-- 0009_reports.sql
-- User reports and a minimal admin moderation surface.

begin;

-- ---------------------------------------------------------------------------
-- Admin flag
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin(p_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = p_uid),
    false
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type text not null,
  shot_id uuid references public.shots (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_target_type_check check (
    target_type in ('shot', 'comment', 'profile')
  ),
  constraint reports_reason_check check (
    reason in ('spam', 'abuse', 'copyright', 'other')
  ),
  constraint reports_status_check check (
    status in ('open', 'reviewed', 'dismissed', 'actioned')
  ),
  constraint reports_details_len check (
    details is null or char_length(details) <= 1000
  ),
  constraint reports_resolution_note_len check (
    resolution_note is null or char_length(resolution_note) <= 500
  ),
  constraint reports_target_matches check (
    (target_type = 'shot' and shot_id is not null and comment_id is null and profile_id is null)
    or (target_type = 'comment' and comment_id is not null and shot_id is null and profile_id is null)
    or (target_type = 'profile' and profile_id is not null and shot_id is null and comment_id is null)
  )
);

create unique index if not exists reports_reporter_shot_key
  on public.reports (reporter_id, shot_id)
  where shot_id is not null;

create unique index if not exists reports_reporter_comment_key
  on public.reports (reporter_id, comment_id)
  where comment_id is not null;

create unique index if not exists reports_reporter_profile_key
  on public.reports (reporter_id, profile_id)
  where profile_id is not null;

create index if not exists reports_status_created_idx
  on public.reports (status, created_at asc);

create index if not exists reports_reporter_created_idx
  on public.reports (reporter_id, created_at desc);

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row
execute function public.set_updated_at();

alter table public.reports enable row level security;

drop policy if exists "users report visible content as themselves" on public.reports;
create policy "users report visible content as themselves"
on public.reports
for insert
with check (
  reporter_id = (select auth.uid())
  and (
    (
      target_type = 'shot'
      and exists (
        select 1
        from public.shots s
        where s.id = shot_id
          and (s.status = 'published' or s.creator_id = (select auth.uid()))
      )
    )
    or (
      target_type = 'comment'
      and exists (
        select 1
        from public.comments c
        join public.shots s on s.id = c.shot_id
        where c.id = comment_id
          and (
            s.status = 'published'
            or s.creator_id = (select auth.uid())
            or c.author_id = (select auth.uid())
          )
      )
    )
    or (
      target_type = 'profile'
      and exists (
        select 1 from public.profiles p where p.id = profile_id
      )
    )
  )
);

drop policy if exists "users read their own reports" on public.reports;
create policy "users read their own reports"
on public.reports
for select
using (
  reporter_id = (select auth.uid())
  or public.is_admin()
);

drop policy if exists "admins resolve reports" on public.reports;
create policy "admins resolve reports"
on public.reports
for update
using (public.is_admin())
with check (public.is_admin());

revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant insert (reporter_id, target_type, shot_id, comment_id, profile_id, reason, details)
  on public.reports to authenticated;
grant update (status, resolution_note, resolved_by, resolved_at)
  on public.reports to authenticated;

notify pgrst, 'reload schema';

commit;
