import Image from "next/image";
import Link from "next/link";

import { LikeButton } from "@/components/shots/like-button";
import { Avatar } from "@/components/ui/avatar";
import { CommentIcon, HeartIcon } from "@/components/ui/icons";
import { avatarUrl, shotCoverUrl } from "@/lib/storage";
import type { ShotListItem } from "@/lib/types/app";

type ShotCardProps = {
  shot: ShotListItem;
  likeable?: boolean;
  signedIn?: boolean;
};

export function ShotCard({ shot, likeable = false, signedIn = false }: ShotCardProps) {
  const cover = shotCoverUrl(shot.cover_image_path);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition hover:border-brand/30 hover:shadow-sm">
      <Link href={`/shots/${shot.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface">
          {cover ? (
            <Image
              src={cover}
              alt={shot.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/shots/${shot.id}`}
            className="line-clamp-1 font-semibold hover:text-brand"
          >
            {shot.title}
          </Link>
          <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">
            {shot.category_name}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Avatar
            src={avatarUrl(shot.creator.avatar_path)}
            name={shot.creator.display_name}
            size={24}
          />
          <Link
            href={`/u/${shot.creator.username}`}
            className="truncate text-muted hover:text-foreground"
          >
            {shot.creator.display_name}
          </Link>
        </div>

        {shot.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {shot.tags.slice(0, 4).map((tag) => (
              <li
                key={tag.id}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted"
              >
                {tag.name}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex items-center gap-3 border-t border-border pt-3">
          {likeable ? (
            <LikeButton
              shotId={shot.id}
              liked={Boolean(shot.liked_by_me)}
              count={shot.like_count}
              interactive={signedIn}
            />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <HeartIcon />
              {shot.like_count}
            </span>
          )}

          <Link
            href={`/shots/${shot.id}#comments`}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
          >
            <CommentIcon />
            {shot.comment_count}
          </Link>
        </div>
      </div>
    </article>
  );
}
