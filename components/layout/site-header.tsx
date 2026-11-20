import Link from "next/link";

import { signOut } from "@/app/(auth)/actions";
import { SearchForm } from "@/components/search/search-form";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentProfile, getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { avatarUrl } from "@/lib/storage";

export async function SiteHeader() {
  const configured = isSupabaseConfigured();
  const user = configured ? await getUser() : null;
  const profile = user ? await getCurrentProfile() : null;
  const displayName = profile?.display_name ?? user?.email ?? "Account";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-baseline gap-0.5 text-xl font-bold tracking-tight"
          >
            <span>dribbble</span>
            <span className="text-brand">.</span>
            <span className="text-sm font-medium text-muted">clone</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
            >
              Discover
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
              >
                Dashboard
              </Link>
            ) : null}
          </nav>
        </div>

        <SearchForm className="hidden w-64 md:block" />

        <div className="flex items-center gap-2">
          {!configured ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Supabase not configured
            </span>
          ) : null}

          {user ? (
            <>
              <Link href="/shots/new" className={buttonClasses("primary", "sm")}>
                New shot
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-surface"
              >
                <Avatar
                  src={avatarUrl(profile?.avatar_path)}
                  name={displayName}
                  size={32}
                />
                <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
                  {displayName}
                </span>
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className={buttonClasses("ghost", "sm")}>
                Sign in
              </Link>
              <Link href="/sign-up" className={buttonClasses("primary", "sm")}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
