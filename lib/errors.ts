export type ActionResult<T = void> =
  { ok: true; data?: T } | { ok: false; error: string };

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Rate limit exceeded.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = Math.max(1, Math.ceil(retryAfterSeconds));
  }
}

const DOMAIN_MESSAGES: Record<string, string> = {
  unauthenticated: "You need to be signed in.",
  title_required: "Title is required.",
  title_too_long: "Title must be 100 characters or fewer.",
  description_too_long: "Description must be 2,000 characters or fewer.",
  invalid_category: "Choose a valid category.",
  cover_required: "A cover image is required.",
  too_many_tags: "Use up to 5 tags.",
  tag_too_long: "Tags must be 30 characters or fewer.",
  not_owner: "You do not have permission to change that shot.",
  invalid_status: "That status is not allowed.",
  invalid_cover_url: "That cover image URL is not allowed.",
  unsplash_credit_required: "Unsplash photos need attribution.",
  shots_cover_location: "That cover image path is not allowed.",
  shots_cover_path_owner: "That cover image path is not allowed.",
  shots_external_credit_required: "Unsplash photos need attribution.",
  comments_body_len: "Comment must be between 1 and 1,000 characters.",
  reports_target_matches: "Choose one thing to report.",
  "row-level security policy": "You do not have permission to do that.",
};

const POSTGRES_MESSAGES: Record<string, string> = {
  "23505": "That already exists.",
  "23503": "That item is no longer available.",
  "23514": "That value is not allowed.",
  "42501": "You do not have permission to do that.",
  "22P02": "That identifier is not valid.",
};

const INTERNAL_MARKERS = [
  "duplicate key",
  "violates foreign key",
  "violates check constraint",
  "row-level security",
  "permission denied",
  'relation "',
  'column "',
  "syntax error",
  "invalid input syntax",
  "pgrst",
  "postgrest",
  "jwt",
  "schema cache",
];

export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return minutes > 1
    ? `You're doing that too often. Try again in about ${minutes} minutes.`
    : "You're doing that too often. Try again in a moment.";
}

export function isInternalMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return INTERNAL_MARKERS.some((marker) => normalized.includes(marker));
}

export function toSafeMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof RateLimitError) {
    return rateLimitMessage(error.retryAfterSeconds);
  }

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : null;
  if (code && POSTGRES_MESSAGES[code]) {
    return POSTGRES_MESSAGES[code];
  }

  if (!(error instanceof Error)) {
    return fallback;
  }

  for (const [token, message] of Object.entries(DOMAIN_MESSAGES)) {
    if (error.message.includes(token)) {
      return message;
    }
  }

  if (isInternalMessage(error.message)) {
    return fallback;
  }

  return error.message || fallback;
}
