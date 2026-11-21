"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin, requireUser } from "@/lib/auth";
import { toSafeMessage } from "@/lib/errors";
import { logWarn } from "@/lib/observability/logger";
import { userRateLimitError } from "@/lib/rate-limit/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/social";
import { firstZodError } from "@/lib/validation/profile";
import { resolveReportSchema, reportSchema } from "@/lib/validation/moderation";

export type ReportActionState = {
  error?: string;
  success?: string;
};

export type ModerationState = {
  error?: string;
  success?: string;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function reportContent(
  _previousState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const user = await requireUser();

  const limited = await userRateLimitError("report");
  if (limited) {
    return { error: limited };
  }

  const parsed = reportSchema.safeParse({
    target_type: formString(formData, "target_type"),
    shot_id: formString(formData, "shot_id"),
    comment_id: formString(formData, "comment_id"),
    profile_id: formString(formData, "profile_id"),
    reason: formString(formData, "reason"),
    details: formString(formData, "details"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    ...parsed.data,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already reported this." };
    }
    return { error: toSafeMessage(error, "We couldn't submit that report.") };
  }

  revalidatePath("/moderation");
  return { success: "Thanks — our moderators will take a look." };
}

async function loadReportAdmin(reportId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reports")
    .select("id, target_type, shot_id, comment_id, profile_id, status")
    .eq("id", reportId)
    .maybeSingle();

  if (error || !data) {
    return { admin, report: null };
  }

  return { admin, report: data };
}

export async function dismissReport(
  _previousState: ModerationState,
  formData: FormData,
): Promise<ModerationState> {
  const adminUser = await requireAdmin();
  const reportId = uuidSchema.safeParse(formString(formData, "report_id"));

  if (!reportId.success) {
    return { error: "That report could not be found." };
  }

  const { admin, report } = await loadReportAdmin(reportId.data);

  if (!report) {
    return { error: "That report could not be found." };
  }

  const parsed = resolveReportSchema.safeParse({
    status: "dismissed",
    note: formString(formData, "note"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const { error } = await admin
    .from("reports")
    .update({
      status: parsed.data.status,
      resolution_note: parsed.data.note,
      resolved_by: adminUser.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", report.id);

  if (error) {
    return { error: toSafeMessage(error, "We couldn't update that report.") };
  }

  logWarn("moderation.dismiss", "report dismissed", {
    reportId: report.id,
    adminId: adminUser.id,
  });
  revalidatePath("/moderation");
  return { success: "Report dismissed." };
}

export async function takeDownTarget(
  _previousState: ModerationState,
  formData: FormData,
): Promise<ModerationState> {
  const adminUser = await requireAdmin();
  const reportId = uuidSchema.safeParse(formString(formData, "report_id"));

  if (!reportId.success) {
    return { error: "That report could not be found." };
  }

  const { admin, report } = await loadReportAdmin(reportId.data);

  if (!report) {
    return { error: "That report could not be found." };
  }

  const parsed = resolveReportSchema.safeParse({
    status: "actioned",
    note: formString(formData, "note"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  if (report.target_type === "shot" && report.shot_id) {
    const { error } = await admin
      .from("shots")
      .update({ status: "draft", published_at: null })
      .eq("id", report.shot_id);

    if (error) {
      return { error: toSafeMessage(error, "We couldn't take down that shot.") };
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/shots/${report.shot_id}`);
    revalidateTag("shots:feed", { expire: 0 });
  } else if (report.target_type === "comment" && report.comment_id) {
    const { data: comment } = await admin
      .from("comments")
      .select("shot_id")
      .eq("id", report.comment_id)
      .maybeSingle();

    const { error } = await admin.from("comments").delete().eq("id", report.comment_id);

    if (error) {
      return { error: toSafeMessage(error, "We couldn't remove that comment.") };
    }

    if (comment?.shot_id) {
      revalidatePath(`/shots/${comment.shot_id}`);
      revalidateTag("shots:feed", { expire: 0 });
    }
  } else {
    return { error: "Profile takedowns are not supported yet." };
  }

  const { error } = await admin
    .from("reports")
    .update({
      status: parsed.data.status,
      resolution_note: parsed.data.note,
      resolved_by: adminUser.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", report.id);

  if (error) {
    return { error: toSafeMessage(error, "We couldn't update that report.") };
  }

  logWarn("moderation.takeDown", "content taken down", {
    reportId: report.id,
    targetType: report.target_type,
    adminId: adminUser.id,
  });
  revalidatePath("/moderation");
  return { success: "Content taken down." };
}
