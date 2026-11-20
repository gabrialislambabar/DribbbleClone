import Link from "next/link";

import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buildSearchHref, type SearchParams } from "@/lib/search/params";
import type { Category } from "@/lib/types/app";

type SearchFiltersProps = {
  params: SearchParams;
  categories: Category[];
};

export function SearchFilters({ params, categories }: SearchFiltersProps) {
  return (
    <form
      method="get"
      action="/search"
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-white p-4"
    >
      <input type="hidden" name="q" value={params.query} />
      <input type="hidden" name="type" value="shots" />

      <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-muted">
        Category
        <Select name="category" defaultValue={params.categoryId ?? ""}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex min-w-36 flex-col gap-1 text-xs font-medium text-muted">
        Designer
        <Input
          name="creator"
          defaultValue={params.creator ?? ""}
          maxLength={30}
          placeholder="username"
        />
      </label>

      <Button type="submit" size="sm">
        Apply
      </Button>

      <Link
        href={buildSearchHref({ query: params.query, tab: "shots" })}
        className={buttonClasses("ghost", "sm")}
      >
        Clear
      </Link>
    </form>
  );
}
