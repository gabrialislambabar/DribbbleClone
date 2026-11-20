import "server-only";

import { cache } from "react";

import { logError } from "@/lib/observability/logger";
import {
  encodeNotificationCursor,
  NOTIFICATION_PAGE_SIZE,
  type NotificationCursor,
} from "@/lib/notifications/params";
import { createClient } from "@/lib/supabase/server";
import type { NotificationItem, NotificationPreferences } from "@/lib/types/app";

const NOTIFICATION_SELECT = `
  id,
  type,
  read_at,
  created_at,
  shot_id,
  comment_id,
  actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_path),
  shot:shots!notifications_shot_id_fkey(id, title),
  comment:comments!notifications_comment_id_fkey(id, body)
`;

type RawNotification = {
  id: string;
  type: string;
  read_at: string | null;
  created_at: string;
  shot_id: string | null;
  comment_id: string | null;
  actor: {
    username: string;
    display_name: string;
    avatar_path: string | null;
  } | null;
  shot: { id: string; title: string } | null;
  comment: { id: string; body: string } | null;
};

function hrefFor(row: RawNotification): string {
  if (row.type === "follow" && row.actor) {
    return `/u/${row.actor.username}`;
  }

  if (row.type === "comment" && row.shot_id) {
    return `/shots/${row.shot_id}${row.comment_id ? `#comment-${row.comment_id}` : ""}`;
  }

  return "/notifications";
}

function mapNotification(row: RawNotification): NotificationItem {
  return {
    id: row.id,
    type: row.type as NotificationItem["type"],
    read_at: row.read_at,
    created_at: row.created_at,
    shot_id: row.shot_id,
    comment_id: row.comment_id,
    actor: row.actor,
    shot: row.shot,
    comment: row.comment,
    href: hrefFor(row),
  };
}

export type NotificationPage = {
  items: NotificationItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

export async function getNotifications(
  userId: string,
  cursor: NotificationCursor | null,
): Promise<NotificationPage> {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(NOTIFICATION_PAGE_SIZE + 1);

  if (cursor) {
    query = query.or(
      `created_at.lt."${cursor.time}",and(created_at.eq."${cursor.time}",id.lt."${cursor.id}")`,
    );
  }

  const { data, error } = await query;

  if (error) {
    logError("data.notifications", error);
    throw new Error("We couldn't load your notifications right now.");
  }

  const rows = (data ?? []) as unknown as RawNotification[];
  const hasMore = rows.length > NOTIFICATION_PAGE_SIZE;
  const pageRows = rows.slice(0, NOTIFICATION_PAGE_SIZE);
  const last = pageRows.at(-1);

  return {
    items: pageRows.map(mapNotification),
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeNotificationCursor({
            v: 1,
            time: last.created_at,
            id: last.id,
          })
        : null,
  };
}

export const getUnreadCount = cache(async (userId: string): Promise<number> => {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error) {
    logError("data.notifications.unread", error);
    return 0;
  }

  return count ?? 0;
});

export const getNotificationPreferences = cache(
  async (userId: string): Promise<NotificationPreferences> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("notification_preferences")
      .select("follows, comments")
      .eq("user_id", userId)
      .maybeSingle();

    return {
      follows: data?.follows ?? true,
      comments: data?.comments ?? true,
    };
  },
);
