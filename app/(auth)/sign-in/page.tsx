import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";
import { safeRedirectPath } from "@/lib/validation/profile";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to manage your shots and profile.</p>

      <div className="mt-6">
        <SignInForm next={safeRedirectPath(next)} initialError={error} />
      </div>
    </div>
  );
}
