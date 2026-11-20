type Bucket = {
  count: number;
  resetAt: number;
};

export type MemoryRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const MAX_ENTRIES = 10_000;
const PRUNE_INTERVAL = 500;

const buckets = new Map<string, Bucket>();
let callsSincePrune = 0;

function prune(now: number, force = false): void {
  callsSincePrune += 1;

  if (!force && callsSincePrune < PRUNE_INTERVAL && buckets.size <= MAX_ENTRIES) {
    return;
  }

  callsSincePrune = 0;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  if (buckets.size > MAX_ENTRIES) {
    const overflow = buckets.size - MAX_ENTRIES;
    let removed = 0;

    for (const key of buckets.keys()) {
      buckets.delete(key);
      removed += 1;

      if (removed >= overflow) {
        break;
      }
    }
  }
}

export function consumeMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  now = Date.now(),
): MemoryRateLimitResult {
  prune(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });

    return { allowed: true, retryAfterSeconds: windowSeconds };
  }

  existing.count += 1;

  return {
    allowed: existing.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const candidate =
    forwarded?.split(",")[0]?.trim() ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    "unknown";

  return candidate.slice(0, 64) || "unknown";
}
