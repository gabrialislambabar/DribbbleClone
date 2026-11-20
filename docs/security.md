# Security model

This app is a Next.js App Router frontend over Supabase (Postgres, Auth, Storage). Every mutation path is treated as a public endpoint: it re-derives identity on the server, validates input, and relies on Postgres for the final authorization decision.

## Server Actions

| Action                                              | Auth      | Rate limit      | Validation / authorization                                                                          |
| --------------------------------------------------- | --------- | --------------- | --------------------------------------------------------------------------------------------------- |
| `signUp`                                            | anonymous | `signUp` per IP | zod `signUpSchema`; username uniqueness check; Supabase Auth                                        |
| `signIn`                                            | anonymous | `auth` per IP   | zod `signInSchema`; generic credential error                                                        |
| `signOut`                                           | required  | —               | Session-only                                                                                        |
| `createShot`                                        | required  | `shotCreate`    | zod `shotFieldsSchema`; MIME/size check; `create_shot` RPC enforces ownership + category + tags     |
| `updateShot`                                        | required  | `shotUpdate`    | zod; pre-select filtered by `creator_id`; `update_shot` RPC re-checks ownership                     |
| `publishShot` / `unpublishShot`                     | required  | `shotStatus`    | `set_shot_status` RPC checks `creator_id`                                                           |
| `deleteShot`                                        | required  | `shotDelete`    | Select + delete filtered by `creator_id`; storage removal after the DB delete                       |
| `updateProfile`                                     | required  | `profileUpdate` | zod; avatar MIME/size; explicit column update (no mass assignment)                                  |
| `deleteAccount`                                     | required  | `accountDelete` | Username confirmation; storage cleanup then service-role user delete (cascades)                     |
| `toggleLike`                                        | required  | `like`          | UUID validation; RLS allows only published shots and one like per user                              |
| `addComment`                                        | required  | `comment`       | zod 1–1000 chars; RLS only published shots                                                          |
| `editComment`                                       | required  | `commentEdit`   | zod; update filtered by `author_id`                                                                 |
| `deleteComment`                                     | required  | `commentDelete` | RLS permits the author or the shot owner                                                            |
| `followProfile` / `unfollowProfile`                 | required  | `follow`        | UUID validation; self-follow blocked by a check constraint; RLS requires `follower_id = auth.uid()` |
| `reportContent`                                     | required  | `report`        | zod; RLS requires `reporter_id = auth.uid()` and a visible target                                   |
| `dismissReport` / `takeDownTarget`                  | admin     | —               | `requireAdmin()`; service-role effect; logged                                                       |
| `markNotificationRead` / `markAllNotificationsRead` | required  | —               | RLS restricts to `recipient_id = auth.uid()`                                                        |
| `updateNotificationPreferences`                     | required  | —               | Upsert scoped to `user_id = auth.uid()`                                                             |

Server Actions inherit Next.js's built-in Origin/Host check. No action trusts a client-provided user id.

## Route Handlers

| Route                      | Purpose                                           | Protections                                                                                             |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `GET /auth/callback`       | Supabase email confirmation / OAuth code exchange | Safe redirect (`safeRedirectPath`); generic error redirect                                              |
| `GET /api/unsplash/search` | Same-origin Unsplash proxy                        | Origin check, 2–80 char query, per-IP limit, 8s upstream timeout, response whitelisting, generic errors |
| `GET /api/health`          | Liveness/readiness for monitoring                 | No secrets; only returns `ok` and a Supabase check                                                      |
| `/monitoring`              | Sentry tunnel (generated by `withSentryConfig`)   | Only accepts Sentry envelopes                                                                           |

There are no inbound webhooks yet. When one is added: verify the provider signature against the raw body, make the handler idempotent (store the event id), and rate-limit by provider identity rather than IP.

## Rate limiting

- Authenticated actions use the existing `public.consume_rate_limit` RPC (`security definer`, authenticated-only, clamped window/limit). Limits live in `lib/rate-limit/config.ts`.
- Anonymous traffic (sign-up, sign-in, Unsplash proxy, `/search`) uses fixed-window buckets in module memory keyed by client IP. These are per server instance; use a platform WAF if distributed accuracy matters.
- The limiter fails open with a server warning if the RPC is unavailable, so a database issue cannot take the product down.

## Row Level Security

RLS is enabled on every application table. Notable rules:

- `profiles`: public read; owners may update only `display_name`, `bio`, `portfolio_url`, `avatar_path`. `is_admin` is not granted for updates.
- `shots`: published shots are public, drafts are owner-only; writes go through `security definer` RPCs that check `creator_id`.
- `shot_likes` / `comments` / `follows`: identity columns are pinned to `auth.uid()`.
- `reports`: reporters can read their own reports; only admins can read or resolve all reports; no deletes.
- `notifications`: a user can only read and mark their own rows read.
- `notification_preferences`: a user can only read, insert, or update their own row.
- `rate_limits`: no client access; only the definer function.
- Storage: writes are scoped to the first path segment (`auth.uid()`); buckets enforce MIME types and size limits.

## Realtime authorization

- Shot rooms are private Broadcast channels named `shot:<uuid>`.
- `realtime.messages` has a SELECT policy that only allows the topic when the referenced shot is published, or when the subscriber owns it.
- There is deliberately no INSERT policy for `anon` or `authenticated`: clients cannot publish. Server Actions publish through the Realtime REST API with the service role, which bypasses RLS. This prevents forged comments or like counts.
- Notification updates use Postgres Changes, which already respects the `notifications` SELECT policy, and the table is added to the `supabase_realtime` publication.
- Private data never goes to public channels. Payloads are validated again on the client before rendering.

## User-generated content

- React escapes all text; comments render with `whitespace-pre-line` and no HTML.
- Portfolio URLs are constrained to `http(s)://` in the database and on the server.
- Unsplash covers are restricted to `https://images.unsplash.com/` by a check constraint and require attribution fields.
- External links use `rel="noreferrer"`.

## Secrets and logging

- `SUPABASE_SERVICE_ROLE_KEY` is read only in `lib/supabase/admin.ts` (`server-only`) and in the Realtime broadcast helper.
- Sentry is configured with `dataCollection` disabled for user info, cookies, HTTP bodies, and sensitive headers, plus `beforeSend`/`beforeBreadcrumb` scrubbing.
- The application logger redacts keys matching password/token/secret/authorization/cookie before logging or capturing.

## Data retention

- Account deletion removes storage objects first, then the auth user; profiles, shots, likes, comments, follows, notifications, and preferences cascade.
- Reports survive with `reporter_id`/`resolved_by` set to `null` so moderation evidence is not silently destroyed.
- Notifications and their preferences cascade with the recipient.
