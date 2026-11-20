"use client";

import Link from "next/link";
import { useOptimistic } from "react";

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
    <form
      action={async () => {
        const next = !isFollowing;
        setFollowing(next);
        await (next ? followProfile(profileId) : unfollowProfile(profileId));
      }}
    >
      <Button type="submit" size={size} variant={isFollowing ? "secondary" : "primary"}>
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </form>
  );
}
