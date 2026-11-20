import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { RateLimitError, toSafeMessage } from "@/lib/errors";
import {
  RATE_LIMITS,
  type AnonymousRateLimitAction,
  type RateLimitAction,
} from "@/lib/rate-limit/config";
import { consumeMemoryRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit/memory";
import { createClient } from "@/lib/supabase/server";

type RateLimitRow = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
};

export const getClientIp = cache(async (): Promise<string> => {
  return getClientIpFromHeaders(await headers());
});

/**
 * Anonymous buckets live in module memory, so limits are per server instance.
 * Use a platform-level WAF when distributed accuracy is required.
 */
export async function enforceAnonRateLimit(
  action: AnonymousRateLimitAction,
): Promise<void> {
  const config = RATE_LIMITS[action];
  const ip = await getClientIp();
  const result = consumeMemoryRateLimit(
    `${action}:${ip}`,
    config.limit,
    config.windowSeconds,
  );

  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterSeconds);
  }
}

export async function enforceUserRateLimit(action: RateLimitAction): Promise<void> {
  const config = RATE_LIMITS[action];
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_action: action,
    p_limit: config.limit,
    p_window_seconds: config.windowSeconds,
  });

  if (error) {
    // Fail open when the limiter itself is unavailable so a migration or
    // database hiccup cannot take the whole product down.
    console.warn(`[rate-limit] ${action} check failed: ${error.message}`);
    return;
  }

  const row = (data as RateLimitRow[] | null)?.[0];

  if (row && !row.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((new Date(row.reset_at).getTime() - Date.now()) / 1000),
    );

    throw new RateLimitError(retryAfterSeconds);
  }
}

export async function anonRateLimitError(
  action: AnonymousRateLimitAction,
): Promise<string | null> {
  try {
    await enforceAnonRateLimit(action);
    return null;
  } catch (error) {
    if (error instanceof RateLimitError) {
      return toSafeMessage(error);
    }
    throw error;
  }
}

export async function userRateLimitError(
  action: RateLimitAction,
): Promise<string | null> {
  try {
    await enforceUserRateLimit(action);
    return null;
  } catch (error) {
    if (error instanceof RateLimitError) {
      return toSafeMessage(error);
    }
    throw error;
  }
}
