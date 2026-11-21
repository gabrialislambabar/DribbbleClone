"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { toSafeMessage } from "@/lib/errors";
import { userRateLimitError } from "@/lib/rate-limit/server";
import { createClient } from "@/lib/supabase/server";
import { firstZodError } from "@/lib/validation/profile";
import { savedDesignSchema } from "@/lib/validation/gallery";
import { isGallerySource } from "@/lib/gallery/types";

export type SaveDesignState = { error?: string; saved?: boolean };

/**
 * Saves a gallery item as a bookmark. Only redisplay/credit metadata is stored;
 * the image stays hotlinked at its provider. RLS additionally enforces that a
 * row belongs to the current user.
 */
export async function saveDesign(input: unknown): Promise<SaveDesignState> {
  const user = await requireUser();
  const limited = await userRateLimitError("saveDesign");

  if (limited) {
    return { error: limited };
  }

  const parsed = savedDesignSchema.safeParse(input);

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("saved_designs").insert({
    user_id: user.id,
    source: parsed.data.source,
    source_item_id: parsed.data.sourceItemId,
    title: parsed.data.title,
    category: parsed.data.category,
    image_url: parsed.data.imageUrl,
    thumbnail_url: parsed.data.thumbnailUrl,
    source_url: parsed.data.sourceUrl,
    creator_name: parsed.data.creatorName,
    creator_url: parsed.data.creatorUrl,
    license_name: parsed.data.licenseName,
    license_url: parsed.data.licenseUrl,
  });

  if (error && error.code !== "23505") {
    return {
      error: toSafeMessage(error, "We couldn't save that design."),
    };
  }

  revalidatePath("/gallery/saved");
  return { saved: true };
}

export async function unsaveDesign(
  source: string,
  sourceItemId: string,
): Promise<SaveDesignState> {
  const user = await requireUser();
  const limited = await userRateLimitError("saveDesign");

  if (limited) {
    return { error: limited };
  }

  if (!isGallerySource(source)) {
    return { error: "That source is not supported." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_designs")
    .delete()
    .eq("user_id", user.id)
    .eq("source", source)
    .eq("source_item_id", sourceItemId);

  if (error) {
    return {
      error: toSafeMessage(error, "We couldn't remove that design."),
    };
  }

  revalidatePath("/gallery/saved");
  return { saved: false };
}
