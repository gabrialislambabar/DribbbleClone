import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentSection } from "@/components/comments/comment-section";
import { FollowButton } from "@/components/profile/follow-button";
import { LikeButton } from "@/components/shots/like-button";
import { ShotActions } from "@/components/shots/shot-actions";
import { ShotStatusBadge } from "@/components/shots/shot-status-badge";
import { Avatar } from "@/components/ui/avatar";
import { getUser } from "@/lib/auth";
import {
  COMMENT_MAX,
  COMMENT_PAGE_SIZE,
  getComments,
  getFollowState,
  isShotLiked,
} from "@/lib/data/social";
import { getShotById } from "@/lib/data/shots";
import { avatarUrl, shotCoverUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

type ShotPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ comments?: string | string[] }>;
};

export async function generateMetadata({ params }: ShotPageProps): Promise<Metadata> {
  const { id } = await params;
  const shot = await getShotById(id);

  return {
    title: shot ? shot.title : "Shot not found",
  };
}

function parseCommentLimit(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return COMMENT_PAGE_SIZE;
  }

  return Math.min(Math.max(parsed, COMMENT_PAGE_SIZE), COMMENT_MAX);
}

export default async function ShotPage({ params, searchParams }: ShotPageProps) {
  const { id } = await params;
  const shot = await getShotById(id);

  if (!shot) {
    notFound();
  }

  const user = await getUser();
  const isOwner = user?.id === shot.creator.id;
  const cover = shotCoverUrl(shot.cover_image_path);
  const published = shot.status === "published";
  const commentLimit = parseCommentLimit((await searchParams).comments);

  const [liked, following, comments] = await Promise.all([
    user && published ? isShotLiked(shot.id, user.id) : Promise.resolve(false),
    user && published && !isOwner
      ? getFollowState(user.id, shot.creator.id)
      : Promise.resolve(false),
    published ? getComments(shot.id, commentLimit) : Promise.resolve([]),
  ]);

  const signInHref = `/sign-in?next=/shots/${shot.id}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{shot.title}</h1>
            {isOwner ? <ShotStatusBadge status={shot.status} /> : null}
          </div>
          <p className="mt-2 text-sm text-muted">
            by{" "}
            <Link
              href={`/u/${shot.creator.username}`}
              className="font-medium text-foreground hover:text-brand"
            >
              {shot.creator.display_name}
            </Link>{" "}
            in {shot.category_name}
          </p>
        </div>

        {isOwner ? <ShotActions shotId={shot.id} status={shot.status} /> : null}
      </div>

      <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-surface">
        {cover ? (
          <Image
            src={cover}
            alt={shot.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        ) : null}
      </div>

      {published ? (
        <div className="mt-4 flex items-center gap-4">
          <LikeButton
            shotId={shot.id}
            liked={liked}
            count={shot.like_count}
            interactive={Boolean(user)}
          />
          <Link
            href="#comments"
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted hover:bg-surface hover:text-foreground"
          >
            {shot.comment_count} comments
          </Link>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <section>
          <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
            About this shot
          </h2>
          <p className="mt-3 text-sm leading-7 whitespace-pre-line text-foreground/90">
            {shot.description ?? "No description was added for this shot."}
          </p>

          {shot.tags.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {shot.tags.map((tag) => (
                <li
                  key={tag.id}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <aside className="h-fit space-y-5 rounded-2xl border border-border bg-white p-5">
          <Link
            href={`/u/${shot.creator.username}`}
            className="flex items-center gap-3 hover:text-brand"
          >
            <Avatar
              src={avatarUrl(shot.creator.avatar_path)}
              name={shot.creator.display_name}
              size={44}
            />
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {shot.creator.display_name}
              </span>
              <span className="block truncate text-xs text-muted">
                @{shot.creator.username}
              </span>
            </span>
          </Link>

          {!isOwner ? (
            <FollowButton
              profileId={shot.creator.id}
              following={following}
              signedIn={Boolean(user)}
              signInHref={signInHref}
            />
          ) : null}

          <dl className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Category</dt>
              <dd>{shot.category_name}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Published</dt>
              <dd>{shot.published_at ? formatDate(shot.published_at) : "Not yet"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Likes</dt>
              <dd>{shot.like_count}</dd>
            </div>
            {isOwner ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Visibility</dt>
                <dd className="capitalize">{shot.status}</dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>

      {published ? (
        <CommentSection
          shotId={shot.id}
          shotOwnerId={shot.creator.id}
          currentUserId={user?.id ?? null}
          signedIn={Boolean(user)}
          comments={comments}
          commentCount={shot.comment_count}
          limit={commentLimit}
          signInHref={signInHref}
        />
      ) : null}
    </div>
  );
}
