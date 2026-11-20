"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstZodError } from "@/lib/validation/profile";
import { commentBodySchema, uuidSchema } from "@/lib/validation/social";

export type CommentActionState = {
  error?: string;
  success?: boolean;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function revalidateShotState(shotId: string) {
  revalidateTag("shots:feed", { expire: 0 });
  revalidatePath(`/shots/${shotId}`);
}

function friendlySocialError(message: string): string {
  if (message.includes("row-level security policy")) {
    return "You do not have permission to do that.";
  }

  if (message.includes("comments_body_len")) {
    return "Comment must be between 1 and 1,000 characters.";
  }

  return message;
}

export async function toggleLike(shotId: string) {
  const user = await requireUser();
  const parsed = uuidSchema.safeParse(shotId);

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("shot_likes")
    .select("shot_id")
    .eq("user_id", user.id)
    .eq("shot_id", parsed.data)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("shot_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("shot_id", parsed.data);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("shot_likes")
      .insert({ user_id: user.id, shot_id: parsed.data });

    if (error && error.code !== "23505") {
      throw new Error(error.message);
    }
  }

  revalidateShotState(parsed.data);
}

export async function addComment(
  shotId: string,
  _previousState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const user = await requireUser();
  const shot = uuidSchema.safeParse(shotId);
  const body = commentBodySchema.safeParse(formString(formData, "body"));

  if (!shot.success) {
    return { error: "That shot could not be found." };
  }

  if (!body.success) {
    return { error: firstZodError(body.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    shot_id: shot.data,
    author_id: user.id,
    body: body.data,
  });

  if (error) {
    return { error: friendlySocialError(error.message) };
  }

  revalidateShotState(shot.data);
  return { success: true };
}

export async function editComment(
  commentId: string,
  _previousState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  await requireUser();
  const comment = uuidSchema.safeParse(commentId);
  const body = commentBodySchema.safeParse(formString(formData, "body"));

  if (!comment.success) {
    return { error: "That comment could not be found." };
  }

  if (!body.success) {
    return { error: firstZodError(body.error) };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("comments")
    .select("shot_id")
    .eq("id", comment.data)
    .maybeSingle();

  if (!existing) {
    return { error: "That comment could not be found." };
  }

  const { data: updated, error } = await supabase
    .from("comments")
    .update({ body: body.data })
    .eq("id", comment.data)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: friendlySocialError(error.message) };
  }

  if (!updated) {
    return { error: "You can only edit your own comments." };
  }

  revalidateShotState(existing.shot_id);
  return { success: true };
}

export async function deleteComment(commentId: string) {
  await requireUser();
  const parsed = uuidSchema.safeParse(commentId);

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("comments")
    .select("shot_id")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!existing) {
    return;
  }

  const { error } = await supabase.from("comments").delete().eq("id", parsed.data);

  if (error) {
    throw new Error(error.message);
  }

  revalidateShotState(existing.shot_id);
}

async function getUsername(profileId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .maybeSingle();

  return data?.username ?? null;
}

function revalidateProfilePaths(username: string | null) {
  if (!username) {
    return;
  }

  revalidatePath(`/u/${username}`);
  revalidatePath(`/u/${username}/followers`);
  revalidatePath(`/u/${username}/following`);
}

export async function followProfile(profileId: string) {
  const user = await requireUser();
  const parsed = uuidSchema.safeParse(profileId);

  if (!parsed.success || parsed.data === user.id) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: parsed.data,
  });

  if (error && error.code !== "23505") {
    throw new Error(friendlySocialError(error.message));
  }

  revalidateTag("profiles:public", { expire: 0 });
  revalidateProfilePaths(await getUsername(parsed.data));
}

export async function unfollowProfile(profileId: string) {
  const user = await requireUser();
  const parsed = uuidSchema.safeParse(profileId);

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", parsed.data);

  if (error) {
    throw new Error(friendlySocialError(error.message));
  }

  revalidateTag("profiles:public", { expire: 0 });
  revalidateProfilePaths(await getUsername(parsed.data));
}
