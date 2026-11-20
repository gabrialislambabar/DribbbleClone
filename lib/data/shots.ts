import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ShotListItem } from "@/lib/types/app";
import type { ShotStatus } from "@/lib/types/database";

const SHOT_SELECT = `
  id,
  title,
  description,
  cover_image_path,
  status,
  category_id,
  creator_id,
  created_at,
  published_at,
  creator:profiles!shots_creator_id_fkey(id, username, display_name, avatar_path),
  category:categories!shots_category_id_fkey(id, name),
  shot_tags(tags(id, name))
`;

type RawShot = {
  id: string;
  title: string;
  description: string | null;
  cover_image_path: string;
  status: ShotStatus;
  category_id: string;
  creator_id: string;
  created_at: string;
  published_at: string | null;
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
    status: row.status,
    category_id: row.category_id,
    category_name: row.category?.name ?? "Uncategorized",
    created_at: row.created_at,
    published_at: row.published_at,
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

function toRows(data: unknown): RawShot[] {
  return (data ?? []) as RawShot[];
}

export const SHOTS_PAGE_SIZE = 24;

export const getPublishedShots = cache(async (page: number) => {
  const supabase = await createClient();
  const from = (page - 1) * SHOTS_PAGE_SIZE;

  const { data, error } = await supabase
    .from("shots")
    .select(SHOT_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, from + SHOTS_PAGE_SIZE);

  if (error) {
    throw new Error(error.message);
  }

  const rows = toRows(data);
  const hasMore = rows.length > SHOTS_PAGE_SIZE;

  return {
    shots: rows.slice(0, SHOTS_PAGE_SIZE).map(mapShot),
    hasMore,
  };
});

export const getShotById = cache(async (id: string): Promise<ShotListItem | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shots")
    .select(SHOT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return mapShot(data as unknown as RawShot);
});

export const getPublishedShotsByCreator = cache(
  async (creatorId: string, limit = 60): Promise<ShotListItem[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shots")
      .select(SHOT_SELECT)
      .eq("creator_id", creatorId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return toRows(data).map(mapShot);
  },
);

export const getShotsForDashboard = cache(
  async (creatorId: string): Promise<ShotListItem[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shots")
      .select(SHOT_SELECT)
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return toRows(data).map(mapShot);
  },
);
