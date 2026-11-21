"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { signOut } from "@/app/(auth)/actions";
import {
  COMMUNITY_SOCIALS,
  LEARN_MORE_ICON,
  NAV_MENUS,
} from "@/components/layout/nav-data";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  CloseIcon,
  MenuIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type MobileNavLink = {
  href: string;
  label: string;
};

type MobileMenuProps = {
  links: MobileNavLink[];
  signedIn: boolean;
  onOpen?: () => void;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function MobileMenu({ links, signedIn, onOpen }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstItemRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => {
          if (!open) {
            onOpen?.();
            setOpenGroup(null);
          }

          setOpen((value) => !value);
        }}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-surface ${focusRing}`}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-x-0 top-16 bottom-0 z-50">
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-foreground/20"
              />

              <div
                id={panelId}
                className="relative max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-white shadow-xl"
              >
                <nav
                  aria-label="Mobile primary"
                  className="mx-auto w-full max-w-6xl px-4 py-3"
                >
                  <ul className="space-y-1">
                    {NAV_MENUS.map((group, index) => {
                      const expanded = openGroup === group.id;

                      return (
                        <li key={group.id}>
                          <button
                            ref={index === 0 ? firstItemRef : undefined}
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={`mobile-nav-${group.id}`}
                            onClick={() => setOpenGroup(expanded ? null : group.id)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-base font-medium text-foreground hover:bg-surface ${focusRing}`}
                          >
                            {group.label}
                            <ChevronDownIcon
                              className={cn(
                                "transition-transform duration-200 motion-reduce:transition-none",
                                expanded && "rotate-180",
                              )}
                            />
                          </button>

                          {expanded ? (
                            <div id={`mobile-nav-${group.id}`} className="pb-2">
                              {group.sections
                                .flatMap((section) => section.items)
                                .map((item) => {
                                  const Icon = item.icon;

                                  return (
                                    <Link
                                      key={item.label}
                                      href={item.href}
                                      onClick={() => setOpen(false)}
                                      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 pl-5 hover:bg-surface ${focusRing}`}
                                    >
                                      {Icon ? (
                                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                                      ) : null}
                                      <span className="min-w-0 flex-1">
                                        <span className="flex flex-wrap items-center gap-2">
                                          <span className="text-sm font-medium text-foreground">
                                            {item.label}
                                          </span>
                                          {item.badge ? (
                                            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                                              {item.badge}
                                            </span>
                                          ) : null}
                                        </span>
                                        {item.description ? (
                                          <span className="mt-0.5 block text-xs text-muted">
                                            {item.description}
                                          </span>
                                        ) : null}
                                      </span>
                                    </Link>
                                  );
                                })}

                              {group.asideLinks?.map((link) => (
                                <Link
                                  key={link.label}
                                  href={link.href}
                                  onClick={() => setOpen(false)}
                                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 pl-5 text-sm font-medium text-foreground hover:bg-surface ${focusRing}`}
                                >
                                  {link.label}
                                  <ArrowUpRightIcon className="shrink-0 text-muted" />
                                </Link>
                              ))}

                              {group.learnMore ? (
                                <Link
                                  href={group.learnMore.href}
                                  onClick={() => setOpen(false)}
                                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 pl-5 text-sm text-muted hover:text-foreground ${focusRing}`}
                                >
                                  <LEARN_MORE_ICON />
                                  {group.learnMore.label}
                                </Link>
                              ) : null}

                              {group.socials ? (
                                <div className="mt-2 border-t border-border px-3 pt-3 pl-5">
                                  <p className="text-xs font-medium text-muted">
                                    Follow Us
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    {COMMUNITY_SOCIALS.map(
                                      ({ label, href, icon: Icon }) => (
                                        <a
                                          key={label}
                                          href={href}
                                          aria-label={label}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-foreground/20 hover:text-foreground ${focusRing}`}
                                        >
                                          <Icon />
                                        </a>
                                      ),
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-2 border-t border-border pt-2">
                    <ul className="space-y-1">
                      {links.map((link) => (
                        <li key={`${link.href}-${link.label}`}>
                          <Link
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className={`block rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-surface ${focusRing}`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {signedIn ? (
                      <form action={signOut} className="mt-2 border-t border-border pt-2">
                        <button
                          type="submit"
                          className={`w-full rounded-xl px-3 py-3 text-left text-base font-medium text-muted hover:bg-surface hover:text-foreground ${focusRing}`}
                        >
                          Sign out
                        </button>
                      </form>
                    ) : null}
                  </div>
                </nav>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
