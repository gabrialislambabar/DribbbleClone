import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CHECKS = [
  {
    provider: "pexels",
    env: "PEXELS_API_KEY",
    url: "https://api.pexels.com/v1/curated?per_page=1",
    headers: () => ({
      Authorization: process.env.PEXELS_API_KEY ?? "",
    }),
  },
  {
    provider: "pixabay",
    env: "PIXABAY_API_KEY",
    url: `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY ?? ""}&per_page=3`,
    headers: () => ({}),
  },
  {
    provider: "openverse",
    env: null,
    url: "https://api.openverse.org/v1/images/?q=design&page_size=1",
    headers: () => ({ Accept: "application/json" }),
  },
] as const;

/**
 * Reports which gallery sources are reachable without leaking key values.
 * Openverse works anonymously; the rest need their server-only key.
 */
export async function GET() {
  const headers = { "cache-control": "no-store" };

  const results = await Promise.all(
    CHECKS.map(async (check) => {
      if (check.env && !process.env[check.env]) {
        return { provider: check.provider, status: "unconfigured" };
      }

      try {
        const response = await fetch(check.url, {
          headers: check.headers(),
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });

        if (response.status === 401 || response.status === 403) {
          return {
            provider: check.provider,
            status:
              response.status === 403 ? "rate-limited" : "invalid-key",
          };
        }

        if (!response.ok) {
          return { provider: check.provider, status: `http-${response.status}` };
        }

        return { provider: check.provider, status: "ok" };
      } catch {
        return { provider: check.provider, status: "unreachable" };
      }
    }),
  );

  const unsplash = process.env.UNSPLASH_ACCESS_KEY
    ? { provider: "unsplash", status: "configured" }
    : { provider: "unsplash", status: "unconfigured" };

  const anyOk = results.some(
    (result) => result.status === "ok" || result.status === "configured",
  );

  return NextResponse.json(
    { ok: anyOk, sources: [...results, unsplash] },
    { status: anyOk ? 200 : 503, headers },
  );
}
