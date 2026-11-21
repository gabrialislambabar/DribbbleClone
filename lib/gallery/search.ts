import "server-only";

import {
  GALLERY_PAGE_SIZE,
  type GalleryFilters,
  type GalleryItem,
  type GalleryProviderResult,
  type GallerySort,
  type GallerySource,
} from "@/lib/gallery/types";
import { PROVIDER_SEARCH, isProviderConfigured } from "@/lib/gallery/providers";
import { consumeMemoryRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit/memory";
import { termForFilters } from "@/lib/gallery/params";
import { headers } from "next/headers";

export type GalleryResult = {
  items: GalleryItem[];
  /** Providers that failed, with a friendly message each. */
  unavailable: { source: GallerySource; message: string }[];
  /** Providers with no key configured. */
  unconfigured: GallerySource[];
  /** True when every enabled provider failed. */
  degraded: boolean;
  page: number;
  hasMore: boolean;
};

function normalizeForDedupe(item: GalleryItem): string {
  try {
    const url = new URL(item.imageUrl);
    return `${url.hostname}${url.pathname}`.toLowerCase();
  } catch {
    return `${item.source}:${item.sourceItemId}`;
  }
}

export function dedupeItems(items: GalleryItem[]): GalleryItem[] {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const unique: GalleryItem[] = [];

  for (const item of items) {
    if (seenIds.has(item.id)) {
      continue;
    }

    const normalized = normalizeForDedupe(item);

    if (seenUrls.has(normalized)) {
      continue;
    }

    seenIds.add(item.id);
    seenUrls.add(normalized);
    unique.push(item);
  }

  return unique;
}

export function sortItems(items: GalleryItem[], sort: GallerySort): GalleryItem[] {
  const sorted = [...items];

  if (sort === "title") {
    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (sort === "source") {
    return sorted.sort(
      (a, b) => a.source.localeCompare(b.source) || a.title.localeCompare(b.title),
    );
  }

  // Featured: round-robin across providers so the first rows are varied.
  const buckets = new Map<GallerySource, GalleryItem[]>();

  for (const item of sorted) {
    const bucket = buckets.get(item.source) ?? [];
    bucket.push(item);
    buckets.set(item.source, bucket);
  }

  const queues = [...buckets.values()];
  const mixed: GalleryItem[] = [];
  let index = 0;

  while (queues.some((queue) => index < queue.length)) {
    for (const queue of queues) {
      if (index < queue.length) {
        mixed.push(queue[index]);
      }
    }
    index += 1;
  }

  return mixed;
}

export async function searchGallery(filters: GalleryFilters): Promise<GalleryResult> {
  const term = termForFilters(filters);
  const enabled = filters.sources.filter(isProviderConfigured);
  const unconfigured = filters.sources.filter((source) => !isProviderConfigured(source));

  if (enabled.length === 0) {
    return {
      items: [],
      unavailable: [],
      unconfigured,
      degraded: true,
      page: filters.page,
      hasMore: false,
    };
  }

  const results: GalleryProviderResult[] = await Promise.all(
    enabled.map((source) =>
      PROVIDER_SEARCH[source](term, filters.page, filters.orientation, filters.category),
    ),
  );

  const items = sortItems(
    dedupeItems(results.flatMap((result) => result.items)),
    filters.sort,
  );

  const unavailable = results
    .filter((result) => result.error)
    .map((result) => ({
      source: result.source,
      message: result.error ?? "Unavailable.",
    }));

  return {
    items: items.slice(0, GALLERY_PAGE_SIZE),
    unavailable,
    unconfigured,
    degraded: unavailable.length === results.length,
    page: filters.page,
    hasMore: results.some((result) => result.items.length >= 8),
  };
}

/**
 * Anonymous per-IP throttle for the gallery route. Deliberately generous: the
 * gallery shells out to several providers that all have their own limits.
 */
export async function enforceGalleryRateLimit(): Promise<number | null> {
  const requestHeaders = await headers();
  const ip = getClientIpFromHeaders(requestHeaders);
  const result = consumeMemoryRateLimit(`gallery:${ip}`, 30, 60);

  return result.allowed ? null : result.retryAfterSeconds;
}
