import { z } from "zod";

import type { FeedSort } from "@/lib/feed/params";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const feedCursorSchema = z.object({
  v: z.literal(1),
  sort: z.enum(["newest", "popular", "trending"]),
  score: z.number().nullable(),
  time: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid cursor time.",
  }),
  id: z.string().regex(UUID_PATTERN),
});

export type FeedCursor = z.infer<typeof feedCursorSchema>;

export function encodeFeedCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeFeedCursor(
  raw: string | undefined,
  sort: FeedSort,
): FeedCursor | null {
  if (!raw) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as unknown;
    const parsed = feedCursorSchema.safeParse(decoded);

    if (!parsed.success || parsed.data.sort !== sort) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}
