import Link from "next/link";

import { CommentForm } from "@/components/comments/comment-form";
import { CommentItem } from "@/components/comments/comment-item";
import { COMMENT_MAX, COMMENT_PAGE_SIZE } from "@/lib/data/social";
import type { CommentItem as CommentItemType } from "@/lib/types/app";

type CommentSectionProps = {
  shotId: string;
  shotOwnerId: string;
  currentUserId: string | null;
  signedIn: boolean;
  comments: CommentItemType[];
  commentCount: number;
  limit: number;
  signInHref: string;
};

export function CommentSection({
  shotId,
  shotOwnerId,
  currentUserId,
  signedIn,
  comments,
  commentCount,
  limit,
  signInHref,
}: CommentSectionProps) {
  const nextLimit = Math.min(limit + COMMENT_PAGE_SIZE, COMMENT_MAX);
  const canShowMore = commentCount > comments.length && limit < COMMENT_MAX;

  return (
    <section id="comments" className="mt-10 border-t border-border pt-8">
      <h2 className="text-lg font-semibold">
        Comments <span className="text-sm font-normal text-muted">({commentCount})</span>
      </h2>

      <div className="mt-4">
        <CommentForm shotId={shotId} signedIn={signedIn} signInHref={signInHref} />
      </div>

      {comments.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
          No comments yet. Be the first to say something.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canEdit={currentUserId === comment.author.id}
              canDelete={
                currentUserId === comment.author.id || currentUserId === shotOwnerId
              }
            />
          ))}
        </ul>
      )}

      {canShowMore ? (
        <div className="mt-4">
          <Link
            href={`?comments=${nextLimit}#comments`}
            className="text-sm font-medium text-brand hover:text-brand-dark"
          >
            Show more comments
          </Link>
        </div>
      ) : null}
    </section>
  );
}
