# DribbbleClone

A Dribbble-style community for designers to share shots, build a public profile, and discover work. Built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase (Postgres, Auth, Storage).

## What is implemented

- Email + password signup and signin with Supabase Auth, confirmation email, and session refresh via `proxy.ts`.
- Auto-created `profiles` rows, public designer pages, profile editing, avatar upload, and account deletion.
- Design shots with category, tags, cover image, drafts, publish/unpublish, and hard delete with storage cleanup.
- **Feeds**: Newest, Popular, and Trending with category/tag/creator filters, 7/30/90-day presets, and keyset (cursor) pagination.
- **Search**: Postgres full-text search across shot titles, descriptions, and tags, plus designer username/display name/bio.
- **Social**: likes with unique one-per-user constraints, flat comments with author/owner moderation, follows, and denormalized counts.
- **Caching**: public feed/search query results are cached with tags for 60 seconds and invalidated immediately on mutations; liked/following state stays per-request.
- Postgres constraints, RLS on every table, and `security definer` RPCs for atomic shot + tag writes and aggregate feed reads.

Deferred: notifications, bookmarks/collections, realtime, moderation tools, admin UI, password reset, and an external search service.

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Authentication → Providers → Email: keep it enabled and keep **Confirm email** on.
3. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/**`

### 3. Environment

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or sb_publishable_ key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_PROJECT_ID=<project-ref>
```

### 4. Run the migrations

Open the Supabase SQL editor and run, in order:

1. `supabase/migrations/0001_profiles.sql`
2. `supabase/migrations/0002_storage_buckets.sql`
3. `supabase/migrations/0003_shots.sql`
4. `supabase/migrations/0004_social.sql`
5. `supabase/migrations/0005_search.sql`
6. `supabase/migrations/0006_feed_functions.sql`

Or link the CLI and push: `npx supabase link --project-ref <ref>` then `npx supabase db push`.

Migrations 0004–0006 add likes, comments, follows, counters, full-text search vectors, feed/search RPCs, and the indexes those queries rely on. Runner notes:

- 0004–0006 are safe to re-run (they use `if not exists` / `create or replace`).
- The counter backfill only touches rows whose counts differ, so re-running does not churn `updated_at`.
- Feed RPCs are `security definer` because they aggregate other users' likes; they always filter `status = 'published'`.

### 5. Seed demo data (optional)

```bash
npm run seed
```

The seed script uses the service-role key, is idempotent, and refuses to run against a non-local `NEXT_PUBLIC_SITE_URL` unless `--force` is passed. It creates:

- 3 designers (`maya@example.com`, `leo@example.com`, `sana@example.com`) and 3 community accounts (`alex@example.com`, `nina@example.com`, `omar@example.com`), password `password123`.
- 12 published shots with staggered dates, tags, likes, and comments, so Newest, Popular, and Trending all differ.
- Follow relationships and profile bios.

**Never point the seed script at production.** It deletes and recreates the demo shots on each run.

### 6. Database types (optional)

```bash
npx supabase login
npm run db:types
```

A hand-written `lib/types/database.ts` matching the migrations is checked in, so this is only needed after schema changes.

### 7. Run

```bash
npm run dev
```

Visit http://localhost:3000.

## Scripts

| Script                 | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start the dev server                    |
| `npm run build`        | Production build                        |
| `npm run lint`         | ESLint                                  |
| `npm run typecheck`    | `tsc --noEmit`                          |
| `npm run format`       | Prettier write                          |
| `npm run format:check` | Prettier check                          |
| `npm run db:types`     | Regenerate Supabase types               |
| `npm run seed`         | Seed demo users, shots, and social data |

## Feed and search semantics

- **Newest**: `published_at DESC, id DESC`, regardless of time presets.
- **Popular**: all-time like count by default. Choosing a 7/30/90-day preset ranks by likes received in that window.
- **Trending**: `score = Σ 1 / ((hours_since_like / 24) + 2)^1.5` over likes from the last 7 days; only shots published within the selected window (default 30 days).
- All sorts use a unique tie-breaker (`published_at`, then `id`) and opaque keyset cursors, so pages do not duplicate or skip rows.
- Search ranks with `ts_rank_cd`, requires 2–100 characters, and supports category/creator filters on the shots tab.
- Invalid `sort`/`days` values fall back to defaults; unknown filters produce the empty state.

## Architecture notes

- **Reads** happen in Server Components through `lib/data/*`.
- **Mutations** go through Server Actions in `app/**/actions.ts`, validated with zod on the server.
- **Authorization** is enforced twice: server code derives identity from `supabase.auth.getUser()`, and Postgres RLS/RPC checks constrain what the JWT can actually change.
- **Images** are uploaded through Server Actions to Supabase Storage. The database stores object paths only (`cover_image_path`, `avatar_path`); public URLs are constructed at render time.
- **Shot publication** tracks `created_at`, `updated_at`, and `published_at` separately. Publishing sets `published_at = now()` only on the draft → published transition, so editing a live shot does not move it in the feed. Unpublishing clears it.
- **Counts** (`like_count`, `comment_count`, `follower_count`, `following_count`) are maintained by `security definer` triggers in the same transaction as the social write; clients cannot update the counter columns directly.
- **Likes** are one row per `(user_id, shot_id)`; only published shots can be liked, users can only read their own like rows, and counts are exposed on `shots`.
- **Comments** are flat, 1–1,000 characters, oldest-first. Authors edit/delete their own; shot owners can delete comments on their shots.
- **Follows** block self-follows with a check constraint and maintain both sides' counters with triggers.
- **Search** uses generated `tsvector` columns with GIN indexes. Shot tags feed `tags_text`, which is rebuilt by a trigger on `shot_tags`.
- **Caching**: feed/search queries run through `lib/supabase/public.ts` (no cookies) inside `unstable_cache` with tags (`shots:feed`, `profiles:public`) and a 60-second lifetime. Mutations call `revalidateTag(tag, { expire: 0 })` for immediate read-your-own-writes. Per-user liked/following state is fetched outside the cache.
- **Account deletion** uses the service-role client to remove storage objects before deleting the auth user, which cascades profiles, shots, likes, comments, and follows.
- **Proxy** (`proxy.ts`, Next.js 16's name for middleware) refreshes Supabase cookies and performs optimistic redirects for protected routes. Every Server Action still checks the session itself.

## Backup and restore expectations

- Supabase managed backups: daily backups are available on paid plans, with point-in-time recovery on plans that include it. Free-tier projects should not be treated as durable backups.
- Before applying migrations or doing risky data work, take a logical backup:
  ```bash
  npx supabase db dump -f backup.sql
  ```
  Or use `pg_dump` with the project's direct connection string.
- **Storage is not part of a database backup.** Copy `avatars` and `shot-covers` objects separately (dashboard export, `rclone`, or a scheduled job) if they are not reproducible.
- Test restores into a separate staging project; a backup is only useful once a restore has succeeded.
- Document your target RPO/RTO. This app treats the database as the source of truth, storage as durable user content, and the seed script as local-only data.
- SQL migrations are the reviewable record of schema changes; do not edit production schema by hand.

## Testing the social features

1. `npm run seed`, then sign in as `maya@example.com` / `password123`.
2. Home: switch Newest/Popular/Trending, filter by category/tag/designer, load more, like/unlike.
3. Search: search “dashboard” (shots) and “maya” (designers), test a 1-character query and a 101-character query.
4. Shot detail: like, comment, edit your comment, delete it; sign in as the shot owner and delete someone else's comment.
5. Profile: follow/unfollow, open followers/following lists, load more.
6. Signed-out window: likes/comments/follows show read-only or sign-in prompts; drafts and draft comments stay hidden.
