"use client";

import { useId, useState } from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type FaqItem = { question: string; answer: ReactNode };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map((item, index) => {
        const expanded = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <li key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpenIndex(expanded ? null : index)}
                className="flex w-full items-start justify-between gap-4 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="text-sm font-medium text-foreground sm:text-base">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-transform duration-200 motion-reduce:transition-none",
                    expanded && "rotate-180",
                  )}
                >
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
              className="pb-5"
            >
              <p className="max-w-3xl text-sm leading-6 text-muted">{item.answer}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
