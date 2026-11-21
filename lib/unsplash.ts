import "server-only";

import { after } from "next/server";

import { logWarn } from "@/lib/observability/logger";

/**
 * Unsplash requires triggering the photo's download endpoint when a photo is
 * used. This is best-effort and never blocks or fails the mutation.
 */
export function trackUnsplashDownload(location: string | null | undefined): void {
  if (!location) {
    return;
  }

  after(async () => {
    const key = process.env.UNSPLASH_ACCESS_KEY;

    if (!key) {
      return;
    }

    try {
      const target = new URL(location);

      if (
        target.protocol !== "https:" ||
        target.hostname !== "api.unsplash.com" ||
        !target.pathname.startsWith("/photos/") ||
        !target.pathname.endsWith("/download")
      ) {
        return;
      }

      target.searchParams.set("client_id", key);

      const response = await fetch(target, {
        headers: { "Accept-Version": "v1" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        logWarn("unsplash.download", `download tracking failed with ${response.status}`);
      }
    } catch {
      logWarn("unsplash.download", "download tracking request failed");
    }
  });
}
