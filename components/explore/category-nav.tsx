"use client";

import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
import { EXPLORE_CATEGORIES, type ExploreCategorySlug } from "@/lib/explore/filters";
import { cn } from "@/lib/utils";

type CategoryNavProps = {
  value: ExploreCategorySlug;
  onChange: (value: ExploreCategorySlug) => void;
  className?: string;
};

type Edges = {
  left: boolean;
  right: boolean;
};

export function CategoryNav({ value, onChange, className }: CategoryNavProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>({ left: false, right: false });

  function updateEdges() {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    setEdges({
      left: scroller.scrollLeft > 4,
      right: scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4,
    });
  }

  useEffect(() => {
    updateEdges();
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    scroller.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);

    return () => {
      scroller.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, []);

  useEffect(() => {
    scrollerRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [value]);

  function scroll(direction: -1 | 1) {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    scroller.scrollBy({
      left: direction * 220,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      {edges.left ? (
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scroll(-1)}
          className="absolute top-1/2 left-0 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-muted shadow-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ChevronDownIcon className="-rotate-90" />
        </button>
      ) : null}

      <div
        ref={scrollerRef}
        role="group"
        aria-label="Project categories"
        className="flex [scrollbar-width:none] gap-2 overflow-x-auto scroll-smooth px-1 py-1 [&::-webkit-scrollbar]:hidden"
      >
        {EXPLORE_CATEGORIES.map((category) => {
          const active = value === category.slug;

          return (
            <button
              key={category.slug}
              type="button"
              aria-pressed={active}
              data-active={active}
              onClick={() => onChange(category.slug)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                active
                  ? "border border-border bg-surface text-foreground"
                  : "text-muted hover:bg-surface hover:text-foreground",
              )}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {edges.right ? (
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scroll(1)}
          className="absolute top-1/2 right-0 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-muted shadow-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ChevronDownIcon className="rotate-90" />
        </button>
      ) : null}
    </div>
  );
}
