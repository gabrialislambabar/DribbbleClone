"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signIn, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type SignInFormProps = {
  next: string;
  initialError?: string;
};

export function SignInForm({ next, initialError }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(signIn, {
    error: initialError,
  } satisfies AuthState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

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

      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
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
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/sign-up" className="font-medium text-brand hover:text-brand-dark">
          Create an account
        </Link>
      </p>
    </form>
  );
}
