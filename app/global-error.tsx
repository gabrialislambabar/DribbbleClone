"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-start justify-center gap-4 px-4">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-muted">
            The application hit an unexpected error. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
