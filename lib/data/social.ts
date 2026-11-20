import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  encodeFollowCursor,
  FOLLOW_PAGE_SIZE,
  type FollowCursor,
} from "@/lib/follows/params";
import type { CommentItem, FollowListItem } from "@/lib/types/app";
import type { FollowListRow } from "@/lib/types/database";

export const COMMENT_PAGE_SIZE = 20;
export const COMMENT_MAX = 100;

export async function getLikedShotIds(
  userId: string,
  shotIds: string[],
): Promise<Set<string>> {
  if (shotIds.length === 0) {
    return new Set();
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("shot_likes")
    .select("shot_id")
    .eq("user_id", userId)
    .in("shot_id", shotIds);

  return new Set((data ?? []).map((row) => row.shot_id));
}

export async function isShotLiked(shotId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shot_likes")
    .select("shot_id")
    .eq("user_id", userId)
    .eq("shot_id", shotId)
    .maybeSingle();

  return Boolean(data);
}

type RawComment = {
  id: string;
  shot_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_path: string | null;
  } | null;
};

export async function getComments(shotId: string, limit: number): Promise<CommentItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      "id, shot_id, body, created_at, updated_at, author_id, author:profiles!comments_author_id_fkey(id, username, display_name, avatar_path)",
    )
    .eq("shot_id", shotId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(Math.min(Math.max(limit, 1), COMMENT_MAX));

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as RawComment[]).map((row) => ({
    id: row.id,
    shot_id: row.shot_id,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: {
      id: row.author?.id ?? row.author_id,
      username: row.author?.username ?? "unknown",
      display_name: row.author?.display_name ?? "Unknown designer",
      avatar_path: row.author?.avatar_path ?? null,
    },
  }));
}

export async function getFollowState(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  return Boolean(data);
}

export type FollowPage = {
  items: FollowListItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

function mapFollowRow(row: FollowListRow): FollowListItem {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    avatar_path: row.avatar_path,
    follower_count: row.follower_count,
    following_count: row.following_count,
    is_following: row.is_following,
    followed_at: row.followed_at,
  };
}

export async function getFollowList(
  profileId: string,
  direction: "followers" | "following",
  cursor: FollowCursor | null,
): Promise<FollowPage> {
  const supabase = await createClient();
  const args = {
    p_profile_id: profileId,
    p_cursor_time: cursor?.time ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: FOLLOW_PAGE_SIZE + 1,
  };

  const { data, error } =
    direction === "followers"
      ? await supabase.rpc("get_followers", args)
      : await supabase.rpc("get_following", args);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as FollowListRow[];
  const hasMore = rows.length > FOLLOW_PAGE_SIZE;
  const pageRows = rows.slice(0, FOLLOW_PAGE_SIZE);
  const last = pageRows.at(-1);

  return {
    items: pageRows.map(mapFollowRow),
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeFollowCursor({
            v: 1,
            time: last.followed_at,
            id: last.id,
          })
        : null,
  };
}
