"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { signOut } from "@/app/(auth)/actions";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";

export type MobileNavLink = {
  href: string;
  label: string;
};

type MobileMenuProps = {
  links: MobileNavLink[];
  signedIn: boolean;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function MobileMenu({ links, signedIn }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

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
    firstLinkRef.current?.focus();

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
        onClick={() => setOpen((value) => !value)}
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
                    {links.map((link, index) => (
                      <li key={`${link.href}-${link.label}`}>
                        <Link
                          ref={index === 0 ? firstLinkRef : undefined}
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
                </nav>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
