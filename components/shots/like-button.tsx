"use client";

import { useOptimistic, useState } from "react";

import { toggleLike } from "@/app/social/actions";
import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  shotId: string;
  liked: boolean;
  count: number;
  interactive: boolean;
  onCountChange?: (count: number) => void;
};

type LikeState = {
  liked: boolean;
  count: number;
};

export function LikeButton({
  shotId,
  liked,
  count,
  interactive,
  onCountChange,
}: LikeButtonProps) {
  const [error, setError] = useState<string | null>(null);
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
    <span className="inline-flex flex-col items-start gap-1">
      <form
        action={async () => {
          setError(null);
          const nextLiked = !state.liked;
          const nextCount = Math.max(0, state.count + (nextLiked ? 1 : -1));
          addOptimistic(true);
          const result = await toggleLike(shotId);

          if (result.ok) {
            onCountChange?.(nextCount);
          } else {
            setError(result.error);
          }
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
      {error ? (
        <span role="status" className="text-[11px] text-red-600">
          {error}
        </span>
      ) : null}
    </span>
  );
}
