"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { SHOT_COVER_BUCKET } from "@/lib/env";
import { toSafeMessage } from "@/lib/errors";
import { enforceUserRateLimit, userRateLimitError } from "@/lib/rate-limit/server";
import { createClient } from "@/lib/supabase/server";
import { SHOT_COVER_MAX_BYTES, shotCoverPath, validateImageFile } from "@/lib/storage";
import { trackUnsplashDownload } from "@/lib/unsplash";
import { firstZodError } from "@/lib/validation/profile";
import {
  parseTagsInput,
  parseUnsplashSelection,
  shotFieldsSchema,
  type UnsplashSelection,
} from "@/lib/validation/shot";

export type ShotFormState = {
  error?: string;
};

const DATABASE_ERROR_MESSAGES: Record<string, string> = {
  unauthenticated: "You need to be signed in.",
  title_required: "Title is required.",
  title_too_long: "Title must be 100 characters or fewer.",
  description_too_long: "Description must be 2,000 characters or fewer.",
  invalid_category: "Choose a valid category.",
  cover_required: "A cover image is required.",
  too_many_tags: "Use up to 5 tags.",
  tag_too_long: "Tags must be 30 characters or fewer.",
  not_owner: "You do not have permission to change that shot.",
  invalid_status: "That status is not allowed.",
  shots_cover_path_owner: "That cover image path is not allowed.",
};

