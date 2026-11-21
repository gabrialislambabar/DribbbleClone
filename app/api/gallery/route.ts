import { NextRequest, NextResponse } from "next/server";

import { parseGalleryFilters } from "@/lib/gallery/params";
import { enforceGalleryRateLimit, searchGallery } from "@/lib/gallery/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side proxy for the design discovery gallery. Keys stay on the server;
 * the browser only ever sees normalized metadata and provider CDN URLs.
 */
export async function GET(request: NextRequest) {
  const retryAfter = await enforceGalleryRateLimit();

  if (retryAfter) {
    return NextResponse.json(
      { error: "Too many gallery searches. Please try again shortly." },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }

  const filters = parseGalleryFilters(request.nextUrl.searchParams);

  try {
    const result = await searchGallery(filters);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "The gallery is unavailable right now." },
      { status: 502 },
    );
  }
}
