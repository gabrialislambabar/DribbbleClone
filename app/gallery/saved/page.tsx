import type { Metadata } from "next";
import Link from "next/link";

import { SavedDesignCard } from "@/components/gallery/saved-design-card";
import {
  OpenverseDisclaimer,
  ProviderCredits,
} from "@/components/gallery/source-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { getSavedDesigns } from "@/lib/data/saved-designs";

export const metadata: Metadata = {
  title: "Saved designs",
  description: "References you bookmarked from the design discovery gallery.",
};

export default async function SavedDesignsPage() {
  const user = await requireUser();
  const { designs, unavailable } = await getSavedDesigns(user.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
            Saved designs
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your reference board
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
            A private list of bookmarks to images from other sources. Saving a
            design does not grant ownership or exclusive rights.
          </p>
        </div>

        <Link
          href="/gallery"
          className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-white transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Browse gallery
        </Link>
      </header>

      {unavailable ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-900">
            Saved designs are not available yet
          </h2>
          <p className="mt-1 text-sm leading-6 text-amber-900/80">
            Run{" "}
            <code className="rounded bg-white/70 px-1">
              supabase/migrations/0013_saved_designs.sql
            </code>{" "}
            in the Supabase SQL editor, then reload this page. The gallery itself
            still works.
          </p>
        </div>
      ) : designs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing saved yet"
            description="Browse the gallery and use the bookmark button on any card to start your reference board."
            action={
              <Link
                href="/gallery"
                className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-white hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Open the gallery
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs text-muted">
            {designs.length} saved {designs.length === 1 ? "design" : "designs"}
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {designs.map((design) => (
              <li key={design.id} className="min-w-0">
                <SavedDesignCard design={design} />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-8 space-y-3">
        <ProviderCredits />
        <OpenverseDisclaimer />
      </div>
    </div>
  );
}
