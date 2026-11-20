"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUp, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, {} satisfies AuthState);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="mt-2 text-sm text-muted">{state.success}</p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block text-sm font-medium text-brand hover:text-brand-dark"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Username" htmlFor="username" hint="Lowercase, 3–30 characters.">
          <Input
            id="username"
            name="username"
            autoComplete="username"
            required
            placeholder="jane_doe"
          />
        </Field>

        <Field label="Display name" htmlFor="display_name">
          <Input
            id="display_name"
            name="display_name"
            autoComplete="name"
            required
            placeholder="Jane Doe"
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="••••••••"
        />
      </Field>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-brand hover:text-brand-dark">
          Sign in
        </Link>
      </p>
    </form>
  );
}
