"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ContactDesignerDialog } from "@/components/designers/contact-designer-dialog";
import { DesignerCard } from "@/components/designers/designer-card";
import { DesignerFilterToolbar } from "@/components/designers/designer-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchIcon } from "@/components/ui/icons";
import { buildDesignerHref, filterDesigners } from "@/lib/designers/filters";
import {
  DEFAULT_DESIGNER_FILTERS,
  DESIGNER_CATEGORIES,
  POPULAR_DESIGNER_SEARCHES,
  type Designer,
  type DesignerFilters,
} from "@/lib/designers/types";
import { cn } from "@/lib/utils";

type DesignerDirectoryProps = {
  designers: Designer[];
  initialFilters: DesignerFilters;
};

const chipClasses =
  "rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function DesignerDirectory({ designers, initialFilters }: DesignerDirectoryProps) {
  const [filters, setFilters] = useState<DesignerFilters>(initialFilters);
  const [contact, setContact] = useState<Designer | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [search, setSearch] = useState("");

  const results = useMemo(
    () => filterDesigners(designers, filters),
    [designers, filters],
  );

  const quickResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return designers
      .filter(
        (designer) =>
          designer.name.toLowerCase().includes(query) ||
          designer.skills.some((skill) => skill.toLowerCase().includes(query)) ||
          designer.categories.some((category) =>
            category.replace(/-/g, " ").includes(query),
          ),
      )
      .slice(0, 4);
  }, [designers, search]);

  function update(patch: Partial<DesignerFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    window.history.replaceState(null, "", buildDesignerHref(next));
  }

  function reset() {
    setFilters(DEFAULT_DESIGNER_FILTERS);
    window.history.replaceState(null, "", "/designers");
  }

  function openContact(designer: Designer) {
    setContact(designer);
    setContactOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Explore freelancers
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
          Browse independent designers and agencies, compare starting budgets, and send a
          brief. Filter the directory to find the right fit.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label htmlFor="designer-search" className="sr-only">
          Search designers
        </label>
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="designer-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="What are you looking for?"
            className="h-12 w-full rounded-full border border-border bg-white pr-4 pl-11 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          {quickResults.length > 0 ? (
            <ul className="dropdown-panel absolute top-full left-0 z-20 mt-2 w-full rounded-2xl border border-border bg-white p-2 shadow-xl">
              {quickResults.map((designer) => (
                <li key={designer.id}>
                  <Link
                    href={`/designers/${designer.slug}`}
                    onClick={() => setSearch("")}
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="truncate font-medium">{designer.name}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {designer.startingBudget.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      })}
                      +
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Popular:</span>
          {POPULAR_DESIGNER_SEARCHES.slice(0, 4).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setSearch(term)}
              className={chipClasses}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-4 mt-4 overflow-x-auto px-4">
        <div className="flex min-w-max items-center gap-1 border-b border-border pb-2">
          <button
            type="button"
            aria-pressed={filters.category === "all"}
            onClick={() => update({ category: "all" })}
            className={cn(
              "relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              filters.category === "all"
                ? "text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            All
            {filters.category === "all" ? (
              <span className="absolute inset-x-2 -bottom-2 h-0.5 rounded-full bg-foreground" />
            ) : null}
          </button>
          {DESIGNER_CATEGORIES.map((category) => {
            const active = filters.category === category.slug;

            return (
              <button
                key={category.slug}
                type="button"
                aria-pressed={active}
                onClick={() => update({ category: category.slug })}
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
        <DesignerFilterToolbar
          filters={filters}
          resultCount={results.length}
          onChange={update}
          onReset={reset}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted">
        <span className="rounded-full bg-surface px-2 py-0.5 font-medium text-foreground">
          Demo directory
        </span>
        Profiles including Hello Lab are sample data for this clone: ratings, budgets,
        reviews, and metrics are illustrative, not verified claims.
      </div>

      {results.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No designers match those filters"
            description="Try widening the budget, clearing the location, or lowering the minimum rating."
            action={
              <button
                type="button"
                onClick={reset}
                className="h-10 rounded-full bg-foreground px-5 text-sm font-medium text-white hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((designer) => (
            <li key={designer.id} className="min-w-0">
              <DesignerCard designer={designer} onContact={openContact} />
            </li>
          ))}
        </ul>
      )}

      <ContactDesignerDialog
        designer={contact}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
