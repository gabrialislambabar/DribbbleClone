"use client";

import { useActionState } from "react";

import { reportContent, type ReportActionState } from "@/app/moderation/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const REASON_OPTIONS = [
  { value: "spam", label: "Spam" },
  { value: "abuse", label: "Abuse or harassment" },
  { value: "copyright", label: "Copyright" },
  { value: "other", label: "Other" },
];

type ReportButtonProps = {
  targetType: "shot" | "comment" | "profile";
  shotId?: string;
  commentId?: string;
  profileId?: string;
  signedIn: boolean;
};

export function ReportButton({
  targetType,
  shotId,
  commentId,
  profileId,
  signedIn,
}: ReportButtonProps) {
  const [state, formAction, pending] = useActionState(reportContent, {
    error: undefined,
    success: undefined,
  } satisfies ReportActionState);

  if (!signedIn) {
    return null;
  }

  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-muted hover:text-foreground">
        Report
      </summary>

      <form
        action={formAction}
        className="mt-2 space-y-2 rounded-lg border border-border bg-white p-3"
      >
        <input type="hidden" name="target_type" value={targetType} />
        {shotId ? <input type="hidden" name="shot_id" value={shotId} /> : null}
        {commentId ? <input type="hidden" name="comment_id" value={commentId} /> : null}
        {profileId ? <input type="hidden" name="profile_id" value={profileId} /> : null}

        <Select name="reason" aria-label="Report reason" defaultValue="spam">
          {REASON_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Textarea
          name="details"
          rows={2}
          maxLength={1000}
          placeholder="Anything else moderators should know? (optional)"
        />

        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? "Submitting…" : "Submit report"}
        </Button>

        {state.error ? <p className="text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-emerald-700">{state.success}</p> : null}
      </form>
    </details>
  );
}
