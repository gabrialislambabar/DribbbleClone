import "server-only";

import { unstable_cache } from "next/cache";

import { getUser } from "@/lib/auth";
import { getLikedShotIds } from "@/lib/data/social";
import { encodeFeedCursor } from "@/lib/feed/cursor";
import {
  FEED_PAGE_SIZE,
  type FeedDays,
  type FeedParams,
  type FeedSort,
} from "@/lib/feed/params";
import { createPublicClient } from "@/lib/supabase/public";
import type { ShotListItem } from "@/lib/types/app";
import type { ShotFeedRow } from "@/lib/types/database";

export type FeedPage = {
  shots: ShotListItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

function mapFeedRow(row: ShotFeedRow): ShotListItem {
  return {
    id: row.id,
    title: row.title,
    description: null,
    cover_image_path: row.cover_image_path,
    status: "published",
    category_id: row.category_id,
    category_name: row.category_name,
    created_at: row.published_at,
    published_at: row.published_at,
    like_count: row.like_count,
    comment_count: row.comment_count,
    creator: {
      id: row.creator_id,
      username: row.creator_username,
      display_name: row.creator_display_name,
      avatar_path: row.creator_avatar_path,
    },
    tags: row.tags ?? [],
  };
}

const getCachedFeed = unstable_cache(
  async (
    sort: FeedSort,
    categoryId: string | null,
    tag: string | null,
    creator: string | null,
    days: FeedDays | null,
    cursorScore: number | null,
    cursorTime: string | null,
    cursorId: string | null,
  ): Promise<FeedPage> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("get_shots_feed", {
      p_sort: sort,
      p_category_id: categoryId,
      p_tag: tag,
      p_creator: creator,
      p_days: days,
      p_cursor_score: cursorScore,
      p_cursor_time: cursorTime,
      p_cursor_id: cursorId,
      p_limit: FEED_PAGE_SIZE + 1,
    });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as ShotFeedRow[];
    const hasMore = rows.length > FEED_PAGE_SIZE;
    const pageRows = rows.slice(0, FEED_PAGE_SIZE);
    const last = pageRows.at(-1);

    return {
      shots: pageRows.map(mapFeedRow),
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeFeedCursor({
              v: 1,
              sort,
              score: sort === "newest" ? null : last.rank_score,
              time: last.published_at,
              id: last.id,
            })
          : null,
    };
  },
  ["shots-feed"],
  { tags: ["shots:feed"], revalidate: 60 },
);

export async function getShotsFeed(params: FeedParams): Promise<FeedPage> {
  const page = await getCachedFeed(
    params.sort,
    params.categoryId,
    params.tag,
    params.creator,
    params.days,
    params.cursor?.score ?? null,
    params.cursor?.time ?? null,
    params.cursor?.id ?? null,
  );

  const user = await getUser();
  if (!user) {
    return page;
  }

  const liked = await getLikedShotIds(
    user.id,
    page.shots.map((shot) => shot.id),
  );

  return {
    ...page,
    shots: page.shots.map((shot) => ({
      ...shot,
      liked_by_me: liked.has(shot.id),
    })),
  };
}
