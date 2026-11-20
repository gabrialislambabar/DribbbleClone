# QA checklist

Automated coverage lives in `e2e/`. Run:

```bash
npx supabase db push --dry-run
npm run seed
npm run test:e2e
```

For the moderation spec, create an admin first and set `PLAYWRIGHT_ADMIN_EMAIL` / `PLAYWRIGHT_ADMIN_PASSWORD`. For realtime, enable Realtime in Supabase and set `PLAYWRIGHT_REALTIME=1`.

## Section 13 matrix

| Check                                               | Automated                                   | Manual                                                                       |
| --------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| Happy path + validation failures                    | `auth.spec.ts`, `social.spec.ts`            | Sign-up with a duplicate username; empty shot form; oversized image          |
| Anonymous vs signed-in access                       | `authorization.spec.ts`                     | Signed-out like/comment/follow prompts                                       |
| Other user cannot read/mutate private or owned data | `authorization.spec.ts`                     | Draft shot URL as a non-owner; comment edit/delete as a non-author           |
| RLS/Storage policies, not just UI hiding            | `authorization.spec.ts` (direct RPC/update) | Upload to another user's storage folder with the anon key                    |
| Duplicate actions                                   | `social.spec.ts`                            | Double-submit like/comment/follow; re-report the same target                 |
| Pagination boundaries and empty states              | —                                           | Last page of feed/search/followers; empty notifications                      |
| Stale UI/cache after mutations                      | `quality.spec.ts`                           | Publish/unpublish from the dashboard; edit a profile; refresh the feed       |
| DB constraints reject invalid data                  | `authorization.spec.ts`                     | Insert a 1001-char comment, invalid category, self-follow via the SQL editor |
| Schema/types/env documented                         | —                                           | `docs/security.md`, `docs/operations.md`, `lib/types/database.ts`            |

## Manual pass

### Anonymous

- [ ] Home feed switches Newest/Popular/Trending and filters by category/tag/designer.
- [ ] Search rejects 1-character queries; a 101-character query shows the limit message.
- [ ] Shot page shows counts but no like/comment controls; sign-in prompts link to the right `next` path.
- [ ] `/dashboard`, `/settings`, `/notifications`, `/moderation` redirect or 404 appropriately.

### Signed in

- [ ] Create a draft with an uploaded cover and with an Unsplash cover; both render.
- [ ] Publish from the dashboard and confirm the shot appears in Newest without a hard refresh.
- [ ] Edit a published shot and confirm its feed position does not change.
- [ ] Unpublish and confirm it disappears from the feed but stays in the dashboard.
- [ ] Delete a shot and confirm storage cleanup (cover URL 404s).
- [ ] Like/unlike twice; reload and confirm the persisted state.
- [ ] Post a comment, edit it, delete it; as the shot owner, delete someone else's comment.
- [ ] Follow/unfollow; counts update on both profiles.
- [ ] Upload an avatar, save, and confirm the old object is removed.
- [ ] Save notification preferences; confirm the row in `notification_preferences`.
- [ ] Report a shot, comment, and profile; confirm a duplicate report shows "You already reported this."

### Notifications

- [ ] A follow creates exactly one notification for the recipient (not the actor).
- [ ] A comment notifies the shot owner, not the commenter.
- [ ] Unchecking "Comments" suppresses future comment notifications.
- [ ] Unread badge matches the list; opening an item clears it; "Mark all read" clears everything.
- [ ] Pagination on the notifications page does not repeat or skip rows.

### Realtime

- [ ] Two browsers on the same shot: a new comment appears without reload.
- [ ] Editing/deleting a comment updates the other viewer.
- [ ] A like updates the other viewer's count.
- [ ] A user cannot subscribe to another user's private notification stream or publish into a shot room.

### Moderation

- [ ] A non-admin sees 404 at `/moderation`.
- [ ] A report appears with the correct target preview and reporter.
- [ ] Take down a comment → it disappears from the shot.
- [ ] Take down a shot → it becomes a draft and leaves the feed.
- [ ] Dismiss marks the report resolved and leaves content intact.

### Operations

- [ ] `/api/health` returns 200 with RLS enabled and no secrets.
- [ ] Sentry receives a deliberate test error; cookies, email, and authorization headers are absent.
- [ ] `/api/unsplash/search` with a missing key returns a generic 503; an upstream failure returns 502.
- [ ] Search throttle returns 429 with `Retry-After` after 60 requests in a minute.
- [ ] Rate-limited comments show the friendly message, not a stack trace.
