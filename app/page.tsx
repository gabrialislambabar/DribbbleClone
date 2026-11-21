import type { Metadata } from "next";
import Link from "next/link";

import { FeedFilters } from "@/components/feed/feed-filters";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { LoadMore } from "@/components/feed/load-more";
import { CategoryMarquee } from "@/components/home/category-marquee";
import { HeroSwitcher } from "@/components/home/hero-switcher";
import { HomeSearch } from "@/components/home/home-search";
import { ProjectGrid } from "@/components/home/project-grid";
import { SetupNotice } from "@/components/layout/setup-notice";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getUser } from "@/lib/auth";
import { getCategories } from "@/lib/data/categories";
import { getShotsFeed } from "@/lib/data/feed";
import { isSupabaseConfigured } from "@/lib/env";
import { buildFeedHref, parseFeedParams } from "@/lib/feed/params";

export const metadata: Metadata = {
  title: "Discover design work",
};

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function HeroArtwork() {
  return (
    <div
      role="img"
      aria-label="Preview of two design project mockups"
      className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl bg-surface p-6 sm:min-h-[380px]"
    >
      <div aria-hidden="true" className="flex items-end gap-4 sm:gap-6">
        <div className="h-52 w-28 -rotate-6 rounded-[2rem] border-[6px] border-foreground/90 bg-gradient-to-b from-fuchsia-500 via-rose-300 to-amber-200 p-3 shadow-xl sm:h-64 sm:w-36">
          <div className="flex h-full flex-col justify-end gap-2">
            <div className="h-2 w-3/4 rounded-full bg-white/70" />
            <div className="h-2 w-1/2 rounded-full bg-white/50" />
            <div className="h-6 w-16 rounded-full bg-white/80" />
          </div>
        </div>
        <div className="h-60 w-32 rotate-6 rounded-[2rem] border-[6px] border-foreground/90 bg-gradient-to-br from-indigo-500 via-purple-400 to-pink-300 p-3 shadow-xl sm:h-72 sm:w-40">
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-2">
              <div className="h-2 w-2/3 rounded-full bg-white/70" />
              <div className="h-2 w-1/2 rounded-full bg-white/50" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-10 rounded-xl bg-white/25" />
              <div className="h-10 rounded-xl bg-white/25" />
            </div>
          </div>
        </div>
      </div>
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-muted shadow-sm">
        Project preview
      </span>
    </div>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const params = parseFeedParams(await searchParams);
  const [categories, feed, user] = await Promise.all([
    getCategories(),
    getShotsFeed(params),
    getUser(),
  ]);

  const hasFilters = Boolean(
    params.categoryId ||
    params.tag ||
    params.creator ||
    (params.sort !== "newest" && params.days),
  );

  const nextHref = feed.nextCursor
    ? buildFeedHref({
        sort: params.sort,
        categoryId: params.categoryId,
        tag: params.tag,
        creator: params.creator,
        days: params.days,
        cursor: feed.nextCursor,
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <section className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-16">
        <HeroSwitcher signedIn={Boolean(user)} />
        <HeroArtwork />
      </section>

      <HomeSearch />

      <section aria-label="Design feed" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FeedTabs params={params} />
          {hasFilters ? (
            <Link
              href={buildFeedHref({ sort: params.sort })}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Clear filters
            </Link>
          ) : null}
        </div>

        <details className="mt-3 rounded-2xl border border-border bg-white">
          <summary className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            Filters
          </summary>
          <div className="border-t border-border p-4">
            <FeedFilters params={params} categories={categories} />
          </div>
        </details>

        <div className="mt-6">
          {feed.shots.length === 0 ? (
            <EmptyState
              title={hasFilters ? "No shots match these filters" : "No shots yet"}
              description={
                hasFilters
                  ? "Try a different category, tag, designer, or time window."
                  : "Once designers publish their work, it will show up here."
              }
              action={
                hasFilters ? (
                  <Link
                    href={buildFeedHref({ sort: params.sort })}
                    className={buttonClasses("secondary")}
                  >
                    Clear filters
                  </Link>
                ) : (
                  <Link href="/sign-up" className={buttonClasses()}>
                    Join and share your first shot
                  </Link>
                )
              }
            />
          ) : (
            <ProjectGrid shots={feed.shots} signedIn={Boolean(user)} />
          )}
        </div>

        {nextHref ? <LoadMore href={nextHref} /> : null}
      </section>

      <CategoryMarquee />
    </div>
  );
}
