import { NextRequest, NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/env";
import { RateLimitError } from "@/lib/errors";
import { enforceAnonRateLimit } from "@/lib/rate-limit/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUERY_LENGTH = 80;
const MIN_QUERY_LENGTH = 2;

type UnsplashPhoto = {
  id?: unknown;
  urls?: { small?: unknown; regular?: unknown };
  alt_description?: unknown;
  user?: { name?: unknown; links?: { html?: unknown } };
  links?: { html?: unknown; download_location?: unknown };
};

function safeString(value: unknown, maxLength: number): string | null {
  return typeof value === "string" && value.length > 0 ? value.slice(0, maxLength) : null;
}

function toPhoto(photo: UnsplashPhoto) {
  const id = safeString(photo.id, 64);
  const small = safeString(photo.urls?.small, 2048);
  const regular = safeString(photo.urls?.regular, 2048);

  if (!id || !small || !regular) {
    return null;
  }

  return {
    id,
    urls: { small, regular },
    alt_description: safeString(photo.alt_description, 500),
    user: {
      name: safeString(photo.user?.name, 120) ?? "Unsplash contributor",
      links: {
        html: safeString(photo.user?.links?.html, 2048),
      },
    },
    links: {
      html: safeString(photo.links?.html, 2048),
      download_location: safeString(photo.links?.download_location, 2048),
    },
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== getSiteUrl()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawQuery = request.nextUrl.searchParams.get("query")?.trim() ?? "";

  if (rawQuery.length < MIN_QUERY_LENGTH || rawQuery.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      {
        error: `Search needs between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters.`,
      },
      { status: 400 },
    );
  }

  try {
    await enforceAnonRateLimit("unsplashSearch");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Too many image searches. Please try again shortly." },
        {
          status: 429,
          headers: { "retry-after": String(error.retryAfterSeconds) },
        },
      );
    }
    throw error;
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    return NextResponse.json(
      { error: "Image search is not configured" },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(rawQuery)}&per_page=20`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) {
      console.warn(`[unsplash] upstream responded ${response.status}`);
      return NextResponse.json({ error: "Image search is unavailable" }, { status: 502 });
    }

    const data = (await response.json()) as {
      results?: UnsplashPhoto[];
      total?: unknown;
    };

    const results = (data.results ?? [])
      .map(toPhoto)
      .filter((photo): photo is NonNullable<typeof photo> => photo !== null);

    return NextResponse.json({
      results,
      total: typeof data.total === "number" ? data.total : results.length,
    });
  } catch {
    console.warn("[unsplash] request failed");
    return NextResponse.json({ error: "Image search is unavailable" }, { status: 502 });
  }
}
