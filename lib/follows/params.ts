import { z } from "zod";

export const FOLLOW_PAGE_SIZE = 30;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const followCursorSchema = z.object({
  v: z.literal(1),
  time: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
  id: z.string().regex(UUID_PATTERN),
});

export type FollowCursor = z.infer<typeof followCursorSchema>;

export function encodeFollowCursor(cursor: FollowCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeFollowCursor(raw: string | undefined): FollowCursor | null {
  if (!raw) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as unknown;
    const parsed = followCursorSchema.safeParse(decoded);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
