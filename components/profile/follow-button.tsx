"use client";

import Link from "next/link";
import { useOptimistic, useState } from "react";

import { followProfile, unfollowProfile } from "@/app/social/actions";
import { Button, buttonClasses } from "@/components/ui/button";

type FollowButtonProps = {
  profileId: string;
  following: boolean;
  signedIn: boolean;
  signInHref: string;
  size?: "sm" | "md";
};

export function FollowButton({
  profileId,
  following,
  signedIn,
  signInHref,
  size = "sm",
}: FollowButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setFollowing] = useOptimistic<boolean, boolean>(
    following,
    (_current, next) => next,
  );

  if (!signedIn) {
    return (
      <Link href={signInHref} className={buttonClasses("secondary", size)}>
        Follow
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <form
        action={async () => {
          setError(null);
          const next = !isFollowing;
          setFollowing(next);

          const result = next
            ? await followProfile(profileId)
            : await unfollowProfile(profileId);

          if (!result.ok) {
            setError(result.error);
          }
        }}
      >
        <Button type="submit" size={size} variant={isFollowing ? "secondary" : "primary"}>
          {isFollowing ? "Following" : "Follow"}
        </Button>
      </form>
      {error ? (
        <p role="status" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
