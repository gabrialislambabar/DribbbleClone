"use client";

import { useActionState, useEffect, useState } from "react";

import { updateProfile, type ProfileState } from "@/app/settings/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { avatarUrl } from "@/lib/storage";
import type { Profile } from "@/lib/types/app";

type ProfileFormProps = {
  profile: Profile;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, {
    success: undefined,
  } satisfies ProfileState);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const currentAvatar = preview ?? avatarUrl(profile.avatar_path);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Public profile</h2>
      <p className="mt-1 text-sm text-muted">
        This information appears on your public designer page.
      </p>

      <form action={formAction} className="mt-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar src={currentAvatar} name={profile.display_name} size={64} />
          <div className="min-w-0 flex-1">
            <label htmlFor="avatar" className="block text-sm font-medium">
              Avatar
            </label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
              className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-brand/10"
            />
            <p className="mt-1 text-xs text-muted">JPEG, PNG, or WebP. Up to 2 MB.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name" htmlFor="display_name">
            <Input
              id="display_name"
              name="display_name"
              defaultValue={profile.display_name}
              maxLength={60}
              required
            />
          </Field>

          <Field label="Username" htmlFor="username" hint="Usernames are permanent.">
            <Input
              id="username"
              value={profile.username}
              readOnly
              disabled
              className="bg-surface text-muted"
            />
          </Field>
        </div>

        <Field label="Bio" htmlFor="bio" hint="Up to 300 characters.">
          <Textarea
            id="bio"
            name="bio"
            defaultValue={profile.bio ?? ""}
            maxLength={300}
            rows={4}
            placeholder="Tell people what you design."
          />
        </Field>

        <Field
          label="Portfolio URL"
          htmlFor="portfolio_url"
          hint="Optional. Must start with http:// or https://."
        >
          <Input
            id="portfolio_url"
            name="portfolio_url"
            type="url"
            defaultValue={profile.portfolio_url ?? ""}
            maxLength={500}
            placeholder="https://your-portfolio.com"
          />
        </Field>

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

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </Card>
  );
}
