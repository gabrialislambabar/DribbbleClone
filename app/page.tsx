import type { Metadata } from "next";
import Link from "next/link";

import { FeedFilters } from "@/components/feed/feed-filters";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { LoadMore } from "@/components/feed/load-more";
import { SetupNotice } from "@/components/layout/setup-notice";
import { ShotGrid } from "@/components/shots/shot-grid";
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

const SORT_DESCRIPTIONS = {
  newest: "Fresh shots from designers around the community, newest publications first.",
  popular: "The shots with the most likes across the community.",
  trending: "Shots getting attention right now, weighted toward recent likes.",
};

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
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <section className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Discover design work
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
          {SORT_DESCRIPTIONS[params.sort]}
        </p>
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FeedTabs params={params} />
        {hasFilters ? (
          <Link
            href={buildFeedHref({ sort: params.sort })}
            className="text-sm text-muted hover:text-foreground"
          >
            Clear filters
          </Link>
        ) : null}
      </div>

      <div className="mb-8">
        <FeedFilters params={params} categories={categories} />
      </div>

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
        <ShotGrid shots={feed.shots} likeable signedIn={Boolean(user)} />
      )}

      {nextHref ? <LoadMore href={nextHref} /> : null}
    </div>
  );
}
