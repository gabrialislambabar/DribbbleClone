# DribbbleClone

A Dribbble-style community for designers to share shots, build a public profile, and discover work. Built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase (Postgres, Auth, Storage).

## What is implemented

- Email + password signup and signin with Supabase Auth, confirmation email, and session refresh via `proxy.ts`.
- Auto-created `profiles` rows, public designer pages, profile editing, avatar upload, and account deletion.
- Design shots with category, tags, cover image, drafts, publish/unpublish, and hard delete with storage cleanup.
- Postgres constraints, RLS on every table, and `security definer` RPCs for atomic shot + tag writes.

Deferred: likes, comments, follows, search, sorting beyond newest, notifications, realtime, moderation, admin UI, password reset, production deployment wiring.

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

Or link the CLI and push: `npx supabase link --project-ref <ref>` then `npx supabase db push`.

The migrations create the `profiles`, `categories`, `tags`, `shots`, and `shot_tags` tables, the signup trigger, the `avatars` and `shot-covers` buckets, storage policies, RLS policies, and the shot RPCs.

### 5. Database types (optional)

```bash
npx supabase login
npm run db:types
```

A hand-written `lib/types/database.ts` matching the migrations is checked in, so this is only needed after schema changes.

### 6. Run

```bash
npm run dev
```

Visit http://localhost:3000.

## Scripts

| Script                 | Purpose                   |
| ---------------------- | ------------------------- |
| `npm run dev`          | Start the dev server      |
| `npm run build`        | Production build          |
| `npm run lint`         | ESLint                    |
| `npm run typecheck`    | `tsc --noEmit`            |
| `npm run format`       | Prettier write            |
| `npm run format:check` | Prettier check            |
| `npm run db:types`     | Regenerate Supabase types |

## Architecture notes

- **Reads** happen in Server Components through `lib/data/*`.
- **Mutations** go through Server Actions in `app/**/actions.ts`, validated with zod on the server.
- **Authorization** is enforced twice: server code derives identity from `supabase.auth.getUser()`, and Postgres RLS/RPC checks constrain what the JWT can actually change.
- **Images** are uploaded through Server Actions to Supabase Storage. The database stores object paths only (`cover_image_path`, `avatar_path`); public URLs are constructed at render time.
- **Shot publication** tracks `created_at`, `updated_at`, and `published_at` separately. Publishing sets `published_at = now()` only on the draft → published transition, so editing a live shot does not move it in the feed. Unpublishing clears it.
- **Account deletion** uses the service-role client to remove storage objects before deleting the auth user, which cascades the profile, shots, and tag links.
- **Proxy** (`proxy.ts`, Next.js 16's name for middleware) refreshes Supabase cookies and performs optimistic redirects for protected routes. Every Server Action still checks the session itself.
