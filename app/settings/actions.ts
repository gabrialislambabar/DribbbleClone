"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { AVATAR_BUCKET, SHOT_COVER_BUCKET } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AVATAR_MAX_BYTES, avatarStoragePath, validateImageFile } from "@/lib/storage";
import { firstZodError, profileSchema } from "@/lib/validation/profile";

export type ProfileState = {
  error?: string;
  success?: string;
};

export type DeleteAccountState = {
  error?: string;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateProfile(
  _previousState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    display_name: formString(formData, "display_name"),
    bio: formString(formData, "bio"),
    portfolio_url: formString(formData, "portfolio_url"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { error: "Your profile could not be found." };
  }

  let avatarPath = profile.avatar_path;
  let uploadedPath: string | null = null;

  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const fileError = validateImageFile(avatar, AVATAR_MAX_BYTES);
    if (fileError) {
      return { error: fileError };
    }

    const nextPath = avatarStoragePath(user.id, avatar);
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(nextPath, avatar, { contentType: avatar.type, upsert: false });

    if (uploadError) {
      return { error: uploadError.message };
    }

    uploadedPath = nextPath;
    avatarPath = nextPath;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      bio: parsed.data.bio,
      portfolio_url: parsed.data.portfolio_url,
      avatar_path: avatarPath,
    })
    .eq("id", user.id);

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([uploadedPath]);
    }
    return { error: error.message };
  }

  if (uploadedPath && profile.avatar_path) {
    await supabase.storage.from(AVATAR_BUCKET).remove([profile.avatar_path]);
  }

  revalidatePath("/settings");
  revalidatePath(`/u/${profile.username}`);
  revalidateTag("profiles:public", { expire: 0 });
  revalidateTag("shots:feed", { expire: 0 });

  return { success: "Profile updated." };
}

export async function deleteAccount(
  _previousState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const user = await requireUser();
  const confirmation = formString(formData, "confirmation").trim().toLowerCase();

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("username, avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { error: "Your profile could not be found." };
  }

  if (confirmation !== profile.username) {
    return { error: `Type "${profile.username}" to confirm.` };
  }

  const { data: shots } = await admin
    .from("shots")
    .select("cover_image_path")
    .eq("creator_id", user.id);

  const coverPaths = (shots ?? []).map((shot) => shot.cover_image_path);

  if (coverPaths.length > 0) {
    const { error: storageError } = await admin.storage
      .from(SHOT_COVER_BUCKET)
      .remove(coverPaths);

    if (storageError) {
      return { error: `Could not remove your shot images: ${storageError.message}` };
    }
  }

  if (profile.avatar_path) {
    const { error: avatarError } = await admin.storage
      .from(AVATAR_BUCKET)
      .remove([profile.avatar_path]);

    if (avatarError) {
      return { error: `Could not remove your avatar: ${avatarError.message}` };
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return { error: deleteError.message };
  }

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });

  revalidateTag("profiles:public", { expire: 0 });
  revalidateTag("shots:feed", { expire: 0 });
  revalidatePath("/", "layout");
  redirect("/");
}
