"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { SHOT_COVER_BUCKET } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { SHOT_COVER_MAX_BYTES, shotCoverPath, validateImageFile } from "@/lib/storage";
import { firstZodError } from "@/lib/validation/profile";
import { parseTagsInput, shotFieldsSchema } from "@/lib/validation/shot";

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

  return message;
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

export async function createShot(
  _previousState: ShotFormState,
  formData: FormData,
): Promise<ShotFormState> {
  const user = await requireUser();

  const parsed = parseShotFields(formData);
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const cover = formData.get("cover");
  if (!(cover instanceof File) || cover.size === 0) {
    return { error: "Choose a cover image." };
  }

  const fileError = validateImageFile(cover, SHOT_COVER_MAX_BYTES);
  if (fileError) {
    return { error: fileError };
  }

  const supabase = await createClient();
  const uploadId = crypto.randomUUID();
  const coverPath = shotCoverPath(user.id, uploadId, cover);

  const { error: uploadError } = await supabase.storage
    .from(SHOT_COVER_BUCKET)
    .upload(coverPath, cover, { contentType: cover.type, upsert: false });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: shotId, error } = await supabase.rpc("create_shot", {
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_category_id: parsed.data.category_id,
    p_tags: parsed.data.tags,
    p_cover_path: coverPath,
  });

  if (error || !shotId) {
    await supabase.storage.from(SHOT_COVER_BUCKET).remove([coverPath]);
    return { error: friendlyShotError(error?.message) };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");

  redirect(`/shots/${shotId}`);
}

export async function updateShot(
  shotId: string,
  _previousState: ShotFormState,
  formData: FormData,
): Promise<ShotFormState> {
  const user = await requireUser();

  const parsed = parseShotFields(formData);
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("shots")
    .select("cover_image_path")
    .eq("id", shotId)
    .maybeSingle();

  if (!existing) {
    return { error: "That shot could not be found." };
  }

  let coverPath = existing.cover_image_path;
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
      return { error: uploadError.message };
    }

    uploadedPath = nextPath;
    coverPath = nextPath;
  }

  const { error } = await supabase.rpc("update_shot", {
    p_shot_id: shotId,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_category_id: parsed.data.category_id,
    p_tags: parsed.data.tags,
    p_cover_path: coverPath,
  });

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from(SHOT_COVER_BUCKET).remove([uploadedPath]);
    }
    return { error: friendlyShotError(error.message) };
  }

  if (uploadedPath && existing.cover_image_path !== uploadedPath) {
    await supabase.storage.from(SHOT_COVER_BUCKET).remove([existing.cover_image_path]);
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/shots/${shotId}`);

  redirect(`/shots/${shotId}`);
}

export async function publishShot(shotId: string) {
  await requireUser();
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
}

export async function unpublishShot(shotId: string) {
  await requireUser();
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
}

export async function deleteShot(shotId: string) {
  await requireUser();
  const supabase = await createClient();

  const { data: shot } = await supabase
    .from("shots")
    .select("cover_image_path")
    .eq("id", shotId)
    .maybeSingle();

  if (!shot) {
    redirect("/dashboard");
  }

  const { error } = await supabase.from("shots").delete().eq("id", shotId);

  if (error) {
    throw new Error(friendlyShotError(error.message));
  }

  await supabase.storage.from(SHOT_COVER_BUCKET).remove([shot.cover_image_path]);

  revalidatePath("/");
  revalidatePath("/dashboard");

  redirect("/dashboard");
}
