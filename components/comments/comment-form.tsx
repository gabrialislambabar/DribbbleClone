"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { addComment, type CommentActionState } from "@/app/social/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentFormProps = {
  shotId: string;
  signedIn: boolean;
  signInHref: string;
};

export function CommentForm({ shotId, signedIn, signInHref }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [length, setLength] = useState(0);
  const [state, formAction, pending] = useActionState(
    async (previousState: CommentActionState, formData: FormData) => {
      const result = await addComment(shotId, previousState, formData);

      if (result.success) {
        formRef.current?.reset();
        setLength(0);
      }

      return result;
    },
    {} satisfies CommentActionState,
  );

  if (!signedIn) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-sm text-muted">
        <span>Sign in to join the conversation.</span>
        <Link href={signInHref} className={buttonClasses("secondary", "sm")}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <Textarea
        name="body"
        rows={3}
        maxLength={1000}
        required
        placeholder="Add a comment…"
        onChange={(event) => setLength(event.target.value.length)}
      />

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">{length}/1000</span>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Post comment"}
        </Button>
      </div>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
