import { z } from "zod";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const NOTIFICATION_PAGE_SIZE = 20;

const notificationCursorSchema = z.object({
  v: z.literal(1),
  time: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
  id: z.string().regex(UUID_PATTERN),
});

export type NotificationCursor = z.infer<typeof notificationCursorSchema>;

export function encodeNotificationCursor(cursor: NotificationCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeNotificationCursor(
  raw: string | undefined,
): NotificationCursor | null {
  if (!raw) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as unknown;
    const parsed = notificationCursorSchema.safeParse(decoded);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function buildNotificationsHref(cursor: string | null): string {
  return cursor ? `/notifications?cursor=${cursor}` : "/notifications";
}
