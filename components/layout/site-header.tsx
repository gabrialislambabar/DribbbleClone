import Link from "next/link";

import { signOut } from "@/app/(auth)/actions";
import { MobileMenu, type MobileNavLink } from "@/components/layout/mobile-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SearchForm } from "@/components/search/search-form";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentProfile, getUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/data/notifications";
import { isSupabaseConfigured } from "@/lib/env";
import { avatarUrl } from "@/lib/storage";

const NAV_LINKS: MobileNavLink[] = [
  { href: "/", label: "Explore" },
  { href: "/search?tab=designers", label: "Hire Talent" },
  { href: "/sign-up", label: "Get Hired" },
  { href: "/search?tab=shots", label: "Community" },
];

const navLinkClasses =
  "rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export async function SiteHeader() {
  const configured = isSupabaseConfigured();
  const user = configured ? await getUser() : null;
  const profile = user ? await getCurrentProfile() : null;
  const unread = user ? await getUnreadCount(user.id) : 0;
  const displayName = profile?.display_name ?? user?.email ?? "Account";

  const mobileLinks: MobileNavLink[] = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/shots/new", label: "New shot" },
        { href: "/settings", label: "Settings" },
        ...NAV_LINKS,
      ]
    : [...NAV_LINKS, { href: "/sign-up", label: "Sign up" }];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-baseline gap-0.5 text-xl font-bold tracking-tight"
        >
          <span>dribbble</span>
          <span className="text-brand">.</span>
          <span className="text-sm font-medium text-muted">clone</span>
        </Link>

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={navLinkClasses}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <Link href="/dashboard" className={navLinkClasses}>
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchForm className="hidden w-48 xl:block" />

          {!configured ? (
            <span className="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 sm:inline">
              Supabase not configured
            </span>
          ) : null}

          {user ? (
            <>
              <Link
                href="/shots/new"
                className={buttonClasses("primary", "sm", "max-lg:hidden")}
              >
                New shot
              </Link>
              <NotificationBell key={unread} userId={user.id} initialUnread={unread} />
              <Link
                href="/settings"
                className="hidden items-center gap-2 rounded-full p-1 pr-3 hover:bg-surface lg:flex"
              >
                <Avatar
                  src={avatarUrl(profile?.avatar_path)}
                  name={displayName}
                  size={32}
                />
                <span className="hidden max-w-32 truncate text-sm font-medium xl:block">
                  {displayName}
                </span>
              </Link>
              <Link
                href="/settings"
                aria-label="Account settings"
                className="rounded-full lg:hidden"
              >
                <Avatar
                  src={avatarUrl(profile?.avatar_path)}
                  name={displayName}
                  size={32}
                />
              </Link>
              <form action={signOut} className="hidden lg:block">
                <button type="submit" className={navLinkClasses}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/sign-up"
                className={buttonClasses("ghost", "sm", "max-sm:hidden")}
              >
                Sign up
              </Link>
              <Link href="/sign-in" className={buttonClasses("dark", "sm")}>
                Log in
              </Link>
            </>
          )}

          <MobileMenu links={mobileLinks} signedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
