import Link from "next/link";

import { buildSearchHref, type SearchParams, type SearchTab } from "@/lib/search/params";
import { cn } from "@/lib/utils";

const TABS: { value: SearchTab; label: string }[] = [
  { value: "shots", label: "Shots" },
  { value: "designers", label: "Designers" },
];

type SearchTabsProps = {
  params: SearchParams;
};

export function SearchTabs({ params }: SearchTabsProps) {
  return (
    <nav
      aria-label="Search type"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-white p-1"
    >
      {TABS.map((tab) => {
        const active = params.tab === tab.value;

        return (
          <Link
            key={tab.value}
            href={buildSearchHref({
              query: params.query,
              tab: tab.value,
              categoryId: tab.value === "shots" ? params.categoryId : null,
              creator: tab.value === "shots" ? params.creator : null,
            })}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-white"
                : "text-muted hover:bg-surface hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
