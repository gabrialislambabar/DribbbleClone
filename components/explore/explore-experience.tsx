"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { CategoryNav } from "@/components/explore/category-nav";
import { FilterPanel } from "@/components/explore/filter-panel";
import { SortDropdown } from "@/components/explore/sort-dropdown";
import { ProjectGrid } from "@/components/home/project-grid";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SlidersIcon } from "@/components/ui/icons";
import {
  activeFilterCount,
  buildExploreHref,
  collectTags,
  filterAndSortProjects,
  parseExploreFilters,
  type ExploreFilters,
  type ExploreProject,
} from "@/lib/explore/filters";
import { cn } from "@/lib/utils";

type ExploreExperienceProps = {
  projects: ExploreProject[];
  initialFilters: ExploreFilters;
  signedIn: boolean;
};

export function ExploreExperience({
  projects,
  initialFilters,
  signedIn,
}: ExploreExperienceProps) {
  const [filters, setFilters] = useState<ExploreFilters>(initialFilters);
  const [panelOpen, setPanelOpen] = useState(false);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);

  const results = useMemo(
    () => filterAndSortProjects(projects, filters),
    [projects, filters],
  );
  const tags = useMemo(() => collectTags(projects), [projects]);
  const filterCount = activeFilterCount(filters);

  useEffect(() => {
    window.history.replaceState(null, "", buildExploreHref(filters));
  }, [filters]);

  useEffect(() => {
    function onPopState() {
      setFilters(parseExploreFilters(new URLSearchParams(window.location.search)));
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPanelOpen(false);
        filtersButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [panelOpen]);

  function update(patch: Partial<ExploreFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function reset() {
    setFilters((current) => ({
      sort: current.sort,
      category: "discover",
      tags: [],
      color: null,
      timeframe: "all",
    }));
  }

  return (
    <div>
      <h1 className="sr-only">Explore design projects</h1>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SortDropdown value={filters.sort} onChange={(sort) => update({ sort })} />

          <CategoryNav
            value={filters.category}
            onChange={(category) => update({ category })}
            className="order-3 w-full min-w-0 lg:order-none lg:w-auto lg:flex-1"
          />

          <button
            ref={filtersButtonRef}
            type="button"
            aria-expanded={panelOpen}
            aria-controls="explore-filters"
            onClick={() => setPanelOpen((open) => !open)}
            className={cn(
              "ml-auto inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              panelOpen && "bg-surface",
            )}
          >
            <SlidersIcon />
            Filters
            {filterCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
                {filterCount}
              </span>
            ) : null}
          </button>
        </div>

        {panelOpen ? (
          <FilterPanel
            filters={filters}
            tags={tags}
            onChange={update}
            onReset={reset}
            onClose={() => {
              setPanelOpen(false);
              filtersButtonRef.current?.focus();
            }}
          />
        ) : null}
      </div>

      <div className="mt-6">
        {results.length === 0 ? (
          <EmptyState
            title="No projects match these filters"
            description="Try another category, tag, color, or timeframe."
            action={
              <Button type="button" variant="secondary" onClick={reset}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <ProjectGrid shots={results} signedIn={signedIn} />
        )}
      </div>

      {!signedIn && results.length > 0 ? (
        <div className="mt-10 flex justify-center">
          <Link href="/sign-up" className={buttonClasses("dark", "md")}>
            Sign up to continue
          </Link>
        </div>
      ) : null}
    </div>
  );
}
