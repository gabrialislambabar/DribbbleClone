export const RATE_LIMITS = {
  // Anonymous, keyed by client IP.
  auth: { limit: 10, windowSeconds: 600 },
  signUp: { limit: 5, windowSeconds: 3600 },
  unsplashSearch: { limit: 20, windowSeconds: 60 },
  publicSearch: { limit: 60, windowSeconds: 60 },

  // Authenticated, enforced by public.consume_rate_limit.
  shotCreate: { limit: 10, windowSeconds: 3600 },
  shotUpdate: { limit: 30, windowSeconds: 3600 },
  shotStatus: { limit: 60, windowSeconds: 3600 },
  shotDelete: { limit: 30, windowSeconds: 3600 },
  profileUpdate: { limit: 10, windowSeconds: 3600 },
  accountDelete: { limit: 3, windowSeconds: 3600 },
  like: { limit: 60, windowSeconds: 60 },
  comment: { limit: 10, windowSeconds: 60 },
  commentEdit: { limit: 20, windowSeconds: 60 },
  commentDelete: { limit: 30, windowSeconds: 60 },
  follow: { limit: 30, windowSeconds: 60 },
  report: { limit: 10, windowSeconds: 3600 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;
export type AnonymousRateLimitAction =
  "auth" | "signUp" | "unsplashSearch" | "publicSearch";
