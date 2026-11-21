"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { HeartIcon, EyeIcon } from "@/components/ui/icons";
import type { Designer } from "@/lib/designers/types";
import { cn } from "@/lib/utils";

type PortfolioGridProps = {
  shots: Designer["shots"];
  gradients: Record<Designer["shots"][number]["artwork"], string>;
};

type Sort = "recent" | "popular";

const SORTS: { value: Sort; label: string }[] = [
  { value: "recent", label: "Recent Shots" },
  { value: "popular", label: "Popular Shots" },
];

function formatCount(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

export function PortfolioGrid({ shots, gradients }: PortfolioGridProps) {
  const [sort, setSort] = useState<Sort>("recent");

  const ordered = useMemo(() => {
    return [...shots].sort((a, b) =>
      sort === "popular"
        ? b.likes - a.likes
        : Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    );
  }, [shots, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Work</h2>
        <div
          role="group"
          aria-label="Sort portfolio"
          className="flex items-center gap-1 rounded-full border border-border p-1"
        >
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={sort === option.value}
              onClick={() => setSort(option.value)}
              className={cn(
                "h-8 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                sort === option.value
                  ? "bg-foreground text-white"
                  : "text-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((shot) => (
          <li key={shot.id} className="group min-w-0">
            <figure className="min-w-0">
              <div
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br",
                  gradients[shot.artwork],
                )}
              >
                {shot.image ? (
                  <Image
                    src={shot.image}
                    alt={shot.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-semibold tracking-wide text-white/90">
                    {shot.title}
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                  <span className="line-clamp-1 text-xs font-medium text-white">
                    {shot.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-[11px] text-white">
                    <span className="inline-flex items-center gap-1">
                      <HeartIcon className="h-3 w-3" />
                      {formatCount(shot.likes)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <EyeIcon className="h-3 w-3" />
                      {formatCount(shot.likes * 8)}
                    </span>
                  </span>
                </div>
              </div>
              <figcaption className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
                <span className="truncate font-medium text-foreground">{shot.title}</span>
                <span className="shrink-0">{shot.category}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted">
        Demo portfolio: Hello Lab uses sample cover assets bundled with this project.
        Other profiles use CSS placeholder tiles. None of these are real client projects,
        and they do not link to a project page.
      </p>
    </div>
  );
}
