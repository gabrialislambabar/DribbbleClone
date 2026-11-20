import Link from "next/link";

import { FollowButton } from "@/components/profile/follow-button";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { avatarUrl } from "@/lib/storage";
import type { FollowListItem, Profile } from "@/lib/types/app";

type FollowListProps = {
  profile: Profile;
  direction: "followers" | "following";
  items: FollowListItem[];
  nextCursor: string | null;
  currentUserId: string | null;
};

export function FollowList({
  profile,
  direction,
  items,
  nextCursor,
  currentUserId,
}: FollowListProps) {
  const title = direction === "followers" ? "Followers" : "Following";
  const count =
    direction === "followers" ? profile.follower_count : profile.following_count;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href={`/u/${profile.username}`}
        className="text-sm text-muted hover:text-foreground"
      >
        ← {profile.display_name}
      </Link>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {title} <span className="text-base font-normal text-muted">({count})</span>
      </h1>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={`No ${title.toLowerCase()} yet`}
            description={
              direction === "followers"
                ? "When people follow this designer, they will appear here."
                : "This designer has not followed anyone yet."
            }
            action={
              <Link
                href={`/u/${profile.username}`}
                className={buttonClasses("secondary")}
              >
                Back to profile
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 p-4">
              <Link
                href={`/u/${item.username}`}
                className="flex min-w-0 items-center gap-3 hover:text-brand"
              >
                <Avatar
                  src={avatarUrl(item.avatar_path)}
                  name={item.display_name}
                  size={44}
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.display_name}</span>
                  <span className="block truncate text-xs text-muted">
                    @{item.username} · {item.follower_count} followers
                  </span>
                </span>
              </Link>

              {currentUserId !== item.id ? (
                <FollowButton
                  profileId={item.id}
                  following={item.is_following}
                  signedIn={Boolean(currentUserId)}
                  signInHref={`/sign-in?next=/u/${profile.username}/${direction}`}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {nextCursor ? (
        <div className="mt-8 flex justify-center">
          <Link
            href={`/u/${profile.username}/${direction}?cursor=${encodeURIComponent(nextCursor)}`}
            className={buttonClasses("secondary")}
          >
            Load more
          </Link>
        </div>
      ) : null}
    </div>
  );
}