function friendlyShotError(message: string | undefined): string {
  if (!message) {
    return "Something went wrong. Please try again.";
  }

  for (const [key, friendly] of Object.entries(DATABASE_ERROR_MESSAGES)) {
    if (message.includes(key)) {
      return friendly;
    }
  }

  return toSafeMessage(new Error(message));
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseShotFields(formData: FormData) {
  return shotFieldsSchema.safeParse({
    title: formString(formData, "title"),
    description: formString(formData, "description"),
    category_id: formString(formData, "category_id"),
    tags: parseTagsInput(formData.get("tags")),
  });
}

type CoverCredits = {
  name: string | null;
  url: string | null;
  photoUrl: string | null;
  sourceId: string | null;
  provider: string | null;
};

const NO_COVER_CREDITS: CoverCredits = {
  name: null,
  url: null,
  photoUrl: null,
  sourceId: null,
  provider: null,
};

function creditsFromUnsplash(selection: UnsplashSelection): CoverCredits {
  return {
    name: selection.credit_name,
    url: selection.credit_url,
    photoUrl: selection.photo_url,
    sourceId: selection.source_id,
    provider: "unsplash",
  };
}

function isExternalCover(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

export async function createShot(
  _previousState: ShotFormState,
  formData: FormData,
): Promise<ShotFormState> {
  const user = await requireUser();

  const limited = await userRateLimitError("shotCreate");
  if (limited) {
    return { error: limited };
  }

  const parsed = parseShotFields(formData);
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const { selection: unsplash, error: unsplashError } = parseUnsplashSelection(formData);
  if (unsplashError) {
    return { error: unsplashError };
  }

  const cover = formData.get("cover");
  const hasUpload = cover instanceof File && cover.size > 0;

  if (!hasUpload && !unsplash) {
    return { error: "Choose a cover image." };
  }

  const supabase = await createClient();
  let coverPath: string;
  let credits = NO_COVER_CREDITS;
  let uploadedPath: string | null = null;

  if (hasUpload) {
    const file = cover as File;
    const fileError = validateImageFile(file, SHOT_COVER_MAX_BYTES);
    if (fileError) {
      return { error: fileError };
    }

    uploadedPath = shotCoverPath(user.id, crypto.randomUUID(), file);
    const { error: uploadError } = await supabase.storage
      .from(SHOT_COVER_BUCKET)
      .upload(uploadedPath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { error: toSafeMessage(uploadError, "We couldn't upload that image.") };
    }

    coverPath = uploadedPath;
  } else {
    coverPath = unsplash!.cover_path;
    credits = creditsFromUnsplash(unsplash!);
  }

  const { data: shotId, error } = await supabase.rpc("create_shot", {
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_category_id: parsed.data.category_id,
    p_tags: parsed.data.tags,
    p_cover_path: coverPath,
    p_cover_credit_name: credits.name,
    p_cover_credit_url: credits.url,
    p_cover_photo_url: credits.photoUrl,
    p_cover_source_id: credits.sourceId,
    p_cover_provider: credits.provider,
  });

  if (error || !shotId) {
    if (uploadedPath) {
      await supabase.storage.from(SHOT_COVER_BUCKET).remove([uploadedPath]);
    }
    return { error: friendlyShotError(error?.message) };
  }

  if (unsplash) {
    trackUnsplashDownload(unsplash.download_location);
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidateTag("shots:feed", { expire: 0 });

  redirect(`/shots/${shotId}`);
}

export async function updateShot(
  shotId: string,
  _previousState: ShotFormState,
  formData: FormData,
): Promise<ShotFormState> {
  const user = await requireUser();

  const limited = await userRateLimitError("shotUpdate");
  if (limited) {
    return { error: limited };
  }

  const parsed = parseShotFields(formData);
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const { selection: unsplash, error: unsplashError } = parseUnsplashSelection(formData);
  if (unsplashError) {
    return { error: unsplashError };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("shots")
    .select(
      "cover_image_path, cover_credit_name, cover_credit_url, cover_photo_url, cover_source_id, cover_provider",
    )
    .eq("id", shotId)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { error: "That shot could not be found." };
  }

  let coverPath = existing.cover_image_path;
  let credits: CoverCredits = {
    name: existing.cover_credit_name,
    url: existing.cover_credit_url,
    photoUrl: existing.cover_photo_url,
    sourceId: existing.cover_source_id,
    provider: existing.cover_provider,
  };
  let uploadedPath: string | null = null;

  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    const fileError = validateImageFile(cover, SHOT_COVER_MAX_BYTES);
    if (fileError) {
      return { error: fileError };
    }

    const nextPath = shotCoverPath(user.id, crypto.randomUUID(), cover);
    const { error: uploadError } = await supabase.storage
      .from(SHOT_COVER_BUCKET)
      .upload(nextPath, cover, { contentType: cover.type, upsert: false });

    if (uploadError) {
      return { error: toSafeMessage(uploadError, "We couldn't upload that image.") };
    }

    uploadedPath = nextPath;
    coverPath = nextPath;
    credits = NO_COVER_CREDITS;
  } else if (unsplash) {
    coverPath = unsplash.cover_path;
    credits = creditsFromUnsplash(unsplash);
  }

  const { error } = await supabase.rpc("update_shot", {
    p_shot_id: shotId,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_category_id: parsed.data.category_id,
    p_tags: parsed.data.tags,
    p_cover_path: coverPath,
    p_cover_credit_name: credits.name,
    p_cover_credit_url: credits.url,
    p_cover_photo_url: credits.photoUrl,
    p_cover_source_id: credits.sourceId,
    p_cover_provider: credits.provider,
  });

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from(SHOT_COVER_BUCKET).remove([uploadedPath]);
    }
    return { error: friendlyShotError(error.message) };
  }

  // Only remove the previous cover when it was a storage object that we replaced.
  if (
    !isExternalCover(existing.cover_image_path) &&
    existing.cover_image_path !== coverPath
  ) {
    await supabase.storage.from(SHOT_COVER_BUCKET).remove([existing.cover_image_path]);
  }

  if (unsplash) {
    trackUnsplashDownload(unsplash.download_location);
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/shots/${shotId}`);
  revalidateTag("shots:feed", { expire: 0 });

  redirect(`/shots/${shotId}`);
}

export async function publishShot(shotId: string) {
  await requireUser();
  await enforceUserRateLimit("shotStatus");
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_shot_status", {
    p_shot_id: shotId,
    p_status: "published",
  });

  if (error) {
    throw new Error(friendlyShotError(error.message));
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/shots/${shotId}`);
  revalidateTag("shots:feed", { expire: 0 });
}

export async function unpublishShot(shotId: string) {
  await requireUser();
  await enforceUserRateLimit("shotStatus");
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_shot_status", {
    p_shot_id: shotId,
    p_status: "draft",
  });

  if (error) {
    throw new Error(friendlyShotError(error.message));
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/shots/${shotId}`);
  revalidateTag("shots:feed", { expire: 0 });
}

export async function deleteShot(shotId: string) {
  const user = await requireUser();
  await enforceUserRateLimit("shotDelete");
  const supabase = await createClient();

  const { data: shot } = await supabase
    .from("shots")
    .select("cover_image_path")
    .eq("id", shotId)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (!shot) {
    redirect("/dashboard");
  }

  const { error } = await supabase
    .from("shots")
    .delete()
    .eq("id", shotId)
    .eq("creator_id", user.id);

  if (error) {
    throw new Error(friendlyShotError(error.message));
  }

  await supabase.storage.from(SHOT_COVER_BUCKET).remove([shot.cover_image_path]);

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidateTag("shots:feed", { expire: 0 });

  redirect("/dashboard");
}
