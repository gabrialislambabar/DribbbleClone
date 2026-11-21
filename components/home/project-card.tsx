"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

import { toggleLike } from "@/app/social/actions";
import { Avatar } from "@/components/ui/avatar";
import { BookmarkIcon, CommentIcon, EyeIcon, HeartIcon } from "@/components/ui/icons";
import { avatarUrl, shotCoverUrl } from "@/lib/storage";
import type { ShotListItem } from "@/lib/types/app";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  shot: ShotListItem;
  signedIn: boolean;
  pro?: boolean;
};

const circularAction =
  "inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none";

const neutralAction = "bg-white/90 text-foreground hover:bg-white";
const activeAction = "bg-brand text-white hover:bg-brand-dark";

function estimateViews(id: string, likes: number): number {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  return Math.max(likes * 9 + (hash % 500), 120);
}

function formatCount(value: number): string {
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${thousands >= 10 ? Math.round(thousands) : thousands.toFixed(1)}k`;
  }

  return String(value);
}

export function ProjectCard({ shot, signedIn, pro = false }: ProjectCardProps) {
  const [liked, setLiked] = useState(Boolean(shot.liked_by_me));
  const [likeCount, setLikeCount] = useState(shot.like_count);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cover = shotCoverUrl(shot.cover_image_path);
  const href = `/shots/${shot.id}`;
  const views = estimateViews(shot.id, shot.like_count);

  function handleLike() {
    if (!signedIn || pending) {
      return;
    }

    const next = !liked;
    setError(null);
    setLiked(next);
    setLikeCount((current) => Math.max(0, current + (next ? 1 : -1)));

    startTransition(async () => {
      const result = await toggleLike(shot.id);

      if (!result.ok) {
        setLiked(!next);
        setLikeCount((current) => Math.max(0, current + (next ? -1 : 1)));
        setError(result.error);
      }
    });
  }

  return (
    <article className="group relative min-w-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
        <Link
          href={href}
          className="block h-full w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {cover ? (
            <Image
              src={cover}
              alt={shot.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              unoptimized={Boolean(shot.cover_credit)}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
            />
          ) : null}
        </Link>

        <div
          aria-hidden="true"
          className="project-overlay pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/10 to-transparent opacity-100 transition-opacity duration-200 motion-reduce:transition-none lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100"
        />

        <div className="project-actions pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 opacity-100 transition-[opacity,transform] duration-200 motion-reduce:transition-none lg:translate-y-1 lg:opacity-0 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
          <Link
            href={href}
            className="pointer-events-auto line-clamp-2 max-w-[62%] text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {shot.title}
          </Link>

          <div className="pointer-events-auto flex shrink-0 items-center gap-2">
            <Link
              href={`/u/${shot.creator.username}`}
              aria-label={`Get in touch with ${shot.creator.display_name}`}
              className={cn(circularAction, neutralAction)}
            >
              <CommentIcon />
            </Link>

            <button
              type="button"
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved" : "Save shot"}
              title={saved ? "Saved for this session" : "Save shot"}
              onClick={() => setSaved((current) => !current)}
              className={cn(circularAction, saved ? activeAction : neutralAction)}
            >
              <BookmarkIcon filled={saved} />
            </button>

            {signedIn ? (
              <button
                type="button"
                aria-pressed={liked}
                aria-label={liked ? "Unlike this shot" : "Like this shot"}
                onClick={handleLike}
                disabled={pending}
                className={cn(circularAction, liked ? activeAction : neutralAction)}
              >
                <HeartIcon filled={liked} />
              </button>
            ) : (
              <Link
                href="/sign-in?next=/"
                aria-label="Sign in to like shots"
                className={cn(circularAction, neutralAction)}
              >
                <HeartIcon />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            src={avatarUrl(shot.creator.avatar_path)}
            name={shot.creator.display_name}
            size={28}
          />
          <Link
            href={`/u/${shot.creator.username}`}
            className="truncate text-sm font-medium hover:text-brand"
          >
            {shot.creator.display_name}
          </Link>
          {pro ? (
            <span className="shrink-0 rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
              PRO
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3 text-xs text-muted">
          <span
            className="inline-flex items-center gap-1"
            aria-label={`${likeCount} likes`}
          >
            <HeartIcon filled={liked} className="h-3.5 w-3.5" />
            {formatCount(likeCount)}
          </span>
          <span
            className="inline-flex items-center gap-1"
            title="Estimated views (view tracking is not enabled)"
            aria-label={`${views} estimated views`}
          >
            <EyeIcon className="h-3.5 w-3.5" />
            {formatCount(views)}
          </span>
        </div>
      </div>

      {error ? (
        <p role="status" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : null}
      {saved ? (
        <span role="status" className="sr-only">
          Saved for this session.
        </span>
      ) : null}
    </article>
  );
}
