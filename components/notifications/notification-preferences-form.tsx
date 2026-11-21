"use client";

import { useActionState } from "react";

import {
  updateNotificationPreferences,
  type NotificationPreferencesState,
} from "@/app/notifications/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { NotificationPreferences } from "@/lib/types/app";

type NotificationPreferencesFormProps = {
  preferences: NotificationPreferences;
};

export function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const [state, formAction, pending] = useActionState(updateNotificationPreferences, {
    error: undefined,
    success: undefined,
  } satisfies NotificationPreferencesState);

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="mt-1 text-sm text-muted">
          Choose which in-app notifications you want to receive.
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="follows"
            defaultChecked={preferences.follows}
            className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand/30"
          />
          <span>
            <span className="font-medium">New followers</span>
            <span className="block text-xs text-muted">
              When someone follows your profile.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="comments"
            defaultChecked={preferences.comments}
            className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand/30"
          />
          <span>
            <span className="font-medium">Comments</span>
            <span className="block text-xs text-muted">
              When someone comments on one of your shots.
            </span>
          </span>
        </label>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save notification settings"}
        </Button>

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {state.success}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
