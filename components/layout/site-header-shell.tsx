"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/app/(auth)/actions";
import { MobileMenu, type MobileNavLink } from "@/components/layout/mobile-menu";
import { NAV_MENUS } from "@/components/layout/nav-data";
import { NavMenu } from "@/components/layout/nav-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { HeaderSearchForm } from "@/components/search/header-search-form";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/icons";
import { avatarUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

type HeaderUser = {
  id: string;
  displayName: string;
  avatarPath: string | null;
  unread: number;
};

type SiteHeaderShellProps = {
  configured: boolean;
  user: HeaderUser | null;
};

const navLinkClasses =
  "rounded-full px-2 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand xl:px-3";

const iconButtonClasses =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function SiteHeaderShell({ configured, user }: SiteHeaderShellProps) {
  const pathname = usePathname();
  const startsCondensed =
    pathname === "/explore" ||
    pathname.startsWith("/designers") ||
    pathname === "/services";
  const [condensed, setCondensed] = useState(startsCondensed);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      const target =
        document.getElementById("home-search-bar") ??
        document.getElementById("home-search-section");
      const forceCondensed = startsCondensed;
      const next =
        forceCondensed ||
        (target ? target.getBoundingClientRect().bottom <= 64 : window.scrollY > 12);

      setCondensed(next);

      if (!next) {
        setMobileSearchOpen(false);
      }
    }

    function schedule() {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [pathname, startsCondensed]);

  useEffect(() => {
    if (!mobileSearchOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileSearchOpen(false);
        searchButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileSearchOpen]);

  const mobileLinks: MobileNavLink[] = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/shots/new", label: "New shot" },
        { href: "/settings", label: "Settings" },
      ]
    : [{ href: "/sign-up", label: "Sign up" }];

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

        <div
          aria-hidden={!condensed}
          inert={!condensed}
          className={cn(
            "hidden min-w-0 items-center overflow-hidden transition-[max-width,opacity] duration-300 ease-out motion-reduce:transition-none lg:flex",
            condensed
              ? "max-w-64 flex-1 opacity-100 xl:max-w-md"
              : "pointer-events-none max-w-0 opacity-0",
          )}
        >
          <HeaderSearchForm className="w-full" />
        </div>

        <nav
          aria-label="Primary"
          className={cn("hidden items-center gap-1 lg:flex", !condensed && "ml-1")}
        >
          {NAV_MENUS.map((group) => (
            <NavMenu key={group.id} group={group} triggerClassName={navLinkClasses} />
          ))}
          {user ? (
            <Link href="/dashboard" className={navLinkClasses}>
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!configured ? (
            <span className="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 sm:inline">
              Supabase not configured
            </span>
          ) : null}

          {user ? (
            <>
              <Link
                href="/shots/new"
                className={buttonClasses("primary", "sm", "max-xl:hidden")}
              >
                New shot
              </Link>
              <NotificationBell
                key={user.unread}
                userId={user.id}
                initialUnread={user.unread}
              />
              <Link
                href="/settings"
                className="hidden items-center gap-2 rounded-full p-1 pr-3 hover:bg-surface lg:flex"
              >
                <Avatar
                  src={avatarUrl(user.avatarPath)}
                  name={user.displayName}
                  size={32}
                />
                <span className="hidden max-w-32 truncate text-sm font-medium xl:block">
                  {user.displayName}
                </span>
              </Link>
              <Link
                href="/settings"
                aria-label="Account settings"
                className="rounded-full lg:hidden"
              >
                <Avatar
                  src={avatarUrl(user.avatarPath)}
                  name={user.displayName}
                  size={32}
                />
              </Link>
              <form action={signOut} className="hidden xl:block">
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

          {condensed ? (
            <button
              ref={searchButtonRef}
              type="button"
              aria-expanded={mobileSearchOpen}
              aria-controls="mobile-header-search"
              aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              onClick={() => setMobileSearchOpen((value) => !value)}
              className={cn(iconButtonClasses, "lg:hidden")}
            >
              <SearchIcon />
            </button>
          ) : null}

          <MobileMenu
            links={mobileLinks}
            signedIn={Boolean(user)}
            onOpen={() => setMobileSearchOpen(false)}
          />
        </div>
      </div>

      {condensed && mobileSearchOpen ? (
        <div id="mobile-header-search" className="border-t border-border lg:hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-2">
            <HeaderSearchForm autoFocus onSubmit={() => setMobileSearchOpen(false)} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
