import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold tracking-wide text-brand uppercase">404</p>
      <h1 className="mt-2 text-2xl font-semibold">We could not find that page</h1>
      <p className="mt-2 text-sm text-muted">
        The link may be broken, or the shot may have been removed or left unpublished.
      </p>
      <Link href="/" className={buttonClasses("secondary", "md", "mt-6")}>
        Back to discover
      </Link>
    </div>
  );
}
