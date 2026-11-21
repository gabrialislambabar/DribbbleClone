"use client";

import { useState, useTransition } from "react";

import { unsaveDesign } from "@/app/gallery/actions";
import { SourceBadge } from "@/components/gallery/source-badge";
import { BookmarkIcon } from "@/components/ui/icons";
import type { SavedDesign } from "@/lib/data/saved-designs";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function SavedDesignCard({ design }: { design: SavedDesign }) {
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await unsaveDesign(design.source, design.sourceItemId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setRemoved(true);
    });
  }

  if (removed) {
    return (
      <article className="flex flex-col rounded-2xl border border-dashed border-border bg-white p-5">
        <p className="text-sm text-muted">Removed from your saved designs.</p>
        <button
          type="button"
          onClick={() => setRemoved(false)}
          className="mt-3 text-xs font-medium text-foreground underline underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Undo
        </button>
      </article>
    );
  }

  return (
    <article className="group relative min-w-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Hotlinked from the provider; never rehosted. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={design.thumbnailUrl}
          alt={`${design.title} — ${design.creatorName ?? design.source}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="min-w-0">
            <SourceBadge source={design.source} license={design.licenseName} />
          </span>

          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Remove from saved designs"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
            )}
          >
            <BookmarkIcon filled />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-3 pt-8">
          <a
            href={design.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-2 text-sm font-semibold text-white underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {design.title}
          </a>
        </div>
      </div>

      <div className="mt-2 min-w-0 text-xs">
        {design.creatorName ? (
          design.creatorUrl ? (
            <a
              href={design.creatorUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate font-medium text-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {design.creatorName}
            </a>
          ) : (
            <span className="truncate font-medium text-foreground">
              {design.creatorName}
            </span>
          )
        ) : null}

        {design.licenseName ? (
          <p className="truncate text-[11px] text-muted">
            {design.licenseUrl ? (
              <a
                href={design.licenseUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {design.licenseName}
              </a>
            ) : (
              design.licenseName
            )}
          </p>
        ) : null}

        <p className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted">
          <span>Saved {formatDate(design.savedAt)}</span>
          <a
            href={design.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Source
          </a>
        </p>
      </div>

      {error ? (
        <p role="status" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </article>
  );
}
