import Link from "next/link";

import {
  buildFeedHref,
  FEED_SORTS,
  type FeedParams,
  type FeedSort,
} from "@/lib/feed/params";
import { cn } from "@/lib/utils";

const LABELS: Record<FeedSort, string> = {
  newest: "Newest",
  popular: "Popular",
  trending: "Trending",
};

type FeedTabsProps = {
  params: FeedParams;
};

export function FeedTabs({ params }: FeedTabsProps) {
  return (
    <nav
      aria-label="Feed sort"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-white p-1"
    >
      {FEED_SORTS.map((sort) => {
        const active = params.sort === sort;

        return (
          <Link
            key={sort}
            href={buildFeedHref({
              sort,
              categoryId: params.categoryId,
              tag: params.tag,
              creator: params.creator,
              days: params.days,
            })}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-white"
                : "text-muted hover:bg-surface hover:text-foreground",
            )}
          >
            {LABELS[sort]}
          </Link>
        );
      })}
    </nav>
  );
}
