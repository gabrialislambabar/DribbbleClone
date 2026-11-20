import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_ROUTES = [
  /^\/settings(?:\/|$)/,
  /^\/dashboard(?:\/|$)/,
  /^\/shots\/new$/,
  /^\/shots\/[^/]+\/edit$/,
];

const AUTH_ROUTES = new Set(["/sign-in", "/sign-up"]);

export async function proxy(request: NextRequest) {
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
