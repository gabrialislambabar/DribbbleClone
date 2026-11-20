import { z } from "zod";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const shotCursorSchema = z.object({
  v: z.literal(1),
  type: z.literal("shots"),
  rank: z.number(),
  time: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
  id: z.string().regex(UUID_PATTERN),
});

const designerCursorSchema = z.object({
  v: z.literal(1),
  type: z.literal("designers"),
  rank: z.number(),
  username: z.string().min(1).max(30),
});

export type ShotSearchCursor = z.infer<typeof shotCursorSchema>;
export type DesignerSearchCursor = z.infer<typeof designerCursorSchema>;
export type SearchTab = "shots" | "designers";
export type SearchQuery = {
  query: string;
  error: string | null;
};

export const SEARCH_PAGE_SIZE = 20;
export const SEARCH_TABS: SearchTab[] = ["shots", "designers"];

export function normalizeSearchQuery(raw: string | undefined): SearchQuery {
  const query = (raw ?? "").trim();

  if (!query) {
    return { query: "", error: null };
  }

  if (query.length < 2) {
    return { query, error: "Enter at least 2 characters to search." };
  }

  if (query.length > 100) {
    return { query, error: "Search is limited to 100 characters." };
  }

  return { query, error: null };
}

export function encodeShotSearchCursor(cursor: ShotSearchCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function encodeDesignerSearchCursor(cursor: DesignerSearchCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeShotSearchCursor(raw: string | undefined): ShotSearchCursor | null {
  if (!raw) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as unknown;
    const parsed = shotCursorSchema.safeParse(decoded);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function decodeDesignerSearchCursor(
  raw: string | undefined,
): DesignerSearchCursor | null {
  if (!raw) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as unknown;
    const parsed = designerCursorSchema.safeParse(decoded);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function clean(value: string | undefined, maxLength: number): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export type SearchParams = {
  query: string;
  queryError: string | null;
  tab: SearchTab;
  categoryId: string | null;
  creator: string | null;
  shotCursor: ShotSearchCursor | null;
  designerCursor: DesignerSearchCursor | null;
};

export function parseSearchParams(
  searchParams: Record<string, SearchParamValue>,
): SearchParams {
  const rawQuery = first(searchParams.q);
  const { query, error } = normalizeSearchQuery(rawQuery);
  const rawTab = first(searchParams.type);
  const tab: SearchTab = SEARCH_TABS.includes(rawTab as SearchTab)
    ? (rawTab as SearchTab)
    : "shots";

  return {
    query,
    queryError: error,
    tab,
    categoryId: clean(first(searchParams.category), 64),
    creator: clean(first(searchParams.creator), 30),
    shotCursor: decodeShotSearchCursor(first(searchParams.cursor)),
    designerCursor: decodeDesignerSearchCursor(first(searchParams.cursor)),
  };
}

type SearchHrefParams = {
  query: string;
  tab?: SearchTab;
  categoryId?: string | null;
  creator?: string | null;
  cursor?: string | null;
};

export function buildSearchHref(params: SearchHrefParams): string {
  const search = new URLSearchParams();

  if (params.query) {
    search.set("q", params.query);
  }
  if (params.tab && params.tab !== "shots") {
    search.set("type", params.tab);
  }
  if (params.tab === "shots" || !params.tab) {
    if (params.categoryId) {
      search.set("category", params.categoryId);
    }
    if (params.creator) {
      search.set("creator", params.creator);
    }
  }
  if (params.cursor) {
    search.set("cursor", params.cursor);
  }

  const query = search.toString();
  return query ? `/search?${query}` : "/search";
}
