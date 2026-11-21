"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

import {
  COMMUNITY_SOCIALS,
  LEARN_MORE_ICON,
  type NavGroup,
  type NavItem,
} from "@/components/layout/nav-data";
import { ArrowUpRightIcon, ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type NavMenuProps = {
  group: NavGroup;
  triggerClassName?: string;
};

const itemClasses =
  "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const megaItemClasses =
  "flex items-start gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function MenuLink({
  item,
  mega,
  onNavigate,
}: {
  item: NavItem;
  mega: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={mega ? megaItemClasses : itemClasses}
    >
      {Icon ? (
        <span
          className={cn(
            "shrink-0 text-foreground",
            mega &&
              "flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white",
          )}
        >
          <Icon className={mega ? "h-5 w-5" : "h-4 w-4"} />
        </span>
      ) : null}

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{item.label}</span>
          {item.badge ? (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
              {item.badge}
            </span>
          ) : null}
        </span>
        {item.description ? (
          <span className="mt-0.5 block text-xs leading-5 text-muted">
            {item.description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function SocialRow() {
  return (
    <div className="mt-2 border-t border-border px-3 pt-4 pb-2">
      <p className="text-xs font-medium text-muted">Follow Us</p>
      <div className="mt-2 flex items-center gap-2">
        {COMMUNITY_SOCIALS.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Icon />
          </a>
        ))}
      </div>
    </div>
  );
}

export function NavMenu({ group, triggerClassName }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelWrapperRef = useRef<HTMLDivElement>(null);
  const skipFocusOpen = useRef(false);
  const touchRef = useRef(false);
  const ignoreHoverRef = useRef(false);
  const hoverTimerRef = useRef<number | null>(null);

  const mega = group.variant === "mega";
  const panelWidth =
    group.id === "hire"
      ? 820
      : group.id === "hired"
        ? 700
        : group.variant === "wide"
          ? 400
          : 340;

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  function markTouch() {
    ignoreHoverRef.current = true;

    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
    }

    hoverTimerRef.current = window.setTimeout(() => {
      ignoreHoverRef.current = false;
      hoverTimerRef.current = null;
    }, 600);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        skipFocusOpen.current = true;
        setOpen(false);
        triggerRef.current?.focus();
        window.requestAnimationFrame(() => {
          skipFocusOpen.current = false;
        });
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useIsoLayoutEffect(() => {
    if (!open) {
      return;
    }

    const trigger = triggerRef.current;
    const panelWrapper = panelWrapperRef.current;

    if (!trigger || !panelWrapper) {
      return;
    }

    let frame = 0;

    function update() {
      frame = 0;

      if (!trigger || !panelWrapper) {
        return;
      }

      const width = Math.min(panelWidth, window.innerWidth - 32);
      const rect = trigger.getBoundingClientRect();
      const maxLeft = Math.max(16, window.innerWidth - width - 16);
      const left = Math.min(Math.max(16, rect.left), maxLeft);

      panelWrapper.style.width = `${width}px`;
      panelWrapper.style.left = `${left - rect.left}px`;
    }

    function schedule() {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [open, panelWidth]);

  function onBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      window.requestAnimationFrame(() => {
        panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
      });
    }
  }

  function close() {
    setOpen(false);
  }

  function renderSections(megaItems: boolean) {
    return group.sections.map((section, index) => (
      <div
        key={index}
        className={cn(section.divider && "mt-2 border-t border-border pt-2")}
      >
        {section.items.map((item) => (
          <MenuLink key={item.label} item={item} mega={megaItems} onNavigate={close} />
        ))}
      </div>
    ));
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => {
        if (!ignoreHoverRef.current) {
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (!ignoreHoverRef.current) {
          setOpen(false);
        }
      }}
      onBlur={onBlur}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onTouchStart={() => {
          touchRef.current = true;
          markTouch();
        }}
        onClick={() => {
          if (touchRef.current) {
            touchRef.current = false;
          }

          setOpen((value) => !value);
        }}
        onFocus={(event) => {
          if (!skipFocusOpen.current && event.currentTarget.matches(":focus-visible")) {
            setOpen(true);
          }
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          triggerClassName,
          "inline-flex items-center gap-1",
          open && "bg-surface text-foreground",
        )}
      >
        {group.label}
        <ChevronDownIcon
          className={cn(
            "transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          ref={panelWrapperRef}
          className="absolute top-full z-30 pt-3.5"
          style={{ left: 0, width: 0 }}
        >
          <div
            ref={panelRef}
            id={panelId}
            className={cn(
              "dropdown-panel max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-border bg-white shadow-xl",
              !mega && "p-2",
            )}
          >
            {mega ? (
              <div className="grid gap-6 p-5 lg:grid-cols-[1.6fr_1fr]">
                <div>{renderSections(true)}</div>

                <div className="border-t border-border pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                  {group.asideLinks ? (
                    <ul className="space-y-1">
                      {group.asideLinks.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            onClick={close}
                            className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 text-sm font-medium text-foreground transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                          >
                            {link.label}
                            <ArrowUpRightIcon className="shrink-0" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {group.learnMore ? (
                    <div className="mt-5 border-t border-border pt-4">
                      <Link
                        href={group.learnMore.href}
                        onClick={close}
                        className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        <LEARN_MORE_ICON />
                        {group.learnMore.label}
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                {renderSections(false)}
                {group.socials ? <SocialRow /> : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
