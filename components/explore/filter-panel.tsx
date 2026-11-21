"use client";

import { useState } from "react";

import { SearchIcon, XIcon } from "@/components/ui/icons";
import {
  COLOR_PALETTE,
  EXPLORE_TIMEFRAMES,
  type ExploreFilters,
  type ExploreTag,
  type ExploreTimeframe,
} from "@/lib/explore/filters";
import { cn } from "@/lib/utils";

type FilterPanelProps = {
  filters: ExploreFilters;
  tags: ExploreTag[];
  onChange: (patch: Partial<ExploreFilters>) => void;
  onReset: () => void;
  onClose: () => void;
};

function normalizeHex(value: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  return match ? `#${match[1].toLowerCase()}` : null;
}

function ColorFilter({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [hex, setHex] = useState(value ?? "");
  const [invalid, setInvalid] = useState(false);

  function apply() {
    const raw = hex.trim();

    if (!raw) {
      setInvalid(false);
      onChange(null);
      return;
    }

    const normalized = normalizeHex(raw);

    if (!normalized) {
      setInvalid(true);
      return;
    }

    setInvalid(false);
    setHex(normalized);
    onChange(normalized);
  }

  return (
    <div>
      <label htmlFor="filter-color" className="text-sm font-medium text-foreground">
        Color
      </label>

      <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <span
          aria-hidden="true"
          className="h-5 w-5 shrink-0 rounded-full"
          style={{
            background:
              "conic-gradient(#f43f5e, #f59e0b, #10b981, #0ea5e9, #7c3aed, #f43f5e)",
          }}
        />
        <input
          id="filter-color"
          value={hex}
          onChange={(event) => {
            setHex(event.target.value);
            setInvalid(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
          }}
          onBlur={apply}
          maxLength={7}
          placeholder="Enter hex or select"
          aria-invalid={invalid}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/70"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear color"
            onClick={() => {
              setHex("");
              setInvalid(false);
              onChange(null);
            }}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {invalid ? (
        <p className="mt-1 text-xs text-red-600">Use a 6-digit hex, e.g. #ea4c89.</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {COLOR_PALETTE.map((color) => {
          const selected = value?.toLowerCase() === color;

          return (
            <button
              key={color}
              type="button"
              aria-label={`Filter by ${color}`}
              aria-pressed={selected}
              onClick={() => {
                setHex(color);
                setInvalid(false);
                onChange(color);
              }}
              style={{ backgroundColor: color }}
              className={cn(
                "h-7 w-7 rounded-full border border-black/5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                selected && "ring-2 ring-foreground ring-offset-2",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

export function FilterPanel({
  filters,
  tags,
  onChange,
  onReset,
  onClose,
}: FilterPanelProps) {
  const [tagQuery, setTagQuery] = useState("");
  const query = tagQuery.trim().toLowerCase();
  const visibleTags = tags.filter(
    (tag) => tag.label.toLowerCase().includes(query) || tag.value.includes(query),
  );

  function toggleTag(value: string) {
    const selected = filters.tags.includes(value)
      ? filters.tags.filter((tag) => tag !== value)
      : [...filters.tags, value];

    onChange({ tags: selected });
  }

  return (
    <section
      id="explore-filters"
      aria-label="Filters"
      className="dropdown-panel rounded-2xl border border-border bg-white p-4 sm:p-5"
    >
      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label htmlFor="filter-tags" className="text-sm font-medium text-foreground">
            Tags
          </label>
          <div className="relative mt-2">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="filter-tags"
              value={tagQuery}
              onChange={(event) => setTagQuery(event.target.value)}
              placeholder="Search tags"
              className="h-11 w-full rounded-xl border border-border bg-white pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
            {visibleTags.length === 0 ? (
              <p className="text-xs text-muted">No tags found.</p>
            ) : (
              visibleTags.map((tag) => {
                const selected = filters.tags.includes(tag.value);

                return (
                  <button
                    key={tag.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleTag(tag.value)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                      selected
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-white text-muted hover:border-foreground/20 hover:text-foreground",
                    )}
                  >
                    {tag.label}
                  </button>
                );
              })
            )}
          </div>

          {filters.tags.length > 0 ? (
            <p className="mt-2 text-xs text-muted">
              {filters.tags.length} selected · all must match
            </p>
          ) : null}
        </div>

        <ColorFilter
          key={filters.color ?? "none"}
          value={filters.color}
          onChange={(color) => onChange({ color })}
        />

        <div>
          <label
            htmlFor="filter-timeframe"
            className="text-sm font-medium text-foreground"
          >
            Timeframe
          </label>
          <select
            id="filter-timeframe"
            value={filters.timeframe}
            onChange={(event) =>
              onChange({ timeframe: event.target.value as ExploreTimeframe })
            }
            className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {EXPLORE_TIMEFRAMES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted">
          Filters combine with the selected category and sort.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="h-9 rounded-full px-3 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-full bg-foreground px-4 text-sm font-medium text-white transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Done
          </button>
        </div>
      </div>
    </section>
  );
}
