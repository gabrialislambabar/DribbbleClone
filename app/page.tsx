import type { Metadata } from "next";
import Link from "next/link";

import { FeedFilters } from "@/components/feed/feed-filters";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { LoadMore } from "@/components/feed/load-more";
import { SetupNotice } from "@/components/layout/setup-notice";
import { ShotGrid } from "@/components/shots/shot-grid";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckIcon, SearchIcon } from "@/components/ui/icons";
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

const FEATURES = [
  "Publish shots and build a public portfolio.",
  "Discover trending work from the community.",
  "Follow designers and get feedback on your shots.",
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

const CATEGORY_TINTS = [
  "from-rose-100 via-rose-50 to-white",
  "from-sky-100 via-sky-50 to-white",
  "from-amber-100 via-amber-50 to-white",
  "from-emerald-100 via-emerald-50 to-white",
  "from-violet-100 via-violet-50 to-white",
  "from-orange-100 via-orange-50 to-white",
];

const chipClasses =
  "inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

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
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl xl:text-6xl">
            Discover and share the world&rsquo;s best in{" "}
            <span className="text-brand">UX/UI design</span>
          </h1>

          <ul className="mt-6 space-y-3 text-sm text-foreground/90 sm:text-base">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <CheckIcon />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href={user ? "/shots/new" : "/sign-up"}
            className={buttonClasses("dark", "md", "mt-8")}
          >
            {user ? "Share your work" : "Start sharing your work"}
          </Link>
        </div>

        <HeroArtwork />
      </section>

      <section aria-label="Browse design work" className="pb-2">
        <nav
          aria-label="Browse"
          className="flex items-center gap-6 border-b border-border text-sm font-medium"
        >
          <Link
            href="/"
            aria-current="page"
            className="border-b-2 border-foreground pb-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Shots
          </Link>
          <Link
            href="/search?tab=designers"
            className="pb-3 text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Designers
          </Link>
          <span aria-disabled="true" className="pb-3 text-muted/50">
            Services
          </span>
        </nav>

        <form action="/search" method="get" role="search" className="mt-5">
          <label htmlFor="home-search" className="sr-only">
            Search shots or designers
          </label>
          <div className="relative">
            <input
              id="home-search"
              name="q"
              type="search"
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
                href={`/search?q=${encodeURIComponent(topic)}`}
                className={chipClasses}
              >
                {topic}
              </Link>
            </li>
          ))}
        </ul>
      </section>

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
            <ShotGrid shots={feed.shots} likeable signedIn={Boolean(user)} />
          )}
        </div>

        {nextHref ? <LoadMore href={nextHref} /> : null}
      </section>

      <section aria-labelledby="categories-heading" className="mt-14 pb-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="categories-heading" className="text-lg font-semibold tracking-tight">
            Browse by category
          </h2>
          <Link
            href="/search"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            View all
          </Link>
        </div>

        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/?category=${category.id}`}
              className="group w-36 shrink-0 snap-start sm:w-44"
            >
              <div
                aria-hidden="true"
                className={`aspect-[4/3] rounded-2xl border border-border bg-gradient-to-br transition-colors group-hover:border-brand/30 ${
                  CATEGORY_TINTS[index % CATEGORY_TINTS.length]
                }`}
              />
              <span className="mt-2 block text-sm font-medium text-foreground group-hover:text-brand">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
