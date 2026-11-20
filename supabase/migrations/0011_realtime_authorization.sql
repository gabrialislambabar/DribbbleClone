-- 0011_realtime_authorization.sql
-- Authorize private shot broadcast channels. Clients may only read; the app
-- publishes through the Realtime REST API with the service role.

begin;

alter table realtime.messages enable row level security;

drop policy if exists "shot rooms are readable by viewers" on realtime.messages;
create policy "shot rooms are readable by viewers"
on realtime.messages
for select
to anon, authenticated
using (
  realtime.topic() ~* '^shot:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.shots s
    where s.id = split_part(realtime.topic(), ':', 2)::uuid
      and (s.status = 'published' or s.creator_id = (select auth.uid()))
  )
);

-- No insert policy: authenticated/anon clients cannot publish into a room.
-- Server Actions publish with the service role, which bypasses RLS.

notify pgrst, 'reload schema';

commit;
