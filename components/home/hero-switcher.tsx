"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type HeroMode = "hire" | "work";

type HeroPanelContent = {
  id: string;
  tabId: string;
  title: string;
  accent: string;
  bullets: string[];
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

const MODES: HeroMode[] = ["hire", "work"];

const TABS: Record<HeroMode, string> = {
  hire: "Hire Talent",
  work: "Get Hired",
};

const transition =
  "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none";

export function HeroSwitcher({ signedIn }: { signedIn: boolean }) {
  const [mode, setMode] = useState<HeroMode>("hire");
  const [lastMode, setLastMode] = useState<HeroMode | null>(null);
  const tabRefs = useRef<Record<HeroMode, HTMLButtonElement | null>>({
    hire: null,
    work: null,
  });

  useEffect(() => {
    if (!lastMode) {
      return;
    }

    const timer = window.setTimeout(() => setLastMode(null), 320);
    return () => window.clearTimeout(timer);
  }, [lastMode]);

  function select(next: HeroMode) {
    if (next === mode) {
      return;
    }

    setLastMode(mode);
    setMode(next);
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const next: HeroMode = mode === "hire" ? "work" : "hire";
    select(next);
    tabRefs.current[next]?.focus();
  }

  const panels: Record<HeroMode, HeroPanelContent> = {
    hire: {
      id: "hero-panel-hire",
      tabId: "hero-tab-hire",
      title: "Work with the world's best in",
      accent: "UX/UI design",
      bullets: [
        "Generate a brief and receive proposals for free.",
        "Browse real design work and portfolios.",
        "Hire top-rated freelancers and agencies.",
      ],
      primary: { label: "Start Your Project Brief", href: "/search?tab=designers" },
      secondary: { label: "Browse Designers", href: "/search?tab=designers" },
    },
    work: {
      id: "hero-panel-work",
      tabId: "hero-tab-work",
      title: "Get hired for the work you",
      accent: "do best",
      bullets: [
        "Build a public portfolio from your shots.",
        "Get discovered by teams browsing new work.",
        "Collect feedback and grow your following.",
      ],
      primary: {
        label: "Share Your Work",
        href: signedIn ? "/shots/new" : "/sign-up",
      },
      secondary: { label: "Browse Project Briefs", href: "/search?tab=shots" },
    },
  };

  return (
    <div className="min-w-0">
      <div
        role="tablist"
        aria-label="Hero audience"
        className="relative inline-grid grid-cols-2 rounded-full border border-border bg-surface p-1"
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm",
            transition,
            mode === "work" && "translate-x-full",
          )}
        />
        {MODES.map((key) => {
          const active = mode === key;

          return (
            <button
              key={key}
              ref={(node) => {
                tabRefs.current[key] = node;
              }}
              id={`hero-tab-${key}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`hero-panel-${key}`}
              tabIndex={active ? 0 : -1}
              onClick={() => select(key)}
              onKeyDown={onTabKeyDown}
              className={cn(
                "relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none",
                active ? "text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {TABS[key]}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid">
        {MODES.map((key) => {
          const active = mode === key;
          const exiting = !active && lastMode === key;
          const content = panels[key];

          return (
            <div
              key={key}
              id={content.id}
              role="tabpanel"
              aria-labelledby={content.tabId}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                "col-start-1 row-start-1",
                transition,
                active
                  ? "translate-x-0 opacity-100"
                  : exiting
                    ? "-translate-x-4 opacity-0"
                    : "translate-x-4 opacity-0",
                !active && "pointer-events-none",
              )}
            >
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl xl:text-6xl">
                {content.title} <span className="text-brand">{content.accent}</span>
              </h1>

              <ul className="mt-6 space-y-3 text-sm text-foreground/90 sm:text-base">
                {content.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <CheckIcon />
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={content.primary.href} className={buttonClasses("dark", "md")}>
                  {content.primary.label}
                </Link>
                <Link
                  href={content.secondary.href}
                  className={buttonClasses("secondary", "md")}
                >
                  {content.secondary.label}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
