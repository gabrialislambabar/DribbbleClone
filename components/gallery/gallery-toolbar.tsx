"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { FilterIcon, SearchIcon, XIcon } from "@/components/ui/icons";
import {
  GALLERY_ORIENTATIONS,
  GALLERY_SORTS,
  GALLERY_SOURCE_LABELS,
  type GalleryFilters,
  type GallerySource,
} from "@/lib/gallery/types";
import { cn } from "@/lib/utils";

type GalleryToolbarProps = {
  filters: GalleryFilters;
  counts: Record<GallerySource, number>;
  onChange: (patch: Partial<GalleryFilters>) => void;
  onReset: () => void;
};

const triggerClasses =
  "inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const SOURCE_OPTIONS: GallerySource[] = ["pexels", "unsplash", "openverse", "pixabay"];

function Popover({
  label,
  active,
  children,
  align = "left",
  width = 260,
}: {
  label: string;
  active: boolean;
  children: ReactNode;
  align?: "left" | "right";
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          triggerClasses,
          active && "border-foreground/30 bg-surface",
          "max-w-full",
        )}
      >
        <span className="truncate">{label}</span>
      </button>

      {open ? (
        <div
          id={panelId}
          className={cn(
            "dropdown-panel absolute top-full z-30 mt-2 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-white p-2 shadow-xl",
            align === "right" ? "right-0" : "left-0",
          )}
          style={{ width }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function CheckRow({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        selected
          ? "bg-surface font-medium text-foreground"
          : "text-muted hover:bg-surface hover:text-foreground",
      )}
    >
      <span>{children}</span>
      {selected ? <span className="h-1.5 w-1.5 rounded-full bg-brand" /> : null}
    </button>
  );
}

export function GalleryToolbar({
  filters,
  counts,
  onChange,
  onReset,
}: GalleryToolbarProps) {
  const [search, setSearch] = useState(filters.query);

  function applySearch(value: string) {
    onChange({ query: value.trim().slice(0, 80), page: 1 });
  }

  const allSources = filters.sources.length === SOURCE_OPTIONS.length;
  const sourceLabel = allSources
    ? "All sources"
    : filters.sources
        .map((source) => GALLERY_SOURCE_LABELS[source].replace("Photo: ", ""))
        .join(", ");

  return (
    <div className="space-y-3">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          applySearch(search);
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <label htmlFor="gallery-search" className="sr-only">
          Search images and illustrations
        </label>
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="gallery-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onBlur={() => {
              if (search.trim() !== filters.query) {
                applySearch(search);
              }
            }}
            maxLength={80}
            placeholder="Search photography and illustration"
            className="h-11 w-full rounded-full border border-border bg-white pr-10 pl-11 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          {search ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                applySearch("");
              }}
              className="absolute top-1/2 right-3 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-white transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Popover label={sourceLabel} active={!allSources} width={268}>
          <CheckRow
            selected={allSources}
            onClick={() => onChange({ sources: [...SOURCE_OPTIONS], page: 1 })}
          >
            All sources
          </CheckRow>

          {SOURCE_OPTIONS.map((source) => {
            const selected = filters.sources.includes(source);

            return (
              <CheckRow
                key={source}
                selected={selected}
                onClick={() => {
                  // From "all sources", picking one means "only this one".
                  if (allSources) {
                    onChange({ sources: [source], page: 1 });
                    return;
                  }

                  const next = selected
                    ? filters.sources.filter((value) => value !== source)
                    : [...filters.sources, source];

                  onChange({
                    sources: next.length > 0 ? next : [source],
                    page: 1,
                  });
                }}
              >
                <span className="inline-flex items-center gap-2">
                  {GALLERY_SOURCE_LABELS[source].replace("Photo: ", "")}
                  <span className="text-xs text-muted">({counts[source] ?? 0})</span>
                </span>
              </CheckRow>
            );
          })}
        </Popover>

        <Popover
          label={
            GALLERY_ORIENTATIONS.find((item) => item.value === filters.orientation)
              ?.label ?? "Any shape"
          }
          active={filters.orientation !== "any"}
          width={220}
        >
          {GALLERY_ORIENTATIONS.map((option) => (
            <CheckRow
              key={option.value}
              selected={filters.orientation === option.value}
              onClick={() => onChange({ orientation: option.value, page: 1 })}
            >
              {option.label}
            </CheckRow>
          ))}
        </Popover>

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="gallery-sort" className="sr-only">
            Sort results
          </label>
          <select
            id="gallery-sort"
            value={filters.sort}
            onChange={(event) =>
              onChange({
                sort: event.target.value as GalleryFilters["sort"],
                page: 1,
              })
            }
            className="h-10 rounded-full border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {GALLERY_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {(filters.query || filters.orientation !== "any" || !allSources) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                onReset();
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <FilterIcon className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
