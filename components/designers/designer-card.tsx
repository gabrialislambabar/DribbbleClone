"use client";

import Link from "next/link";

import { BadgeCheckIcon, ClockIcon, MapPinIcon, StarIcon } from "@/components/ui/icons";
import type { Designer } from "@/lib/designers/types";
import { cn } from "@/lib/utils";

type DesignerCardProps = {
  designer: Designer;
  onContact: (designer: Designer) => void;
};

function budgetLabel(value: number): string {
  return `From $${value.toLocaleString("en-US")}`;
}

export function DesignerCard({ designer, onContact }: DesignerCardProps) {
  const href = `/designers/${designer.slug}`;
  const visibleServices = designer.services.slice(0, 2);
  const visibleSkills = designer.skills.slice(0, 3);

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-border bg-white p-5 transition-shadow focus-within:shadow-lg hover:shadow-lg">
      <div className="flex items-start gap-3">
        <Link
          href={href}
          aria-label={`View ${designer.name}`}
          className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-foreground/70",
              designer.avatar.tint,
            )}
            aria-hidden="true"
          >
            {designer.avatar.initials}
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={href}
              className="truncate text-sm font-semibold text-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {designer.name}
            </Link>
            {designer.isPro ? (
              <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                PRO
              </span>
            ) : null}
            {designer.availableForWork ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <BadgeCheckIcon className="h-3 w-3" />
                Available
              </span>
            ) : null}
          </div>

          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
            {designer.tagline}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <StarIcon className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-medium text-foreground">
                {designer.rating.toFixed(1)}
              </span>
              <span>({designer.reviewCount})</span>
            </span>
            <span>{designer.completedProjects} projects</span>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="min-w-0">
          <dt className="text-muted">Starting budget</dt>
          <dd className="mt-0.5 truncate font-medium text-foreground">
            {budgetLabel(designer.startingBudget)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted">Location</dt>
          <dd className="mt-0.5 flex items-center gap-1 truncate font-medium text-foreground">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
            <span className="truncate">{designer.location}</span>
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 text-foreground">
          <ClockIcon className="h-3.5 w-3.5" />
          {designer.responseTime}
        </span>
        {designer.type === "agency" ? (
          <span className="rounded-full bg-surface px-2 py-1 text-foreground">
            Agency
          </span>
        ) : null}
      </div>

      {visibleServices.length > 0 ? (
        <ul className="mt-4 space-y-1.5 border-t border-border pt-4">
          {visibleServices.map((service) => (
            <li
              key={service.id}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="min-w-0 truncate text-foreground">{service.name}</span>
              <span className="shrink-0 text-muted">
                ${service.startingPrice.toLocaleString("en-US")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {visibleSkills.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {visibleSkills.map((skill) => (
            <li
              key={skill}
              className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted"
            >
              {skill}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onContact(designer)}
          className="inline-flex min-h-9 items-center justify-center rounded-full bg-foreground px-4 text-xs font-semibold text-white transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Get in touch
        </button>
        <Link
          href={href}
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          View profile
        </Link>
      </div>
    </article>
  );
}
