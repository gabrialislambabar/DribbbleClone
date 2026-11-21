import {
  GALLERY_CATEGORIES,
  type GalleryCategory,
  type GalleryFilters,
  type GallerySort,
  type GallerySource,
  isGallerySource,
} from "@/lib/gallery/types";

export const DEFAULT_GALLERY_CATEGORY = GALLERY_CATEGORIES[0].slug;
export const MAX_QUERY_LENGTH = 80;
export const MAX_PAGE = 20;

export const ACTIVE_PROVIDERS: GallerySource[] = [
  "pexels",
  "unsplash",
  "openverse",
  "pixabay",
];

function read(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
  key: string,
): string | undefined {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }

  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseGalleryFilters(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
): GalleryFilters {
  const query = (read(params, "q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const rawCategory = read(params, "category");

  const category =
    GALLERY_CATEGORIES.find((item) => item.slug === rawCategory)?.slug ??
    DEFAULT_GALLERY_CATEGORY;

  const rawSort = read(params, "sort");
  const sort: GallerySort =
    rawSort === "source" || rawSort === "title" ? rawSort : "featured";

  const rawOrientation = read(params, "orientation");
  const orientation =
    rawOrientation === "landscape" ||
    rawOrientation === "portrait" ||
    rawOrientation === "square"
      ? rawOrientation
      : "any";

  const sources = Array.from(
    new Set(
      (read(params, "sources") ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(isGallerySource),
    ),
  );

  const rawPage = Number(read(params, "page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, MAX_PAGE) : 1;

  return {
    query,
    category,
    sort,
    orientation,
    sources: sources.length > 0 ? sources : [...ACTIVE_PROVIDERS],
    page,
  };
}

export function buildGalleryHref(filters: GalleryFilters): string {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.category !== DEFAULT_GALLERY_CATEGORY) {
    params.set("category", filters.category);
  }
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  if (filters.orientation !== "any") {
    params.set("orientation", filters.orientation);
  }

  const allSources =
    filters.sources.length === ACTIVE_PROVIDERS.length &&
    ACTIVE_PROVIDERS.every((source) => filters.sources.includes(source));

  if (!allSources) {
    params.set("sources", filters.sources.join(","));
  }

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const query = params.toString();
  return query ? `/gallery?${query}` : "/gallery";
}

export function getGalleryCategory(slug: string): GalleryCategory {
  return GALLERY_CATEGORIES.find((item) => item.slug === slug) ?? GALLERY_CATEGORIES[0];
}

/**
 * Picks the term for the current page. Each category has several distinct
 * terms so successive pages do not repeat the same image set.
 */
export function termForFilters(filters: GalleryFilters): string {
  if (filters.query) {
    return filters.query;
  }

  const category = getGalleryCategory(filters.category);
  return category.terms[(filters.page - 1) % category.terms.length];
}
