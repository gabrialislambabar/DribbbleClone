const TRANSIENT_PATTERNS = [
  "fetch failed",
  "econnreset",
  "etimedout",
  "eai_again",
  "enotfound",
  "socket hang up",
  "network",
  "und_err",
  "other side closed",
  "aborterror",
];

/**
 * Supabase reads go over HTTPS, so a brief DNS/TCP hiccup surfaces as
 * `TypeError: fetch failed`. Retrying a couple of times keeps a single blip
 * from 500-ing an otherwise healthy page.
 */
export function isTransientNetworkError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.message} ${error.name}`
      : typeof error === "string"
        ? error
        : "";

  const normalized = message.toLowerCase();
  return TRANSIENT_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
  delayMs = 120,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !isTransientNetworkError(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}
