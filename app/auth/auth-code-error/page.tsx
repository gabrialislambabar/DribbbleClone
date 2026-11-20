import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">That link did not work</h1>
      <p className="mt-2 text-sm text-muted">
        The confirmation link may be expired or was already used. Try signing in, or sign
        up again if you still need an account.
      </p>
      <Link
        href="/sign-in"
        className="mt-6 inline-block text-sm font-medium text-brand hover:text-brand-dark"
      >
        Go to sign in
      </Link>
    </div>
  );
}
