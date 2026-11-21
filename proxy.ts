import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { RATE_LIMITS } from "@/lib/rate-limit/config";
import { consumeMemoryRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit/memory";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_ROUTES = [
  /^\/settings(?:\/|$)/,
  /^\/dashboard(?:\/|$)/,
  /^\/shots\/new$/,
  /^\/shots\/[^/]+\/edit$/,
  /^\/notifications(?:\/|$)/,
  /^\/moderation(?:\/|$)/,
];

const AUTH_ROUTES = new Set(["/sign-in", "/sign-up"]);

function throttlePublicSearch(request: NextRequest) {
  if (request.method !== "GET" || request.nextUrl.pathname !== "/search") {
    return null;
  }

  const config = RATE_LIMITS.publicSearch;
  const ip = getClientIpFromHeaders(request.headers);
  const result = consumeMemoryRateLimit(
    `publicSearch:${ip}`,
    config.limit,
    config.windowSeconds,
  );

  if (result.allowed) {
    return null;
  }

  return new NextResponse("Too many searches. Please try again in a moment.", {
    status: 429,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "retry-after": String(result.retryAfterSeconds),
      "cache-control": "no-store",
    },
  });
}

export async function proxy(request: NextRequest) {
  const throttled = throttlePublicSearch(request);
  if (throttled) {
    return throttled;
  }

  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (user && AUTH_ROUTES.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const isProtected = PROTECTED_ROUTES.some((pattern) => pattern.test(pathname));
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
