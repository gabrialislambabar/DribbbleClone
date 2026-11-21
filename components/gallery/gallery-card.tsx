"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { saveDesign, unsaveDesign } from "@/app/gallery/actions";
import { BookmarkIcon } from "@/components/ui/icons";
import { SourceBadge } from "@/components/gallery/source-badge";
import type { GalleryItem } from "@/lib/gallery/types";
import { cn } from "@/lib/utils";

type GalleryCardProps = {
  item: GalleryItem;
  saved: boolean;
  signedIn: boolean;
  onSavedChange: (item: GalleryItem, saved: boolean) => void;
};

const actionClasses =
  "inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none";

export function GalleryCard({ item, saved, signedIn, onSavedChange }: GalleryCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  function toggleSave() {
    if (!signedIn) {
      router.push(`/sign-in?next=${encodeURIComponent("/gallery")}`);
      return;
    }

    const next = !isSaved;
    setError(null);
    setIsSaved(next);
    startTransition(async () => {
      const result = next
        ? await saveDesign({
            source: item.source,
            sourceItemId: item.sourceItemId,
            title: item.title,
            category: item.category,
            imageUrl: item.imageUrl,
            thumbnailUrl: item.thumbnailUrl,
            sourceUrl: item.sourceUrl,
            creatorName: item.creatorName,
            creatorUrl: item.creatorUrl,
            licenseName: item.licenseName,
            licenseUrl: item.licenseUrl,
          })
        : await unsaveDesign(item.source, item.sourceItemId);

      if (result.error) {
        setIsSaved(!next);
        setError(result.error);
        return;
      }

      onSavedChange(item, next);
    });
  }

  return (
    <article className="group relative min-w-0">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface"
        style={{ backgroundColor: item.dominantColor ?? undefined }}
      >
        {!failed ? (
          // Provider CDNs require hotlinking, so these bypass next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={item.thumbnailUrl}
            alt={`${item.title} — ${item.attribution}`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        ) : (
          <div
            role="img"
            aria-label={`Image unavailable: ${item.title}`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-surface px-4 text-center"
          >
            <span className="text-xs font-medium text-muted">Preview unavailable</span>
            <span className="text-[11px] text-muted/80">Open the original source</span>
          </div>
        )}

        {!loaded && !failed ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface via-white to-surface motion-reduce:animate-none"
          />
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/15 to-transparent opacity-100 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100" />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="pointer-events-auto min-w-0">
            <SourceBadge source={item.source} license={item.licenseName} />
          </span>

          <button
            type="button"
            onClick={toggleSave}
            aria-pressed={isSaved}
            aria-label={isSaved ? "Remove from saved designs" : "Save this design"}
            disabled={pending}
            className={cn(
              "pointer-events-auto",
              actionClasses,
              isSaved
                ? "bg-brand text-white hover:bg-brand-dark"
                : "bg-white/90 text-foreground hover:bg-white",
            )}
          >
            <BookmarkIcon filled={isSaved} />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-2 text-sm font-semibold text-white underline-offset-2 drop-shadow-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {item.title}
          </a>
        </div>
      </div>

      <div className="mt-2 flex items-start justify-between gap-2 text-xs">
        <div className="min-w-0">
          {item.creatorName ? (
            item.creatorUrl ? (
              <a
                href={item.creatorUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate font-medium text-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {item.creatorName}
              </a>
            ) : (
              <span className="truncate font-medium text-foreground">
                {item.creatorName}
              </span>
            )
          ) : null}
          <p className="truncate text-muted">{item.attribution}</p>
          {item.licenseName ? (
            <p className="truncate text-[11px] text-muted">
              {item.licenseUrl ? (
                <a
                  href={item.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {item.licenseName}
                </a>
              ) : (
                item.licenseName
              )}
            </p>
          ) : null}
        </div>

        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-sm text-[11px] text-muted underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Source
        </a>
      </div>

      {error ? (
        <p role="status" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </article>
  );
}
