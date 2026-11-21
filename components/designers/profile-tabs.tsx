"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ProfileTab = {
  id: string;
  label: string;
  content: ReactNode;
  count?: number;
};

type ProfileTabsProps = {
  tabs: ProfileTab[];
  initialTab?: string;
};

export function ProfileTabs({ tabs, initialTab }: ProfileTabsProps) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const firstTabId = tabs[0]?.id;
  const initial = tabs.find((tab) => tab.id === initialTab)?.id ?? firstTabId ?? "";

  function tabId(id: string) {
    return `${baseId}-tab-${id}`;
  }

  function panelId(id: string) {
    return `${baseId}-panel-${id}`;
  }

  const [active, setActive] = useState(initial);

  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace("#", "");

      if (tabs.some((tab) => tab.id === hash)) {
        setActive(hash);
      }
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [tabs]);

  function select(id: string) {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === active);

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + delta + tabs.length) % tabs.length;
      const next = tabs[nextIndex];

      select(next.id);
      listRef.current
        ?.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)
        ?.focus();
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const next = event.key === "Home" ? tabs[0] : tabs[tabs.length - 1];

      select(next.id);
      listRef.current
        ?.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)
        ?.focus();
    }
  }

  const activeTab = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4">
        <div
          ref={listRef}
          role="tablist"
          aria-label="Profile sections"
          onKeyDown={onKeyDown}
          className="flex min-w-max items-center gap-1 border-b border-border"
        >
          {tabs.map((tab) => {
            const selected = tab.id === activeTab?.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                data-tab={tab.id}
                id={tabId(tab.id)}
                aria-selected={selected}
                aria-controls={panelId(tab.id)}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(tab.id)}
                className={cn(
                  "relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  selected ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {tab.label}
                {typeof tab.count === "number" && tab.count > 0 ? (
                  <span className="rounded-full bg-surface px-1.5 text-[11px] text-muted">
                    {tab.count}
                  </span>
                ) : null}
                {selected ? (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-foreground" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab ? (
        <div
          key={activeTab.id}
          role="tabpanel"
          id={panelId(activeTab.id)}
          aria-labelledby={tabId(activeTab.id)}
          tabIndex={0}
          className="mt-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          {activeTab.content}
        </div>
      ) : null}
    </div>
  );
}
