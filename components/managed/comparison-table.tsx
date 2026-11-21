"use client";

import { useState } from "react";

import {
  MANAGED_COMPARISON_OPTIONS,
  MANAGED_COMPARISON_ROWS,
} from "@/lib/managed/content";
import { cn } from "@/lib/utils";

type OptionId = "studio" | "inHouse" | "agency" | "freelance";

const COLUMN_CLASSES: Record<OptionId, string> = {
  studio: "bg-brand/5",
  inHouse: "bg-white",
  agency: "bg-white",
  freelance: "bg-white",
};

export function ComparisonTable() {
  const [active, setActive] = useState<OptionId>("studio");

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Dribbble Studio compared with in-house teams, agencies, and freelancers
          </caption>
          <thead>
            <tr className="border-b border-border bg-surface">
              <th scope="col" className="w-44 px-4 py-3 text-xs font-medium text-muted">
                Compare
              </th>
              {MANAGED_COMPARISON_OPTIONS.map((option) => (
                <th
                  key={option.id}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-semibold",
                    option.id === "studio" ? "text-brand" : "text-muted",
                    option.id === "studio" && COLUMN_CLASSES.studio,
                  )}
                >
                  {option.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MANAGED_COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <th
                  scope="row"
                  className="w-44 px-4 py-4 align-top text-xs font-medium text-muted"
                >
                  {row.label}
                </th>
                <td className="bg-brand/5 px-4 py-4 align-top text-foreground">
                  {row.studio}
                </td>
                <td className="px-4 py-4 align-top text-muted">{row.inHouse}</td>
                <td className="px-4 py-4 align-top text-muted">{row.agency}</td>
                <td className="px-4 py-4 align-top text-muted">{row.freelance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked comparison */}
      <div className="md:hidden">
        <div className="flex flex-wrap gap-2">
          {MANAGED_COMPARISON_OPTIONS.map((option) => {
            const selected = active === option.id;

            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActive(option.id as OptionId)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  selected
                    ? "border-foreground bg-foreground text-white"
                    : "border-border bg-white text-muted hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {MANAGED_COMPARISON_OPTIONS.filter((option) => option.id === active).map(
          (option) => (
            <div
              key={option.id}
              className="mt-4 rounded-2xl border border-border bg-white"
            >
              <p
                className={cn(
                  "rounded-t-2xl px-4 py-3 text-sm font-semibold",
                  option.id === "studio" ? "bg-brand/5 text-brand" : "text-foreground",
                )}
              >
                {option.label}
              </p>
              <dl className="divide-y divide-border">
                {MANAGED_COMPARISON_ROWS.map((row) => (
                  <div key={row.label} className="px-4 py-3">
                    <dt className="text-xs text-muted">{row.label}</dt>
                    <dd className="mt-0.5 text-sm text-foreground">
                      {row[option.id as OptionId]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ),
        )}
      </div>
    </>
  );
}
