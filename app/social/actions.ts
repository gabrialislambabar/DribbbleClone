"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";

import { requireUser } from "@/lib/auth";
import { type ActionResult, toSafeMessage } from "@/lib/errors";
import { userRateLimitError } from "@/lib/rate-limit/server";
import { broadcastToShot } from "@/lib/realtime/broadcast";
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
  return toSafeMessage(new Error(message), "We couldn't complete that action.");
}

export async function toggleLike(shotId: string): Promise<ActionResult> {
  const user = await requireUser();

  const limited = await userRateLimitError("like");
  if (limited) {
    return { ok: false, error: limited };
  }

  const parsed = uuidSchema.safeParse(shotId);
  if (!parsed.success) {
    return { ok: false, error: "That shot could not be found." };
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
      return { ok: false, error: friendlySocialError(error.message) };
    }
  } else {
    const { error } = await supabase
      .from("shot_likes")
      .insert({ user_id: user.id, shot_id: parsed.data });

    if (error && error.code !== "23505") {
      return { ok: false, error: friendlySocialError(error.message) };
    }
  }

  revalidateShotState(parsed.data);

  const { data: shot } = await supabase
    .from("shots")
    .select("like_count")
    .eq("id", parsed.data)
    .maybeSingle();

  if (typeof shot?.like_count === "number") {
    const likeCount = shot.like_count;
    after(() =>
      broadcastToShot(parsed.data, "like:changed", {
        shotId: parsed.data,
        likeCount,
      }),
    );
  }

  return { ok: true };
}

export async function addComment(
  shotId: string,
  _previousState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const user = await requireUser();

  const limited = await userRateLimitError("comment");
  if (limited) {
    return { error: limited };
  }

  const shot = uuidSchema.safeParse(shotId);
  const body = commentBodySchema.safeParse(formString(formData, "body"));

  if (!shot.success) {
    return { error: "That shot could not be found." };
  }

  if (!body.success) {
    return { error: firstZodError(body.error) };
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("comments")
    .insert({
      shot_id: shot.data,
      author_id: user.id,
      body: body.data,
    })
    .select(
      "id, shot_id, body, created_at, updated_at, author_id, author:profiles!comments_author_id_fkey(username, display_name, avatar_path)",
    )
    .single();

  if (error || !inserted) {
    return { error: friendlySocialError(error?.message ?? "comment_insert_failed") };
  }

  const insertedComment = inserted as unknown as {
    id: string;
    shot_id: string;
    body: string;
    created_at: string;
    updated_at: string;
    author_id: string;
    author: {
      username: string;
      display_name: string;
      avatar_path: string | null;
    } | null;
  };

  const { data: shotRow } = await supabase
    .from("shots")
    .select("comment_count")
    .eq("id", shot.data)
    .maybeSingle();

  after(() =>
    broadcastToShot(shot.data, "comment:new", {
      comment: {
        id: insertedComment.id,
        shot_id: insertedComment.shot_id,
        body: insertedComment.body,
        created_at: insertedComment.created_at,
        updated_at: insertedComment.updated_at,
        author: {
          id: insertedComment.author_id,
          username: insertedComment.author?.username ?? "designer",
          display_name: insertedComment.author?.display_name ?? "Designer",
          avatar_path: insertedComment.author?.avatar_path ?? null,
        },
      },
      commentCount: shotRow?.comment_count ?? null,
    }),
  );

  revalidateShotState(shot.data);
  return { success: true };
}

export async function editComment(
  commentId: string,
  _previousState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const user = await requireUser();

  const limited = await userRateLimitError("commentEdit");
  if (limited) {
    return { error: limited };
  }

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
    .eq("author_id", user.id)
    .select("id, body, updated_at")
    .maybeSingle();

  if (error) {
    return { error: friendlySocialError(error.message) };
  }

  if (!updated) {
    return { error: "You can only edit your own comments." };
  }

  after(() =>
    broadcastToShot(existing.shot_id, "comment:updated", {
      id: updated.id,
      body: updated.body,
      updated_at: updated.updated_at,
    }),
  );

  revalidateShotState(existing.shot_id);
  return { success: true };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  await requireUser();

  const limited = await userRateLimitError("commentDelete");
  if (limited) {
    return { ok: false, error: limited };
  }

  const parsed = uuidSchema.safeParse(commentId);
  if (!parsed.success) {
    return { ok: false, error: "That comment could not be found." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("comments")
    .select("shot_id")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "That comment could not be found." };
  }

  const { error } = await supabase.from("comments").delete().eq("id", parsed.data);

  if (error) {
    return { ok: false, error: friendlySocialError(error.message) };
  }

  const { data: shotRow } = await supabase
    .from("shots")
    .select("comment_count")
    .eq("id", existing.shot_id)
    .maybeSingle();

  after(() =>
    broadcastToShot(existing.shot_id, "comment:deleted", {
      id: parsed.data,
      commentCount: shotRow?.comment_count ?? null,
    }),
  );

  revalidateShotState(existing.shot_id);
  return { ok: true };
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

export async function followProfile(profileId: string): Promise<ActionResult> {
  const user = await requireUser();

  const limited = await userRateLimitError("follow");
  if (limited) {
    return { ok: false, error: limited };
  }

  const parsed = uuidSchema.safeParse(profileId);
  if (!parsed.success || parsed.data === user.id) {
    return { ok: false, error: "That profile could not be followed." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: parsed.data,
  });

  if (error && error.code !== "23505") {
    return { ok: false, error: friendlySocialError(error.message) };
  }

  revalidateTag("profiles:public", { expire: 0 });
  revalidateProfilePaths(await getUsername(parsed.data));
  return { ok: true };
}

export async function unfollowProfile(profileId: string): Promise<ActionResult> {
  const user = await requireUser();

  const limited = await userRateLimitError("follow");
  if (limited) {
    return { ok: false, error: limited };
  }

  const parsed = uuidSchema.safeParse(profileId);
  if (!parsed.success) {
    return { ok: false, error: "That profile could not be found." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", parsed.data);

  if (error) {
    return { ok: false, error: friendlySocialError(error.message) };
  }

  revalidateTag("profiles:public", { expire: 0 });
  revalidateProfilePaths(await getUsername(parsed.data));
  return { ok: true };
}
