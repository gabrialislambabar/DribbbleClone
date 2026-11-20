import { decodeFeedCursor, type FeedCursor } from "@/lib/feed/cursor";

export const FEED_PAGE_SIZE = 24;
export const FEED_SORTS = ["newest", "popular", "trending"] as const;
export type FeedSort = (typeof FEED_SORTS)[number];
export type FeedDays = 7 | 30 | 90;
export const FEED_DAYS: FeedDays[] = [7, 30, 90];

export type FeedParams = {
  sort: FeedSort;
  categoryId: string | null;
  tag: string | null;
  creator: string | null;
  days: FeedDays | null;
  cursor: FeedCursor | null;
};

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function clean(value: string | undefined, maxLength: number): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export function isFeedSort(value: string | undefined): value is FeedSort {
  return FEED_SORTS.includes(value as FeedSort);
}

export function parseFeedParams(
  searchParams: Record<string, SearchParamValue>,
): FeedParams {
  const rawSort = first(searchParams.sort);
  const sort: FeedSort = isFeedSort(rawSort) ? rawSort : "newest";
  const rawDays = Number(first(searchParams.days));
  const days = FEED_DAYS.includes(rawDays as FeedDays) ? (rawDays as FeedDays) : null;

  return {
    sort,
    categoryId: clean(first(searchParams.category), 64),
    tag: clean(first(searchParams.tag), 30),
    creator: clean(first(searchParams.creator), 30),
    days: sort === "newest" ? null : days,
    cursor: decodeFeedCursor(first(searchParams.cursor), sort),
  };
}

type FeedHrefParams = {
  sort: FeedSort;
  categoryId?: string | null;
  tag?: string | null;
  creator?: string | null;
  days?: FeedDays | null;
  cursor?: string | null;
};

export function buildFeedHref(params: FeedHrefParams): string {
  const search = new URLSearchParams();

  if (params.sort !== "newest") {
    search.set("sort", params.sort);
  }
  if (params.categoryId) {
    search.set("category", params.categoryId);
  }
  if (params.tag) {
    search.set("tag", params.tag);
  }
  if (params.creator) {
    search.set("creator", params.creator);
  }
  if (params.sort !== "newest" && params.days) {
    search.set("days", String(params.days));
  }
  if (params.cursor) {
    search.set("cursor", params.cursor);
  }

  const query = search.toString();
  return query ? `/?${query}` : "/";
}
