import "server-only";

import { getServiceRoleKey, getSupabaseUrl } from "@/lib/env";
import { logWarn } from "@/lib/observability/logger";

type ShotEvent = "comment:new" | "comment:updated" | "comment:deleted" | "like:changed";

export async function broadcastToShot(
  shotId: string,
  event: ShotEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const key = getServiceRoleKey();
    const response = await fetch(`${getSupabaseUrl()}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: key,
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `shot:${shotId}`,
            event,
            payload,
            private: true,
          },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      logWarn("realtime.broadcast", `broadcast failed with ${response.status}`, {
        shotId,
        event,
      });
    }
  } catch {
    logWarn("realtime.broadcast", "broadcast request failed", { shotId, event });
  }
}
