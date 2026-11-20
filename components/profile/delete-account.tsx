"use client";

import { useActionState } from "react";

import { deleteAccount, type DeleteAccountState } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type DeleteAccountProps = {
  username: string;
  enabled: boolean;
};

export function DeleteAccount({ username, enabled }: DeleteAccountProps) {
  const [state, formAction, pending] = useActionState(deleteAccount, {
    error: undefined,
  } satisfies DeleteAccountState);

  return (
    <Card className="border-red-200 p-6">
      <h2 className="text-lg font-semibold text-red-700">Delete account</h2>
      <p className="mt-1 text-sm text-muted">
        This permanently removes your profile, shots, tags links, images, and sign-in
        credentials. This cannot be undone.
      </p>

      {!enabled ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Set <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in your
          environment to enable account deletion.
        </p>
      ) : (
        <form action={formAction} className="mt-5 space-y-4">
          <Field label={`Type ${username} to confirm`} htmlFor="confirmation">
            <Input
              id="confirmation"
              name="confirmation"
              autoComplete="off"
              placeholder={username}
              required
            />
          </Field>

          {state.error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" variant="danger" disabled={pending}>
            {pending ? "Deleting…" : "Delete my account"}
          </Button>
        </form>
      )}
    </Card>
  );
}
