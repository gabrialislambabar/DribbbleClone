import type { Metadata } from "next";
import Link from "next/link";

import { SetupNotice } from "@/components/layout/setup-notice";
import { ShotGrid } from "@/components/shots/shot-grid";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublishedShots } from "@/lib/data/shots";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Discover design work",
};

type HomePageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const { shots, hasMore } = await getPublishedShots(page);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <section className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Discover design work
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
          Fresh shots from designers around the community. Newest publications first.
        </p>
      </section>

      {shots.length === 0 ? (
        <EmptyState
          title="No shots yet"
          description="Once designers publish their work, it will show up here."
          action={
            <Link href="/sign-up" className={buttonClasses()}>
              Join and share your first shot
            </Link>
          }
        />
      ) : (
        <ShotGrid shots={shots} />
      )}

      {hasMore ? (
        <div className="mt-10 flex justify-center">
          <Link href={`/?page=${page + 1}`} className={buttonClasses("secondary")}>
            Load more
          </Link>
        </div>
      ) : null}
    </div>
  );
}
