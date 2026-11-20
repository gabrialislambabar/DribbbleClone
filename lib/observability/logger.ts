import "server-only";

import * as Sentry from "@sentry/nextjs";

import { redactRecord } from "@/lib/observability/scrub";

export function logError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  const safeExtra = redactRecord(extra);

  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}]`, error, safeExtra ?? "");
  }

  Sentry.captureException(error, {
    tags: { context },
    extra: safeExtra,
  });
}

export function logWarn(
  context: string,
  message: string,
  extra?: Record<string, unknown>,
): void {
  console.warn(`[${context}] ${message}`, redactRecord(extra) ?? "");
  Sentry.addBreadcrumb({
    category: "app",
    level: "warning",
    message: `${context}: ${message}`,
    data: redactRecord(extra),
  });
}
