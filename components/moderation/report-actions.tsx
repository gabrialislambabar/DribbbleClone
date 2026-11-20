"use client";

import { useActionState } from "react";

import {
  dismissReport,
  takeDownTarget,
  type ModerationState,
} from "@/app/moderation/actions";
import { Button } from "@/components/ui/button";

type ReportActionsProps = {
  reportId: string;
};

export function ReportActions({ reportId }: ReportActionsProps) {
  const [dismissState, dismissAction, dismissPending] = useActionState(
    dismissReport,
    {} satisfies ModerationState,
  );
  const [takeDownState, takeDownAction, takeDownPending] = useActionState(
    takeDownTarget,
    {} satisfies ModerationState,
  );

  const error = dismissState.error ?? takeDownState.error;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={takeDownAction}>
          <input type="hidden" name="report_id" value={reportId} />
          <Button type="submit" size="sm" variant="danger" disabled={takeDownPending}>
            {takeDownPending ? "Taking down…" : "Take down"}
          </Button>
        </form>

        <form action={dismissAction}>
          <input type="hidden" name="report_id" value={reportId} />
          <Button type="submit" size="sm" variant="secondary" disabled={dismissPending}>
            {dismissPending ? "Dismissing…" : "Dismiss"}
          </Button>
        </form>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {dismissState.success ? (
        <p className="text-xs text-emerald-700">{dismissState.success}</p>
      ) : null}
      {takeDownState.success ? (
        <p className="text-xs text-emerald-700">{takeDownState.success}</p>
      ) : null}
    </div>
  );
}
