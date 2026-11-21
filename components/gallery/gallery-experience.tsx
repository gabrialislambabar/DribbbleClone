"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { GalleryCard } from "@/components/gallery/gallery-card";
import { GalleryToolbar } from "@/components/gallery/gallery-toolbar";
import { OpenverseDisclaimer, ProviderCredits } from "@/components/gallery/source-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  GALLERY_CATEGORIES,
  GALLERY_SOURCE_LABELS,
  type GalleryFilters,
  type GalleryItem,
  type GallerySource,
} from "@/lib/gallery/types";
import { buildGalleryHref } from "@/lib/gallery/params";
import { cn } from "@/lib/utils";

type GalleryResult = {
  items: GalleryItem[];
  unavailable: { source: GallerySource; message: string }[];
  unconfigured: GallerySource[];
  degraded: boolean;
  page: number;
  hasMore: boolean;
};

type GalleryExperienceProps = {
  initialFilters: GalleryFilters;
  initialResult: GalleryResult;
  initialSavedIds: string[];
  signedIn: boolean;
};

function categoryLabel(slug: string): string {
  return GALLERY_CATEGORIES.find((item) => item.slug === slug)?.label ?? slug;
}

export function GalleryExperience({
  initialFilters,
  initialResult,
  initialSavedIds,
  signedIn,
}: GalleryExperienceProps) {
  const [filters, setFilters] = useState<GalleryFilters>(initialFilters);
  const [result, setResult] = useState<GalleryResult>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(initialSavedIds));
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, "", buildGalleryHref(filters));
  }, [filters]);

  useEffect(() => {
    // The initial payload is server-rendered; skip the first client fetch.
    if (filters === initialFilters) {
      return;
    }

    let cancelled = false;

    const params = new URLSearchParams();

    if (filters.query) params.set("q", filters.query);
    if (filters.category) params.set("category", filters.category);
    if (filters.sort !== "featured") params.set("sort", filters.sort);
    if (filters.orientation !== "any") {
      params.set("orientation", filters.orientation);
    }
    params.set("sources", filters.sources.join(","));
    params.set("page", String(filters.page));

    fetch(`/api/gallery?${params.toString()}`, {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("request failed");
        }

        return (await response.json()) as GalleryResult;
      })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError("We couldn't load new results. Showing the last set.");
          setLoading(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, initialFilters]);

  const visibleItems = useMemo(() => {
    if (!showSavedOnly) {
      return result.items;
    }

    return result.items.filter((item) => saved.has(item.id));
  }, [result.items, saved, showSavedOnly]);

  const counts = useMemo(() => {
    const totals: Record<GallerySource, number> = {
      pexels: 0,
      unsplash: 0,
      openverse: 0,
      pixabay: 0,
    };

    for (const item of result.items) {
      totals[item.source] += 1;
    }

    return totals;
  }, [result.items]);

  function update(patch: Partial<GalleryFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setShowSavedOnly(false);
    setError(null);
    setLoading(true);
  }

  function reset() {
    setError(null);
    setLoading(true);
    setFilters({
      query: "",
      category: GALLERY_CATEGORIES[0].slug,
      sort: "featured",
      orientation: "any",
      sources: ["pexels", "unsplash", "openverse", "pixabay"],
      page: 1,
    });
  }

  function handleSavedChange(item: GalleryItem, isSaved: boolean) {
    setSaved((current) => {
      const next = new Set(current);
      if (isSaved) next.add(item.id);
      else next.delete(item.id);
      return next;
    });
  }

  const activeCategory = categoryLabel(filters.category);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
          Design discovery
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Visual references for your next project
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
          Photography and illustration from open image sources, grouped by the
          clone&rsquo;s design categories. These are stock and licensed images, not
          Dribbble shots or UI designs.
        </p>
      </header>

      <div className="-mx-4 mt-6 overflow-x-auto px-4">
        <div className="flex min-w-max items-center gap-1 border-b border-border pb-2">
          {GALLERY_CATEGORIES.map((category) => {
            const active = filters.category === category.slug;

            return (
              <button
                key={category.slug}
                type="button"
                aria-pressed={active}
                onClick={() => update({ category: category.slug, page: 1 })}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  active ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {category.label}
                {active ? (
                  <span className="absolute inset-x-2 -bottom-2 h-0.5 rounded-full bg-foreground" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <GalleryToolbar
          filters={filters}
          counts={counts}
          onChange={update}
          onReset={reset}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-muted">
          {loading
            ? `Loading ${activeCategory.toLowerCase()} references…`
            : `${visibleItems.length} ${
                visibleItems.length === 1 ? "reference" : "references"
              } in ${activeCategory}`}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={showSavedOnly}
            onClick={() => setShowSavedOnly((value) => !value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              showSavedOnly
                ? "border-foreground bg-foreground text-white"
                : "border-border bg-white text-muted hover:text-foreground",
            )}
          >
            Saved only ({saved.size})
          </button>
          <Link
            href="/gallery/saved"
            className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Saved designs
          </Link>
        </div>
      </div>

      {result.unconfigured.length > 0 ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          Not configured:{" "}
          {result.unconfigured
            .map((source) => GALLERY_SOURCE_LABELS[source].replace("Photo: ", ""))
            .join(", ")}
          . Add the matching API keys to <code>.env.local</code> to include these sources.
        </p>
      ) : null}

      {result.unavailable.length > 0 ? (
        <p
          role="status"
          className="mt-3 rounded-xl border border-dashed border-border bg-white px-3 py-2 text-xs leading-5 text-muted"
        >
          Some sources did not respond:{" "}
          {result.unavailable
            .map((entry) => GALLERY_SOURCE_LABELS[entry.source].replace("Photo: ", ""))
            .join(", ")}
          . The rest of the gallery still works.
        </p>
      ) : null}

      {error ? (
        <p role="status" className="mt-3 text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {loading && result.items.length === 0 ? (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <li
              key={index}
              className="aspect-[4/3] animate-pulse rounded-2xl bg-surface motion-reduce:animate-none"
            />
          ))}
        </ul>
      ) : visibleItems.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={showSavedOnly ? "No saved designs here yet" : "No references found"}
            description={
              showSavedOnly
                ? "Save a reference with the bookmark button, then filter by saved only to see it here."
                : "Try a broader search term, another category, or enable more sources."
            }
            action={
              <button
                type="button"
                onClick={showSavedOnly ? () => setShowSavedOnly(false) : reset}
                className="h-10 rounded-full bg-foreground px-5 text-sm font-medium text-white hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {showSavedOnly ? "Show all references" : "Clear filters"}
              </button>
            }
          />
        </div>
      ) : (
        <ul
          aria-busy={loading}
          className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {visibleItems.map((item) => (
            <li key={item.id} className="min-w-0">
              <GalleryCard
                item={item}
                saved={saved.has(item.id)}
                signedIn={signedIn}
                onSavedChange={handleSavedChange}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <button
          type="button"
          disabled={filters.page <= 1 || loading}
          onClick={() => update({ page: Math.max(1, filters.page - 1) })}
          className="h-10 rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-xs text-muted">Page {filters.page}</span>
        <button
          type="button"
          disabled={!result.hasMore || loading}
          onClick={() => update({ page: filters.page + 1 })}
          className="h-10 rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="mt-8 space-y-3">
        <ProviderCredits />
        <OpenverseDisclaimer />
      </div>
    </div>
  );
}
