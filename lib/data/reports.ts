import "server-only";

import { logError } from "@/lib/observability/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReportItem } from "@/lib/types/app";

const REPORT_SELECT = `
  id,
  target_type,
  reason,
  details,
  status,
  created_at,
  reporter:profiles!reports_reporter_id_fkey(username, display_name),
  shot:shots!reports_shot_id_fkey(
    id,
    title,
    status,
    creator:profiles!shots_creator_id_fkey(username, display_name)
  ),
  comment:comments!reports_comment_id_fkey(
    id,
    body,
    shot_id,
    author:profiles!comments_author_id_fkey(username, display_name)
  ),
  profile:profiles!reports_profile_id_fkey(username, display_name)
`;

type RawReport = {
  id: string;
  target_type: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter: { username: string; display_name: string } | null;
  shot: {
    id: string;
    title: string;
    status: string;
    creator: { username: string; display_name: string } | null;
  } | null;
  comment: {
    id: string;
    body: string;
    shot_id: string;
    author: { username: string; display_name: string } | null;
  } | null;
  profile: { username: string; display_name: string } | null;
};

export async function getOpenReports(): Promise<ReportItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reports")
    .select(REPORT_SELECT)
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    logError("data.reports", error);
    throw new Error("We couldn't load reports right now.");
  }

  return ((data ?? []) as unknown as RawReport[]).map((row) => ({
    id: row.id,
    target_type: row.target_type as ReportItem["target_type"],
    reason: row.reason as ReportItem["reason"],
    details: row.details,
    status: row.status as ReportItem["status"],
    created_at: row.created_at,
    reporter: row.reporter,
    shot: row.shot
      ? {
          id: row.shot.id,
          title: row.shot.title,
          status: row.shot.status,
          creator_username: row.shot.creator?.username ?? "unknown",
          creator_display_name: row.shot.creator?.display_name ?? "Unknown designer",
        }
      : null,
    comment: row.comment
      ? {
          id: row.comment.id,
          body: row.comment.body,
          shot_id: row.comment.shot_id,
          author_username: row.comment.author?.username ?? "unknown",
          author_display_name: row.comment.author?.display_name ?? "Unknown designer",
        }
      : null,
    profile: row.profile,
  }));
}
