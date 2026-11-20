"use client";

import { useOptimistic } from "react";

import { toggleLike } from "@/app/social/actions";
import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  shotId: string;
  liked: boolean;
  count: number;
  interactive: boolean;
};

type LikeState = {
  liked: boolean;
  count: number;
};

export function LikeButton({ shotId, liked, count, interactive }: LikeButtonProps) {
  const [state, addOptimistic] = useOptimistic<LikeState, boolean>(
    { liked, count },
    (current) => ({
      liked: !current.liked,
      count: Math.max(0, current.count + (current.liked ? -1 : 1)),
    }),
  );

  if (!interactive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <HeartIcon />
        {count}
      </span>
    );
  }

  return (
    <form
      action={async () => {
        addOptimistic(true);
        await toggleLike(shotId);
      }}
      className="inline-flex"
    >
      <button
        type="submit"
        aria-label={state.liked ? "Unlike this shot" : "Like this shot"}
        aria-pressed={state.liked}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors hover:bg-surface",
          state.liked ? "text-brand" : "text-muted hover:text-foreground",
        )}
      >
        <HeartIcon filled={state.liked} />
        {state.count}
      </button>
    </form>
  );
}
