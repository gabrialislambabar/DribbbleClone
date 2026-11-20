import "server-only";

import { unstable_cache } from "next/cache";

import { getUser } from "@/lib/auth";
import { getLikedShotIds } from "@/lib/data/social";
import { getShotCoverCredits } from "@/lib/data/shots";
import {
  encodeDesignerSearchCursor,
  encodeShotSearchCursor,
  SEARCH_PAGE_SIZE,
  type DesignerSearchCursor,
  type ShotSearchCursor,
} from "@/lib/search/params";
import { createPublicClient } from "@/lib/supabase/public";
import { logError } from "@/lib/observability/logger";
import type { DesignerListItem, ShotListItem } from "@/lib/types/app";
import type { DesignerSearchRow, ShotFeedRow } from "@/lib/types/database";

export type ShotSearchPage = {
  shots: ShotListItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

export type DesignerSearchPage = {
  designers: DesignerListItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

function mapShotRow(row: ShotFeedRow): ShotListItem {
  return {
    id: row.id,
    title: row.title,
    description: null,
    cover_image_path: row.cover_image_path,
    cover_credit: null,
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

const getCachedShotSearch = unstable_cache(
  async (
    query: string,
    categoryId: string | null,
    creator: string | null,
    cursorRank: number | null,
    cursorTime: string | null,
    cursorId: string | null,
  ): Promise<ShotSearchPage> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("search_shots", {
      p_query: query,
      p_category_id: categoryId,
      p_creator: creator,
      p_cursor_rank: cursorRank,
      p_cursor_time: cursorTime,
      p_cursor_id: cursorId,
      p_limit: SEARCH_PAGE_SIZE + 1,
    });

    if (error) {
      logError("data.search", error);
      throw new Error("We couldn't load this content right now.");
    }

    const rows = (data ?? []) as ShotFeedRow[];
    const hasMore = rows.length > SEARCH_PAGE_SIZE;
    const pageRows = rows.slice(0, SEARCH_PAGE_SIZE);
    const last = pageRows.at(-1);
    const credits = await getShotCoverCredits(pageRows.map((row) => row.id));

    return {
      shots: pageRows.map((row) => ({
        ...mapShotRow(row),
        cover_credit: credits.get(row.id) ?? null,
      })),
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeShotSearchCursor({
              v: 1,
              type: "shots",
              rank: last.rank_score ?? 0,
              time: last.published_at,
              id: last.id,
            })
          : null,
    };
  },
  ["shot-search"],
  { tags: ["shots:feed"], revalidate: 60 },
);

const getCachedDesignerSearch = unstable_cache(
  async (
    query: string,
    cursorRank: number | null,
    cursorUsername: string | null,
  ): Promise<DesignerSearchPage> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("search_designers", {
      p_query: query,
      p_cursor_rank: cursorRank,
      p_cursor_username: cursorUsername,
      p_limit: SEARCH_PAGE_SIZE + 1,
    });

    if (error) {
      logError("data.search", error);
      throw new Error("We couldn't load this content right now.");
    }

    const rows = (data ?? []) as DesignerSearchRow[];
    const hasMore = rows.length > SEARCH_PAGE_SIZE;
    const pageRows = rows.slice(0, SEARCH_PAGE_SIZE);
    const last = pageRows.at(-1);

    return {
      designers: pageRows.map((row) => ({
        id: row.id,
        username: row.username,
        display_name: row.display_name,
        avatar_path: row.avatar_path,
        bio: row.bio,
        follower_count: row.follower_count,
      })),
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeDesignerSearchCursor({
              v: 1,
              type: "designers",
              rank: last.rank_score ?? 0,
              username: last.username,
            })
          : null,
    };
  },
  ["designer-search"],
  { tags: ["profiles:public"], revalidate: 60 },
);

export async function searchShotsPage(params: {
  query: string;
  categoryId: string | null;
  creator: string | null;
  cursor: ShotSearchCursor | null;
}): Promise<ShotSearchPage> {
  const page = await getCachedShotSearch(
    params.query,
    params.categoryId,
    params.creator,
    params.cursor?.rank ?? null,
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

export async function searchDesignersPage(params: {
  query: string;
  cursor: DesignerSearchCursor | null;
}): Promise<DesignerSearchPage> {
  return getCachedDesignerSearch(
    params.query,
    params.cursor?.rank ?? null,
    params.cursor?.username ?? null,
  );
}
