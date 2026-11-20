import Link from "next/link";

import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buildFeedHref, FEED_DAYS, type FeedParams } from "@/lib/feed/params";
import type { Category } from "@/lib/types/app";

type FeedFiltersProps = {
  params: FeedParams;
  categories: Category[];
};

export function FeedFilters({ params, categories }: FeedFiltersProps) {
  const showDays = params.sort !== "newest";

  return (
    <form
      method="get"
      action="/"
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-white p-4"
    >
      <input type="hidden" name="sort" value={params.sort} />

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
        Tag
        <Input
          name="tag"
          defaultValue={params.tag ?? ""}
          maxLength={30}
          placeholder="e.g. branding"
        />
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

      {showDays ? (
        <label className="flex min-w-36 flex-col gap-1 text-xs font-medium text-muted">
          {params.sort === "trending" ? "Published within" : "Likes in"}
          <Select
            name="days"
            defaultValue={
              params.days ? String(params.days) : params.sort === "trending" ? "30" : ""
            }
          >
            {params.sort === "popular" ? <option value="">All time</option> : null}
            {FEED_DAYS.map((days) => (
              <option key={days} value={String(days)}>
                {days} days
              </option>
            ))}
          </Select>
        </label>
      ) : null}

      <Button type="submit" size="sm">
        Apply
      </Button>

      <Link
        href={buildFeedHref({ sort: params.sort })}
        className={buttonClasses("ghost", "sm")}
      >
        Clear
      </Link>
    </form>
  );
}
