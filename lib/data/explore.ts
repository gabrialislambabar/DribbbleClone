import "server-only";

import { unstable_cache } from "next/cache";

import { withNetworkRetry } from "@/lib/data/resilient";
import { createPublicClient } from "@/lib/supabase/public";
import { logError } from "@/lib/observability/logger";
import type { ShotListItem } from "@/lib/types/app";
import type { ShotStatus } from "@/lib/types/database";

const SHOT_SELECT = `
  id,
  title,
  description,
  cover_image_path,
  cover_credit_name,
  cover_credit_url,
  cover_photo_url,
  cover_provider,
  status,
  category_id,
  creator_id,
  created_at,
  published_at,
  like_count,
  comment_count,
  creator:profiles!shots_creator_id_fkey(id, username, display_name, avatar_path),
  category:categories!shots_category_id_fkey(id, name),
  shot_tags(tags(id, name))
`;

type RawShot = {
  id: string;
  title: string;
  description: string | null;
  cover_image_path: string;
  cover_credit_name: string | null;
  cover_credit_url: string | null;
  cover_photo_url: string | null;
  cover_provider: string | null;
  status: ShotStatus;
  category_id: string;
  creator_id: string;
  created_at: string;
  published_at: string | null;
  like_count: number;
  comment_count: number;
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_path: string | null;
  } | null;
  category: { id: string; name: string } | null;
  shot_tags: { tags: { id: number; name: string } | null }[] | null;
};

function mapShot(row: RawShot): ShotListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    cover_image_path: row.cover_image_path,
    cover_credit:
      row.cover_credit_name &&
      row.cover_credit_url &&
      row.cover_photo_url &&
      row.cover_provider
        ? {
            name: row.cover_credit_name,
            url: row.cover_credit_url,
            photoUrl: row.cover_photo_url,
            provider: row.cover_provider,
          }
        : null,
    status: row.status,
    category_id: row.category_id,
    category_name: row.category?.name ?? "Uncategorized",
    created_at: row.created_at,
    published_at: row.published_at,
    like_count: row.like_count,
    comment_count: row.comment_count,
    creator: {
      id: row.creator?.id ?? row.creator_id,
      username: row.creator?.username ?? "unknown",
      display_name: row.creator?.display_name ?? "Unknown designer",
      avatar_path: row.creator?.avatar_path ?? null,
    },
    tags: (row.shot_tags ?? [])
      .flatMap((shotTag) => (shotTag.tags ? [shotTag.tags] : []))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

const getCachedExploreShots = unstable_cache(
  async (): Promise<ShotListItem[]> => {
    const rows = await withNetworkRetry(async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("shots")
        .select(SHOT_SELECT)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(200);

      if (error) {
        throw error;
      }

      return (data ?? []) as unknown as RawShot[];
    }).catch((error) => {
      logError("data.explore", error);
      throw new Error("We couldn't load projects right now.");
    });

    return rows.map(mapShot);
  },
  ["explore-shots"],
  { tags: ["shots:feed"], revalidate: 60 },
);

export async function getExploreShots(): Promise<ShotListItem[]> {
  return getCachedExploreShots();
}
