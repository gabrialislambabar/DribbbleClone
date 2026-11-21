"use client";

import Link from "next/link";

import { useSearchState, type SearchType } from "@/components/search/search-state";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: "shots", label: "Shots" },
  { value: "designers", label: "Designers" },
  { value: "services", label: "Services" },
];

const POPULAR_TOPICS = [
  "dashboard",
  "landing page",
  "mobile app",
  "portfolio",
  "ecommerce",
  "animation",
  "illustration",
  "onboarding",
];

const chipClasses =
  "inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function HomeSearch() {
  const { query, setQuery, type, setType, searchTab } = useSearchState();

  return (
    <section id="home-search-section" aria-label="Browse design work" className="pb-2">
      <div
        role="group"
        aria-label="Search type"
        className="flex items-center gap-6 border-b border-border text-sm font-medium"
      >
        {SEARCH_TYPES.map((option) => {
          const active = type === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setType(option.value)}
              className={cn(
                "pb-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none",
                active
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <form
        id="home-search-bar"
        action="/search"
        method="get"
        role="search"
        className="mt-5"
      >
        <input type="hidden" name="tab" value={searchTab} />
        <div className="relative">
          <input
            id="home-search"
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What type of design are you interested in?"
            className="h-14 w-full rounded-2xl border border-border bg-surface pr-16 pl-5 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 sm:text-base"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute top-1/2 right-2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </div>
      </form>

      <ul className="mt-4 flex flex-wrap items-center gap-2">
        <li className="text-[11px] font-semibold tracking-wide text-muted uppercase">
          Popular
        </li>
        {POPULAR_TOPICS.map((topic) => (
          <li key={topic}>
            <Link
              href={`/search?tab=${searchTab}&q=${encodeURIComponent(topic)}`}
              className={chipClasses}
            >
              {topic}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
