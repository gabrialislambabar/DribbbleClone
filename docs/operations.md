# Operations

## Migrations

Apply in order with `npx supabase db push` (preferred) or the SQL editor:

1. `0001_profiles.sql`
2. `0002_storage_buckets.sql`
3. `0003_shots.sql`
4. `0004_social.sql`
5. `0005_search.sql`
6. `0006_feed_functions.sql`
7. `0007_external_covers.sql`
8. `0008_rate_limits.sql`
9. `0009_reports.sql` — `is_admin`, `reports`, moderation RLS
10. `0010_notifications.sql` — notifications, preferences, triggers, publication
11. `0011_realtime_authorization.sql` — private shot channel policies

Review before applying:

```bash
npx supabase db push --dry-run
```

After schema changes, regenerate types with `npm run db:types` (requires `SUPABASE_PROJECT_ID` and a logged-in CLI) or update `lib/types/database.ts` by hand to match the migration.

## Verify the environment before seeding

```bash
npm run check:env
```

It decodes the anon and service-role keys and fails when either key belongs to a
different Supabase project than `NEXT_PUBLIC_SUPABASE_URL`, then probes the app
tables. Fix what it reports instead of debugging a mid-seed `401`. `npm run seed`
and `npm run seed:unsplash` run the same preflight.

## Environment

Per environment (development, preview, production):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # server-only
NEXT_PUBLIC_SITE_URL
SUPABASE_PROJECT_ID            # db:types only
SENTRY_DSN                     # optional
NEXT_PUBLIC_SENTRY_DSN         # optional
SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN  # source-map upload only
```

Never reuse a service-role key across environments. Preview deployments should point at a separate Supabase project or branch, not production.

## Rate limits

Configured in `lib/rate-limit/config.ts`:

| Action                      | Limit       |
| --------------------------- | ----------- |
| sign-in (per IP)            | 10 / 10 min |
| sign-up (per IP)            | 5 / hour    |
| Unsplash search (per IP)    | 20 / min    |
| public search page (per IP) | 60 / min    |
| create shot                 | 10 / hour   |
| update shot                 | 30 / hour   |
| publish/unpublish           | 60 / hour   |
| delete shot                 | 30 / hour   |
| profile update              | 10 / hour   |
| account delete              | 3 / hour    |
| like                        | 60 / min    |
| comment                     | 10 / min    |
| comment edit                | 20 / min    |
| comment delete              | 30 / min    |
| follow                      | 30 / min    |
| report                      | 10 / hour   |

Authenticated limits are stored in `public.rate_limits` through `consume_rate_limit`. Anonymous limits are in-memory per server instance; they reset on deploy and are not shared across instances.

## Realtime

1. In Supabase Dashboard → Database → Replication/Realtime, enable Realtime for the project.
2. `0010` adds `public.notifications` to the `supabase_realtime` publication when it exists.
3. `0011` installs the `realtime.messages` SELECT policy for private `shot:<id>` channels. Do not add an INSERT policy; publishing is service-role only.
4. Client subscriptions use `{ config: { private: true } }`. The notification bell uses Postgres Changes filtered by `recipient_id`.

If Realtime is unavailable, the app degrades to server-rendered data; subscriptions fail silently and mutations still work.

## Notifications

- Follows and comments insert rows through `security definer` triggers; self-actions are skipped.
- Preferences default to enabled when no row exists. Unchecking a preference affects future events only; existing notifications remain.
- The header badge loads the unread count server-side and updates live through Postgres Changes. Opening an item marks it read; "Mark all read" updates every unread row.
- Notification pages are per-user and must stay dynamic. Never wrap them in `unstable_cache`.

## Moderation

Reports are visible to moderators at `/moderation`.

Bootstrap the first admin in the SQL editor:

```sql
update public.profiles set is_admin = true where username = '<username>';
```

`is_admin` is intentionally excluded from the column-level update grant, so users cannot promote themselves. Admin actions are logged through `logWarn` with the report id, target type, and admin id — never the reported content.

Take-down behavior:

- Shot → set to `draft` and clear `published_at` (reversible, no storage deletion).
- Comment → hard delete and revalidate the shot page.
- Profile → not supported in this version; dismiss the report instead.

## Sentry

- Error capture only (`tracesSampleRate: 0`), no session replay.
- `beforeSend` strips request cookies, sensitive headers, user email/IP, and sensitive extra keys; breadcrumbs containing auth or token URLs are dropped.
- `dataCollection` is configured to exclude cookies, request bodies, and sensitive headers.
- Without a DSN the SDK is initialized disabled; builds still succeed. Source-map upload requires `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN`, and is skipped when the token is absent.

## Health and monitoring

`GET /api/health` returns `200 { ok: true }` when the public Supabase client can read a category row, and `503` when Supabase is unconfigured or unreachable. Point uptime monitoring at it.

Watch: action error rates, `/api/unsplash/search` 5xx/429 rates, rate-limit warnings, feed/search latency, and Realtime channel errors (captured as breadcrumbs).

## Backups and restore

- Supabase managed backups depend on the plan. Free-tier projects are not a durable backup.
- Before risky migrations: `npx supabase db dump -f backup.sql`.
- Storage is not included in database backups. Copy `avatars` and `shot-covers` separately.
- Test restores into a separate staging project before relying on them.

## Caching and connection use

- Public feed/search reads use `unstable_cache` (60s, tags `shots:feed` / `profiles:public`) through the cookie-free public client.
- Per-user state (likes, follows, notifications) is fetched outside the cache.
- Mutations revalidate tags/paths; realtime is additive and never required for consistency.
- Supabase manages pooling. Use the pooler connection string for external scripts and `pg_dump` when the direct connection is not available.

## Deferred background work

- Orphaned storage objects: uploads are cleaned up on RPC/DB failure today. A periodic job could list bucket objects and remove paths not referenced by `shots.cover_image_path` or `profiles.avatar_path`.
- Image resizing: `next/image` handles display sizes; Supabase Storage transformations can produce thumbnails if the CDN cost becomes a problem.
- Email notifications require a provider (for example Resend) plus a verified webhook, idempotent delivery, and unsubscribe handling. Not implemented.
- Moderation queue aging alerts and automated spam scoring are future work.

## Deployment checklist

1. Apply migrations in a staging project and run `npm run build`.
2. Verify `/api/health` returns 200.
3. Sign in, create/publish a shot, like/comment/follow, and confirm the feed revalidates.
4. Open two browsers on the same shot; confirm live comments/counts if Realtime is enabled.
5. Report a comment, resolve it as the bootstrap admin.
6. Confirm Sentry receives a test error and that cookies/email are absent.
7. Run `npm run test:e2e` against the staging URL (`PLAYWRIGHT_BASE_URL=...`).
