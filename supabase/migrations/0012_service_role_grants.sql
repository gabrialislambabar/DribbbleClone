-- 0012_service_role_grants.sql
-- Grant the service role access to the app schema.
--
-- Projects created with the newer Supabase API keys can have tables whose
-- default privileges omit service_role. Auth/Storage still work, but PostgREST
-- returns "42501 permission denied for table" and seeding/admin tasks fail.
-- Safe to re-run.

begin;

grant usage on schema public to service_role;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant execute on functions to service_role;

notify pgrst, 'reload schema';

commit;
