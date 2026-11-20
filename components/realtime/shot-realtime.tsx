"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { CommentSection } from "@/components/comments/comment-section";
import { LikeButton } from "@/components/shots/like-button";
import { createClient } from "@/lib/supabase/client";
import type { CommentItem } from "@/lib/types/app";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ShotRealtimeProps = {
  published: boolean;
  shotId: string;
  shotOwnerId: string;
  currentUserId: string | null;
  signedIn: boolean;
  commentLimit: number;
  signInHref: string;
  initialLiked: boolean;
  initialLikeCount: number;
  initialCommentCount: number;
  initialComments: CommentItem[];
  children: ReactNode;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseCount(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 1_000_000_000
    ? value
    : null;
}

function parseComment(value: unknown): CommentItem | null {
  if (!isRecord(value) || !isRecord(value.author)) {
    return null;
  }

  const author = value.author;

  if (
    typeof value.id !== "string" ||
    !UUID_PATTERN.test(value.id) ||
    typeof value.shot_id !== "string" ||
    !UUID_PATTERN.test(value.shot_id) ||
    typeof value.body !== "string" ||
    value.body.length < 1 ||
    value.body.length > 1000 ||
    !isIsoDate(value.created_at) ||
    !isIsoDate(value.updated_at) ||
    typeof author.id !== "string" ||
    !UUID_PATTERN.test(author.id) ||
    typeof author.username !== "string" ||
    author.username.length > 30 ||
    typeof author.display_name !== "string" ||
    author.display_name.length > 60 ||
    (author.avatar_path !== null && typeof author.avatar_path !== "string")
  ) {
    return null;
  }

  return {
    id: value.id,
    shot_id: value.shot_id,
    body: value.body,
    created_at: value.created_at,
    updated_at: value.updated_at,
    author: {
      id: author.id,
      username: author.username,
      display_name: author.display_name,
      avatar_path: author.avatar_path as string | null,
    },
  };
}

export function ShotRealtime({
  published,
  shotId,
  shotOwnerId,
  currentUserId,
  signedIn,
  commentLimit,
  signInHref,
  initialLiked,
  initialLikeCount,
  initialCommentCount,
  initialComments,
  children,
}: ShotRealtimeProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [comments, setComments] = useState<CommentItem[]>(initialComments);

  useEffect(() => {
    if (!published) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`shot:${shotId}`, { config: { private: true } })
      .on("broadcast", { event: "comment:new" }, ({ payload }) => {
        if (!isRecord(payload)) {
          return;
        }

        const comment = parseComment(payload.comment);
        if (comment && comment.shot_id === shotId) {
          setComments((current) =>
            current.some((item) => item.id === comment.id)
              ? current
              : [...current, comment],
          );
        }

        const count = parseCount(payload.commentCount);
        if (count !== null) {
          setCommentCount(count);
        }
      })
      .on("broadcast", { event: "comment:updated" }, ({ payload }) => {
        if (!isRecord(payload) || typeof payload.id !== "string") {
          return;
        }

        setComments((current) =>
          current.map((item) =>
            item.id === payload.id && typeof payload.body === "string"
              ? {
                  ...item,
                  body: payload.body.slice(0, 1000),
                  updated_at: isIsoDate(payload.updated_at)
                    ? payload.updated_at
                    : item.updated_at,
                }
              : item,
          ),
        );
      })
      .on("broadcast", { event: "comment:deleted" }, ({ payload }) => {
        if (!isRecord(payload) || typeof payload.id !== "string") {
          return;
        }

        setComments((current) => current.filter((item) => item.id !== payload.id));

        const count = parseCount(payload.commentCount);
        if (count !== null) {
          setCommentCount(count);
        }
      })
      .on("broadcast", { event: "like:changed" }, ({ payload }) => {
        if (!isRecord(payload) || payload.shotId !== shotId) {
          return;
        }

        const count = parseCount(payload.likeCount);
        if (count !== null) {
          setLikeCount(count);
        }
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // Realtime is optional; keep the server-rendered UI working.
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [published, shotId]);

  if (!published) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="mt-4 flex items-center gap-4">
        <LikeButton
          shotId={shotId}
          liked={initialLiked}
          count={likeCount}
          interactive={signedIn}
          onCountChange={setLikeCount}
        />
        <Link
          href="#comments"
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted hover:bg-surface hover:text-foreground"
        >
          {commentCount} comments
        </Link>
      </div>

      {children}

      <CommentSection
        shotId={shotId}
        shotOwnerId={shotOwnerId}
        currentUserId={currentUserId}
        signedIn={signedIn}
        comments={comments}
        commentCount={commentCount}
        limit={commentLimit}
        signInHref={signInHref}
      />
    </>
  );
}
