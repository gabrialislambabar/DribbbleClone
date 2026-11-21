import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "cache-control": "no-store" };

  const key = process.env.UNSPLASH_ACCESS_KEY;

  if (!key) {
    return NextResponse.json(
      { ok: false, error: "UNSPLASH_ACCESS_KEY is not set." },
      { status: 503, headers },
    );
  }

  try {
    const response = await fetch("https://api.unsplash.com/photos?per_page=1", {
      headers: {
        Authorization: `Client-ID ${key}`,
        "Accept-Version": "v1",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 401) {
      return NextResponse.json(
        { ok: false, error: "Unsplash rejected the access key." },
        { status: 502, headers },
      );
    }

    if (response.status === 403) {
      return NextResponse.json(
        { ok: false, error: "Unsplash rate limit reached." },
        { status: 429, headers },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: `Unsplash responded ${response.status}.` },
        { status: 502, headers },
      );
    }

    const remaining = response.headers.get("x-ratelimit-remaining");

    return NextResponse.json(
      {
        ok: true,
        rateLimitRemaining: remaining ? Number.parseInt(remaining, 10) : null,
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not reach Unsplash." },
      { status: 502, headers },
    );
  }
}
