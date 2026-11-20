import "server-only";

import * as Sentry from "@sentry/nextjs";

import { redactRecord } from "@/lib/observability/scrub";

type PostgresErrorLike = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (error && typeof error === "object") {
    const value = error as PostgresErrorLike;
    const message = value.message ?? "Unknown error";

    if (value.code || value.details || value.hint) {
      const wrapped = new Error(`${message}${value.code ? ` (code ${value.code})` : ""}`);
      wrapped.name = "SupabaseError";
      return wrapped;
    }

    return new Error(message);
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("Unknown error");
}

export function logError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  const normalized = normalizeError(error);
  const safeExtra = redactRecord(extra);

  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}] ${normalized.message}`, safeExtra ?? "");
  }

  Sentry.captureException(normalized, {
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
