"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import {
  ChevronDownIcon,
  ClockIcon,
  MapPinIcon,
  SearchIcon,
  SlidersIcon,
  StarIcon,
  XIcon,
} from "@/components/ui/icons";
import {
  BUDGET_RANGES,
  DESIGNER_CATEGORIES,
  DESIGNER_SORTS,
  RATING_OPTIONS,
  type BudgetRangeKey,
  type DesignerCategorySlug,
  type DesignerFilters,
} from "@/lib/designers/types";
import { cn } from "@/lib/utils";

type FilterToolbarProps = {
  filters: DesignerFilters;
  resultCount: number;
  onChange: (patch: Partial<DesignerFilters>) => void;
  onReset: () => void;
};

const triggerClasses =
  "inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const activeTriggerClasses = "border-foreground/30 bg-surface";

function PopoverMenu({
  label,
  active,
  children,
  width = 264,
  align = "left",
}: {
  label: string;
  active: boolean;
  children: ReactNode;
  width?: number;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

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
        className={cn(triggerClasses, active && activeTriggerClasses, "max-w-full")}
      >
        <span className="truncate">{label}</span>
        <ChevronDownIcon
          className={cn(
            "transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
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

function OptionButton({
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

function Controls({
  filters,
  onChange,
}: {
  filters: DesignerFilters;
  onChange: (patch: Partial<DesignerFilters>) => void;
}) {
  const [location, setLocation] = useState(filters.location);

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-xs font-semibold tracking-wide text-muted uppercase">
          Category
        </legend>
        <div className="mt-2 space-y-0.5">
          <OptionButton
            selected={filters.category === "all"}
            onClick={() => onChange({ category: "all" })}
          >
            All categories
          </OptionButton>
          {DESIGNER_CATEGORIES.map((category) => (
            <OptionButton
              key={category.slug}
              selected={filters.category === category.slug}
              onClick={() =>
                onChange({ category: category.slug as DesignerCategorySlug })
              }
            >
              {category.label}
            </OptionButton>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold tracking-wide text-muted uppercase">
          Budget
        </legend>
        <div className="mt-2 space-y-0.5">
          {BUDGET_RANGES.map((range) => (
            <OptionButton
              key={range.value}
              selected={filters.budget === range.value}
              onClick={() => onChange({ budget: range.value as BudgetRangeKey })}
            >
              {range.label}
            </OptionButton>
          ))}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="designer-location"
          className="text-xs font-semibold tracking-wide text-muted uppercase"
        >
          Location
        </label>
        <div className="relative mt-2">
          <MapPinIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="designer-location"
            value={location}
            onChange={(event) => {
              setLocation(event.target.value);
              onChange({ location: event.target.value });
            }}
            maxLength={60}
            placeholder="City or country"
            className="h-11 w-full rounded-xl border border-border bg-white pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-xs font-semibold tracking-wide text-muted uppercase">
          Rating
        </legend>
        <div className="mt-2 space-y-0.5">
          {RATING_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              selected={filters.rating === option.value}
              onClick={() => onChange({ rating: option.value })}
            >
              {option.value > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <StarIcon className="h-3.5 w-3.5 text-amber-500" />
                  {option.label}
                </span>
              ) : (
                option.label
              )}
            </OptionButton>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold tracking-wide text-muted uppercase">
          More
        </legend>
        <div className="mt-2 space-y-0.5">
          <OptionButton
            selected={filters.availableOnly}
            onClick={() => onChange({ availableOnly: !filters.availableOnly })}
          >
            Available for work
          </OptionButton>
          <OptionButton
            selected={filters.proOnly}
            onClick={() => onChange({ proOnly: !filters.proOnly })}
          >
            Pro designers
          </OptionButton>
          <OptionButton
            selected={filters.fastOnly}
            onClick={() => onChange({ fastOnly: !filters.fastOnly })}
          >
            Responds quickly
          </OptionButton>
          <OptionButton
            selected={filters.agenciesOnly}
            onClick={() => onChange({ agenciesOnly: !filters.agenciesOnly })}
          >
            Agencies only
          </OptionButton>
        </div>
      </fieldset>
    </div>
  );
}

function SearchLocationField({
  filters,
  onChange,
}: {
  filters: DesignerFilters;
  onChange: (patch: Partial<DesignerFilters>) => void;
}) {
  return (
    <div className="relative min-w-0">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        aria-label="Search designers by location"
        value={filters.location}
        onChange={(event) => onChange({ location: event.target.value })}
        maxLength={60}
        placeholder="Search location"
        className="h-10 w-full min-w-0 rounded-full border border-border bg-white pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}

function ActiveChips({
  filters,
  onChange,
}: {
  filters: DesignerFilters;
  onChange: (patch: Partial<DesignerFilters>) => void;
}) {
  const chips: { key: string; label: string; patch: Partial<DesignerFilters> }[] = [];

  if (filters.category !== "all") {
    const label =
      DESIGNER_CATEGORIES.find((item) => item.slug === filters.category)?.label ??
      filters.category;
    chips.push({ key: "category", label, patch: { category: "all" } });
  }

  if (filters.budget !== "any") {
    const label =
      BUDGET_RANGES.find((item) => item.value === filters.budget)?.label ?? "";
    chips.push({ key: "budget", label, patch: { budget: "any" } });
  }

  if (filters.location) {
    chips.push({
      key: "location",
      label: `Location: ${filters.location}`,
      patch: { location: "" },
    });
  }

  if (filters.rating > 0) {
    chips.push({
      key: "rating",
      label: `${filters.rating}+ stars`,
      patch: { rating: 0 },
    });
  }

  if (filters.availableOnly) {
    chips.push({
      key: "available",
      label: "Available for work",
      patch: { availableOnly: false },
    });
  }

  if (filters.proOnly) {
    chips.push({ key: "pro", label: "Pro designers", patch: { proOnly: false } });
  }

  if (filters.fastOnly) {
    chips.push({
      key: "fast",
      label: "Responds quickly",
      patch: { fastOnly: false },
    });
  }

  if (filters.agenciesOnly) {
    chips.push({
      key: "agencies",
      label: "Agencies only",
      patch: { agenciesOnly: false },
    });
  }

  if (filters.quickHire) {
    chips.push({ key: "quick", label: "Quick Hire", patch: { quickHire: false } });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter`}
            onClick={() => onChange(chip.patch)}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-white hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export function DesignerFilterToolbar({
  filters,
  resultCount,
  onChange,
  onReset,
}: FilterToolbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const activeCount = [
    filters.category !== "all",
    filters.budget !== "any",
    Boolean(filters.location),
    filters.rating > 0,
    filters.availableOnly,
    filters.proOnly,
    filters.fastOnly,
    filters.agenciesOnly,
    filters.quickHire,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );

      if (!focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousActive = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    window.requestAnimationFrame(() => {
      drawerRef.current
        ?.querySelector<HTMLButtonElement>('button[aria-label="Close filters"]')
        ?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previousActive?.focus();
    };
  }, [drawerOpen]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <PopoverMenu
            label={
              filters.category === "all"
                ? "Categories"
                : (DESIGNER_CATEGORIES.find((item) => item.slug === filters.category)
                    ?.label ?? "Categories")
            }
            active={filters.category !== "all"}
            width={248}
          >
            <div className="max-h-80 overflow-y-auto">
              <OptionButton
                selected={filters.category === "all"}
                onClick={() => onChange({ category: "all" })}
              >
                All categories
              </OptionButton>
              {DESIGNER_CATEGORIES.map((category) => (
                <OptionButton
                  key={category.slug}
                  selected={filters.category === category.slug}
                  onClick={() => onChange({ category: category.slug })}
                >
                  {category.label}
                </OptionButton>
              ))}
            </div>
          </PopoverMenu>

          <PopoverMenu
            label={
              filters.budget === "any"
                ? "Budget"
                : (BUDGET_RANGES.find((item) => item.value === filters.budget)?.label ??
                  "Budget")
            }
            active={filters.budget !== "any"}
            width={240}
          >
            {BUDGET_RANGES.map((range) => (
              <OptionButton
                key={range.value}
                selected={filters.budget === range.value}
                onClick={() => onChange({ budget: range.value })}
              >
                {range.label}
              </OptionButton>
            ))}
          </PopoverMenu>

          <PopoverMenu
            label="Location"
            active={Boolean(filters.location)}
            width={264}
            align="right"
          >
            <div className="p-1">
              <label
                htmlFor="designer-location-popover"
                className="text-xs font-semibold tracking-wide text-muted uppercase"
              >
                Location
              </label>
              <div className="relative mt-2">
                <MapPinIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="designer-location-popover"
                  value={filters.location}
                  onChange={(event) => onChange({ location: event.target.value })}
                  maxLength={60}
                  placeholder="City or country"
                  className="h-11 w-full rounded-xl border border-border bg-white pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>
          </PopoverMenu>

          <PopoverMenu
            label={filters.rating > 0 ? `${filters.rating}+ stars` : "Rating"}
            active={filters.rating > 0}
            width={220}
            align="right"
          >
            {RATING_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={filters.rating === option.value}
                onClick={() => onChange({ rating: option.value })}
              >
                {option.value > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <StarIcon className="h-3.5 w-3.5 text-amber-500" />
                    {option.label}
                  </span>
                ) : (
                  option.label
                )}
              </OptionButton>
            ))}
          </PopoverMenu>

          <PopoverMenu
            label="More"
            active={
              filters.availableOnly ||
              filters.proOnly ||
              filters.fastOnly ||
              filters.agenciesOnly
            }
            width={236}
            align="right"
          >
            <OptionButton
              selected={filters.availableOnly}
              onClick={() => onChange({ availableOnly: !filters.availableOnly })}
            >
              Available for work
            </OptionButton>
            <OptionButton
              selected={filters.proOnly}
              onClick={() => onChange({ proOnly: !filters.proOnly })}
            >
              Pro designers
            </OptionButton>
            <OptionButton
              selected={filters.fastOnly}
              onClick={() => onChange({ fastOnly: !filters.fastOnly })}
            >
              Responds quickly
            </OptionButton>
            <OptionButton
              selected={filters.agenciesOnly}
              onClick={() => onChange({ agenciesOnly: !filters.agenciesOnly })}
            >
              Agencies only
            </OptionButton>
          </PopoverMenu>

          <button
            type="button"
            aria-pressed={filters.quickHire}
            onClick={() => onChange({ quickHire: !filters.quickHire })}
            className={cn(
              triggerClasses,
              filters.quickHire && "border-foreground/30 bg-surface",
            )}
            title="Quick Hire matches designers who respond quickly"
          >
            <ClockIcon className="h-4 w-4" />
            Quick Hire
          </button>
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          className={cn(triggerClasses, "md:hidden")}
        >
          <SlidersIcon className="h-4 w-4" />
          Filters
          {activeCount > 0 ? (
            <span className="ml-1 rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </button>

        <div className="hidden min-w-40 md:block md:flex-1">
          <SearchLocationField filters={filters} onChange={onChange} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="designer-sort" className="sr-only">
            Sort designers
          </label>
          <select
            id="designer-sort"
            value={filters.sort}
            onChange={(event) =>
              onChange({ sort: event.target.value as DesignerFilters["sort"] })
            }
            className="h-10 rounded-full border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {DESIGNER_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <ActiveChips filters={filters} onChange={onChange} />
        <div className="flex items-center gap-3 text-xs text-muted">
          <span aria-live="polite">
            {resultCount} {resultCount === 1 ? "profile" : "profiles"}
          </span>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={onReset}
              className="font-medium text-foreground underline underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Designer filters"
            className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <XIcon />
              </button>
            </div>

            <div className="mt-4">
              <Controls filters={filters} onChange={onChange} />
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setDrawerOpen(false);
                }}
                className="h-11 flex-1 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="h-11 flex-1 rounded-full bg-foreground text-sm font-medium text-white hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Show {resultCount} results
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
