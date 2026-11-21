import type { ShotListItem } from "@/lib/types/app";

export type ExploreSort = "popular" | "newest";

export type ExploreTimeframe = "now" | "week" | "month" | "year" | "all";

export type ExploreCategorySlug =
  | "discover"
  | "animation"
  | "branding"
  | "illustration"
  | "mobile"
  | "print"
  | "product-design"
  | "typography"
  | "web-design";

export type ExploreCategory = {
  slug: ExploreCategorySlug;
  label: string;
  categoryId?: string;
  tag?: string;
};

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  { slug: "discover", label: "Discover" },
  { slug: "animation", label: "Animation", categoryId: "animation" },
  { slug: "branding", label: "Branding", categoryId: "branding" },
  { slug: "illustration", label: "Illustration", categoryId: "illustration" },
  { slug: "mobile", label: "Mobile", categoryId: "mobile-design" },
  { slug: "print", label: "Print", tag: "print" },
  {
    slug: "product-design",
    label: "Product Design",
    categoryId: "product-design",
  },
  { slug: "typography", label: "Typography", tag: "typography" },
  { slug: "web-design", label: "Web Design", categoryId: "web-design" },
];

export const EXPLORE_SORTS: { value: ExploreSort; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "New & Noteworthy" },
];

export const EXPLORE_TIMEFRAMES: {
  value: ExploreTimeframe;
  label: string;
}[] = [
  { value: "now", label: "Now" },
  { value: "week", label: "This Past Week" },
  { value: "month", label: "This Past Month" },
  { value: "year", label: "This Past Year" },
  { value: "all", label: "All Time" },
];

export const COLOR_PALETTE = [
  "#ea4c89",
  "#0d0c22",
  "#7c3aed",
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#64748b",
];

export type ExploreFilters = {
  sort: ExploreSort;
  category: ExploreCategorySlug;
  tags: string[];
  color: string | null;
  timeframe: ExploreTimeframe;
};

export type ExploreProject = ShotListItem & {
  dominantColor: string;
};

export type ExploreTag = {
  value: string;
  label: string;
};

function dominantColorForId(id: string): string {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

export function toExploreProjects(shots: ShotListItem[]): ExploreProject[] {
  return shots.map((shot) => ({
    ...shot,
    dominantColor: dominantColorForId(shot.id),
  }));
}

function readParam(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
  key: string,
): string | undefined {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }

  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function normalizeHex(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());

  return match ? `#${match[1].toLowerCase()}` : null;
}

export function parseExploreFilters(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
): ExploreFilters {
  const rawSort = readParam(params, "sort");
  const sort: ExploreSort = rawSort === "newest" ? "newest" : "popular";

  const rawCategory = readParam(params, "category");
  const category =
    EXPLORE_CATEGORIES.find((item) => item.slug === rawCategory)?.slug ?? "discover";

  const tags = Array.from(
    new Set(
      (readParam(params, "tags") ?? "")
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0 && tag.length <= 30),
    ),
  ).slice(0, 12);

  const color = normalizeHex(readParam(params, "color"));

  const rawTimeframe = readParam(params, "time") as ExploreTimeframe | undefined;
  const timeframe =
    EXPLORE_TIMEFRAMES.find((item) => item.value === rawTimeframe)?.value ?? "all";

  return { sort, category, tags, color, timeframe };
}

export function buildExploreHref(filters: ExploreFilters): string {
  const params = new URLSearchParams();

  if (filters.sort !== "popular") {
    params.set("sort", filters.sort);
  }

  if (filters.category !== "discover") {
    params.set("category", filters.category);
  }

  if (filters.tags.length > 0) {
    params.set("tags", filters.tags.join(","));
  }

  if (filters.color) {
    params.set("color", filters.color.slice(1));
  }

  if (filters.timeframe !== "all") {
    params.set("time", filters.timeframe);
  }

  const query = params.toString();
  return query ? `/explore?${query}` : "/explore";
}

export function activeFilterCount(filters: ExploreFilters): number {
  return (
    (filters.category !== "discover" ? 1 : 0) +
    (filters.tags.length > 0 ? 1 : 0) +
    (filters.color ? 1 : 0) +
    (filters.timeframe !== "all" ? 1 : 0)
  );
}

export function collectTags(projects: ExploreProject[]): ExploreTag[] {
  const tags = new Map<string, string>();

  for (const project of projects) {
    for (const tag of project.tags) {
      const value = tag.name.trim().toLowerCase();

      if (value && !tags.has(value)) {
        tags.set(value, tag.name.trim());
      }
    }
  }

  return Array.from(tags.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);

  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function nearestPaletteColor(hex: string): string | null {
  const target = hexToRgb(hex);

  if (!target) {
    return null;
  }

  let closest = COLOR_PALETTE[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const color of COLOR_PALETTE) {
    const rgb = hexToRgb(color);

    if (!rgb) {
      continue;
    }

    const distance =
      (target[0] - rgb[0]) ** 2 + (target[1] - rgb[1]) ** 2 + (target[2] - rgb[2]) ** 2;

    if (distance < closestDistance) {
      closestDistance = distance;
      closest = color;
    }
  }

  return closest;
}

function timeframeCutoff(timeframe: ExploreTimeframe): number | null {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  switch (timeframe) {
    case "now":
      return now - day;
    case "week":
      return now - 7 * day;
    case "month":
      return now - 30 * day;
    case "year":
      return now - 365 * day;
    default:
      return null;
  }
}

function publishedTime(project: ExploreProject): number {
  const value = Date.parse(project.published_at ?? project.created_at);
  return Number.isFinite(value) ? value : 0;
}

function popularityScore(project: ExploreProject): number {
  return project.like_count * 2 + project.comment_count;
}

export function filterAndSortProjects(
  projects: ExploreProject[],
  filters: ExploreFilters,
): ExploreProject[] {
  const category = EXPLORE_CATEGORIES.find((item) => item.slug === filters.category);
  const cutoff = timeframeCutoff(filters.timeframe);
  const nearestColor = filters.color ? nearestPaletteColor(filters.color) : null;

  const filtered = projects.filter((project) => {
    if (category?.categoryId && project.category_id !== category.categoryId) {
      return false;
    }

    if (
      category?.tag &&
      !project.tags.some((tag) => tag.name.trim().toLowerCase() === category.tag)
    ) {
      return false;
    }

    if (
      filters.tags.length > 0 &&
      !filters.tags.every((selected) =>
        project.tags.some((tag) => tag.name.trim().toLowerCase() === selected),
      )
    ) {
      return false;
    }

    if (nearestColor && project.dominantColor !== nearestColor) {
      return false;
    }

    if (cutoff !== null && publishedTime(project) < cutoff) {
      return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "newest") {
      return publishedTime(b) - publishedTime(a) || a.id.localeCompare(b.id);
    }

    return (
      popularityScore(b) - popularityScore(a) ||
      publishedTime(b) - publishedTime(a) ||
      a.id.localeCompare(b.id)
    );
  });
}
