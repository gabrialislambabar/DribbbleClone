"use client";

import { SearchIcon } from "@/components/ui/icons";
import { useSearchState, type SearchType } from "@/components/search/search-state";
import { cn } from "@/lib/utils";

type HeaderSearchFormProps = {
  className?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
};

const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: "shots", label: "Shots" },
  { value: "designers", label: "Designers" },
  { value: "services", label: "Services" },
];

export function HeaderSearchForm({
  className,
  autoFocus,
  onSubmit,
}: HeaderSearchFormProps) {
  const { query, setQuery, type, setType, searchTab } = useSearchState();

  return (
    <form
      action="/search"
      method="get"
      role="search"
      onSubmit={onSubmit}
      className={cn("flex items-center gap-2", className)}
    >
      <input type="hidden" name="tab" value={searchTab} />

      <div className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-border bg-surface pr-1 pl-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <input
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus={autoFocus}
          placeholder="Search work"
          aria-label="Search shots or designers"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/70"
        />
        <select
          value={type}
          onChange={(event) => setType(event.target.value as SearchType)}
          aria-label="Search type"
          className="h-8 shrink-0 rounded-full border-0 bg-white px-2 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          {SEARCH_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        aria-label="Search"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <SearchIcon />
      </button>
    </form>
  );
}
