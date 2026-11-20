import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "cache-control": "no-store" };
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    return NextResponse.json(
      { ok: false, error: "SENTRY_DSN is not set." },
      { status: 503, headers },
    );
  }

  try {
    const url = new URL(dsn);
    const { hostname, pathname, protocol } = url;

    if (protocol !== "https:" || !/sin[go]\.io$|sentry\.io$/.test(hostname)) {
      return NextResponse.json(
        { ok: false, error: "That DSN does not look like a Sentry DSN." },
        { status: 400, headers },
      );
    }

    const projectId = pathname.split("/").filter(Boolean).pop() ?? "";

    if (!/^\d+$/.test(projectId)) {
      return NextResponse.json(
        { ok: false, error: "That DSN is missing a project id." },
        { status: 400, headers },
      );
    }

    return NextResponse.json({ ok: true, host: hostname, projectId }, { headers });
  } catch {
    return NextResponse.json(
      { ok: false, error: "SENTRY_DSN is not a valid URL." },
      { status: 400, headers },
    );
  }
}
