"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  deleteComment,
  editComment,
  type CommentActionState,
} from "@/app/social/actions";
import { ReportButton } from "@/components/moderation/report-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { COMMENT_BODY_MAX } from "@/lib/comments/constants";
import { avatarUrl } from "@/lib/storage";
import type { CommentItem } from "@/lib/types/app";
import { formatDate } from "@/lib/utils";

type CommentItemProps = {
  comment: CommentItem;
  signedIn: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export function CommentItem({ comment, signedIn, canEdit, canDelete }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (previousState: CommentActionState, formData: FormData) => {
      const result = await editComment(comment.id, previousState, formData);

      if (result.success) {
        setEditing(false);
      }

      return result;
    },
    {} satisfies CommentActionState,
  );

  const edited =
    new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime() >
    2000;

  return (
    <li id={`comment-${comment.id}`} className="flex gap-3 py-4">
      <Link href={`/u/${comment.author.username}`} className="shrink-0">
        <Avatar
          src={avatarUrl(comment.author.avatar_path)}
          name={comment.author.display_name}
          size={36}
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <Link
            href={`/u/${comment.author.username}`}
            className="text-sm font-medium hover:text-brand"
          >
            {comment.author.display_name}
          </Link>
          <span className="text-xs text-muted">@{comment.author.username}</span>
          <span className="text-xs text-muted">
            {formatDate(comment.created_at)}
            {edited ? " · edited" : ""}
          </span>
        </div>

        {editing ? (
          <form action={formAction} className="mt-2 space-y-2">
            <Textarea
              name="body"
              rows={3}
              maxLength={COMMENT_BODY_MAX}
              defaultValue={comment.body}
              required
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
            {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
          </form>
        ) : (
          <p className="mt-1 text-sm leading-6 whitespace-pre-line text-foreground/90">
            {comment.body}
          </p>
        )}

        {!editing && (canEdit || canDelete || signedIn) ? (
          <div className="mt-1 flex items-center gap-3 text-xs">
            {canEdit ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-muted hover:text-foreground"
              >
                Edit
              </button>
            ) : null}

            {canDelete ? (
              <form
                action={async () => {
                  await deleteComment(comment.id);
                }}
                onSubmit={(event) => {
                  if (!window.confirm("Delete this comment?")) {
                    event.preventDefault();
                  }
                }}
              >
                <button type="submit" className="text-muted hover:text-red-600">
                  Delete
                </button>
              </form>
            ) : null}

            {!canEdit ? (
              <ReportButton
                targetType="comment"
                commentId={comment.id}
                signedIn={signedIn}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
