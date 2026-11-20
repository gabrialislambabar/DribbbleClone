import type { Metadata } from "next";
import Link from "next/link";

import { LoadMore } from "@/components/feed/load-more";
import { SetupNotice } from "@/components/layout/setup-notice";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchTabs } from "@/components/search/search-tabs";
import { ShotGrid } from "@/components/shots/shot-grid";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { getUser } from "@/lib/auth";
import { getCategories } from "@/lib/data/categories";
import { searchDesignersPage, searchShotsPage } from "@/lib/data/search";
import { isSupabaseConfigured } from "@/lib/env";
import { buildSearchHref, parseSearchParams } from "@/lib/search/params";
import { avatarUrl } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Search",
};

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const params = parseSearchParams(await searchParams);
  const [user, categories] = await Promise.all([getUser(), getCategories()]);
  const hasQuery = params.query.length >= 2 && !params.queryError;

  const shotPage =
    hasQuery && params.tab === "shots"
      ? await searchShotsPage({
          query: params.query,
          categoryId: params.categoryId,
          creator: params.creator,
          cursor: params.shotCursor,
        })
      : null;

  const designerPage =
    hasQuery && params.tab === "designers"
      ? await searchDesignersPage({
          query: params.query,
          cursor: params.designerCursor,
        })
      : null;

  const nextHref = (() => {
    if (params.tab === "shots" && shotPage?.nextCursor) {
      return buildSearchHref({
        query: params.query,
        tab: "shots",
        categoryId: params.categoryId,
        creator: params.creator,
        cursor: shotPage.nextCursor,
      });
    }

    if (params.tab === "designers" && designerPage?.nextCursor) {
      return buildSearchHref({
        query: params.query,
        tab: "designers",
        cursor: designerPage.nextCursor,
      });
    }

    return null;
  })();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Search</h1>
        <p className="mt-2 text-sm text-muted">
          Find shots by title, description, or tag, and designers by name or username.
        </p>
      </div>

      {hasQuery ? (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <SearchTabs params={params} />
            <p className="text-sm text-muted">
              Results for{" "}
              <span className="font-medium text-foreground">“{params.query}”</span>
            </p>
          </div>

          {params.tab === "shots" ? (
            <div className="mb-8">
              <SearchFilters params={params} categories={categories} />
            </div>
          ) : null}
        </>
      ) : null}

      {params.queryError ? (
        <EmptyState title="Search needs a bit more" description={params.queryError} />
      ) : !hasQuery ? (
        <EmptyState
          title="Search the community"
          description="Type at least two characters in the search box to find shots and designers."
        />
      ) : params.tab === "shots" ? (
        shotPage && shotPage.shots.length > 0 ? (
          <ShotGrid shots={shotPage.shots} likeable signedIn={Boolean(user)} />
        ) : (
          <EmptyState
            title="No shots found"
            description="Try a different phrase, category, or designer."
          />
        )
      ) : designerPage && designerPage.designers.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {designerPage.designers.map((designer) => (
            <li
              key={designer.id}
              className="rounded-2xl border border-border bg-white p-5"
            >
              <Link
                href={`/u/${designer.username}`}
                className="flex items-center gap-4 hover:text-brand"
              >
                <Avatar
                  src={avatarUrl(designer.avatar_path)}
                  name={designer.display_name}
                  size={56}
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {designer.display_name}
                  </span>
                  <span className="block truncate text-sm text-muted">
                    @{designer.username}
                  </span>
                </span>
              </Link>

              {designer.bio ? (
                <p className="mt-3 line-clamp-2 text-sm text-muted">{designer.bio}</p>
              ) : null}

              <p className="mt-3 text-xs text-muted">
                {designer.follower_count} followers
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No designers found"
          description="Try a different name or username."
        />
      )}

      {nextHref ? <LoadMore href={nextHref} /> : null}
    </div>
  );
}
