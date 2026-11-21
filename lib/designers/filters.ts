import {
  BUDGET_RANGES,
  DEFAULT_DESIGNER_FILTERS,
  DESIGNER_CATEGORIES,
  type BudgetRangeKey,
  type Designer,
  type DesignerCategorySlug,
  type DesignerFilters,
} from "@/lib/designers/types";

function read(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseDesignerFilters(
  params: Record<string, string | string[] | undefined>,
): DesignerFilters {
  const rawCategory = read(params, "category");
  const category =
    DESIGNER_CATEGORIES.find((item) => item.slug === rawCategory)?.slug ?? "all";

  const rawBudget = read(params, "budget") as BudgetRangeKey | undefined;
  const budget = BUDGET_RANGES.find((item) => item.value === rawBudget)?.value ?? "any";

  const location = (read(params, "location") ?? "").trim().slice(0, 60);

  const rawRating = Number(read(params, "rating"));
  const rating = [0, 4, 4.5, 4.8].includes(rawRating) ? rawRating : 0;

  const rawSort = read(params, "sort");
  const sort =
    rawSort === "rating" || rawSort === "budget" || rawSort === "projects"
      ? rawSort
      : "recommended";

  return {
    ...DEFAULT_DESIGNER_FILTERS,
    category,
    budget,
    location,
    rating,
    sort,
    availableOnly: read(params, "available") === "1",
    proOnly: read(params, "pro") === "1",
    fastOnly: read(params, "fast") === "1",
    agenciesOnly: read(params, "agencies") === "1",
    quickHire: read(params, "quick") === "1",
  };
}

export function buildDesignerHref(filters: DesignerFilters): string {
  const params = new URLSearchParams();

  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.budget !== "any") params.set("budget", filters.budget);
  if (filters.location) params.set("location", filters.location);
  if (filters.rating > 0) params.set("rating", String(filters.rating));
  if (filters.availableOnly) params.set("available", "1");
  if (filters.proOnly) params.set("pro", "1");
  if (filters.fastOnly) params.set("fast", "1");
  if (filters.agenciesOnly) params.set("agencies", "1");
  if (filters.quickHire) params.set("quick", "1");
  if (filters.sort !== "recommended") params.set("sort", filters.sort);

  const query = params.toString();
  return query ? `/designers?${query}` : "/designers";
}

export function countActiveDesignerFilters(filters: DesignerFilters): number {
  return [
    filters.category !== "all",
    filters.budget !== "any",
    filters.location !== "",
    filters.rating > 0,
    filters.availableOnly,
    filters.proOnly,
    filters.fastOnly,
    filters.agenciesOnly,
    filters.quickHire,
  ].filter(Boolean).length;
}

function budgetMatches(startingBudget: number, key: BudgetRangeKey): boolean {
  const range = BUDGET_RANGES.find((item) => item.value === key);

  if (!range || range.value === "any") {
    return true;
  }

  return (
    startingBudget >= range.min && (range.max === null || startingBudget <= range.max)
  );
}

/** Documented, transparent ranking: rating, then reviews, then projects. */
function recommendedScore(designer: Designer): number {
  return (
    designer.rating * 100 +
    Math.min(designer.reviewCount, 50) * 2 +
    Math.min(designer.completedProjects, 100)
  );
}

export function filterDesigners(
  designers: Designer[],
  filters: DesignerFilters,
): Designer[] {
  const locationQuery = filters.location.toLowerCase();

  const filtered = designers.filter((designer) => {
    if (
      filters.category !== "all" &&
      !designer.categories.includes(filters.category as DesignerCategorySlug)
    ) {
      return false;
    }

    if (!budgetMatches(designer.startingBudget, filters.budget)) {
      return false;
    }

    if (locationQuery && !designer.location.toLowerCase().includes(locationQuery)) {
      return false;
    }

    if (filters.rating > 0 && designer.rating < filters.rating) {
      return false;
    }

    if (filters.availableOnly && !designer.availableForWork) {
      return false;
    }

    if (filters.proOnly && !designer.isPro) {
      return false;
    }

    if (filters.fastOnly && !designer.respondsQuickly) {
      return false;
    }

    if (filters.agenciesOnly && designer.type !== "agency") {
      return false;
    }

    if (filters.quickHire && (!designer.respondsQuickly || !designer.availableForWork)) {
      return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    switch (filters.sort) {
      case "rating":
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
      case "projects":
        return b.completedProjects - a.completedProjects;
      case "budget":
        return a.startingBudget - b.startingBudget;
      default:
        return recommendedScore(b) - recommendedScore(a);
    }
  });
}
