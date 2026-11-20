import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create your account",
};

export default function SignUpPage() {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Join the community</h1>
      <p className="mt-1 text-sm text-muted">
        Create a profile, share shots, and get discovered.
      </p>

      <div className="mt-6">
        <SignUpForm />
      </div>
    </div>
  );
}
