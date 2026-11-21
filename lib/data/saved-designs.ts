import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";
import type { GalleryItem, GallerySource } from "@/lib/gallery/types";

export type SavedDesign = {
  id: string;
  source: GallerySource;
  sourceItemId: string;
  title: string;
  category: string;
  imageUrl: string;
  thumbnailUrl: string;
  sourceUrl: string;
  creatorName: string | null;
  creatorUrl: string | null;
  licenseName: string | null;
  licenseUrl: string | null;
  savedAt: string;
};

type SavedRow = {
  source: GallerySource;
  source_item_id: string;
  title: string;
  category: string;
  image_url: string;
  thumbnail_url: string | null;
  source_url: string;
  creator_name: string | null;
  creator_url: string | null;
  license_name: string | null;
  license_url: string | null;
  saved_at: string;
};

const SAVED_COLUMNS =
  "source, source_item_id, title, category, image_url, thumbnail_url, source_url, creator_name, creator_url, license_name, license_url, saved_at";

function mapSaved(row: SavedRow): SavedDesign {
  return {
    id: `${row.source}:${row.source_item_id}`,
    source: row.source,
    sourceItemId: row.source_item_id,
    title: row.title,
    category: row.category,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url ?? row.image_url,
    sourceUrl: row.source_url,
    creatorName: row.creator_name,
    creatorUrl: row.creator_url,
    licenseName: row.license_name,
    licenseUrl: row.license_url,
    savedAt: row.saved_at,
  };
}

export type SavedDesignsResult = {
  designs: SavedDesign[];
  unavailable: boolean;
};

export async function getSavedDesigns(userId: string): Promise<SavedDesignsResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_designs")
    .select(SAVED_COLUMNS)
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(200);

  if (error) {
    // The table only exists after 0013_saved_designs.sql has run. Keep the rest
    // of the page usable rather than throwing a route-level error.
    logError("data.savedDesigns", error);
    return { designs: [], unavailable: true };
  }

  return {
    designs: ((data ?? []) as unknown as SavedRow[]).map(mapSaved),
    unavailable: false,
  };
}

export async function getSavedDesignIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_designs")
    .select("source, source_item_id")
    .eq("user_id", userId)
    .limit(500);

  if (error) {
    logError("data.savedDesigns", error);
    return new Set();
  }

  return new Set((data ?? []).map((row) => `${row.source}:${row.source_item_id}`));
}

export function galleryItemToSavedColumns(item: GalleryItem) {
  return {
    source: item.source,
    source_item_id: item.sourceItemId,
    title: item.title.slice(0, 200),
    category: item.category,
    image_url: item.imageUrl,
    thumbnail_url: item.thumbnailUrl,
    source_url: item.sourceUrl,
    creator_name: item.creatorName,
    creator_url: item.creatorUrl,
    license_name: item.licenseName,
    license_url: item.licenseUrl,
  };
}
