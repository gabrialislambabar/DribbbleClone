import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRightIcon, ClockIcon } from "@/components/ui/icons";
import { getDesigners } from "@/lib/designers/data";
import {
  DESIGNER_CATEGORIES,
  type Designer,
  type DesignerService,
} from "@/lib/designers/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Explore services",
  description: "Compare fixed-scope design packages from independent talent.",
};

type ServiceListing = DesignerService & {
  provider: Designer;
};

function getServices(): ServiceListing[] {
  return getDesigners().flatMap((designer) =>
    designer.services.map((service) => ({
      ...service,
      provider: designer,
    })),
  );
}

type ServicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const rawCategory = Array.isArray(params.category)
    ? params.category[0]
    : params.category;
  const activeCategory =
    DESIGNER_CATEGORIES.find((item) => item.slug === rawCategory)?.slug ?? "all";

  const all = getServices();
  const services =
    activeCategory === "all"
      ? all
      : all.filter((service) => service.category === activeCategory);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Explore services
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
          Compare fixed-scope packages from independent designers and studios. See prices
          and delivery estimates up front, then start a conversation.
        </p>
      </header>

      <div className="-mx-4 mt-6 overflow-x-auto px-4">
        <div className="flex min-w-max items-center gap-1 border-b border-border pb-2">
          <Link
            href="/services"
            className={cn(
              "relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              activeCategory === "all"
                ? "text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            All services
            {activeCategory === "all" ? (
              <span className="absolute inset-x-2 -bottom-2 h-0.5 rounded-full bg-foreground" />
            ) : null}
          </Link>
          {DESIGNER_CATEGORIES.map((category) => {
            const active = activeCategory === category.slug;

            return (
              <Link
                key={category.slug}
                href={`/services?category=${category.slug}`}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  active ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {category.label}
                {active ? (
                  <span className="absolute inset-x-2 -bottom-2 h-0.5 rounded-full bg-foreground" />
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted">
        <span className="mr-2 rounded-full bg-surface px-2 py-0.5 font-medium text-foreground">
          Demo data
        </span>
        Service packages, prices, and delivery times are sample content.
      </div>

      {services.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No services in this category"
            description="Try another category or browse all service packages."
            action={
              <Link
                href="/services"
                className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-white hover:bg-foreground/90"
              >
                View all services
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <li key={service.id} className="min-w-0">
              <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground">
                      {service.name}
                    </h2>
                    <Link
                      href={`/designers/${service.provider.slug}`}
                      className="mt-1 inline-flex text-xs font-medium text-muted hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      by {service.provider.name}
                    </Link>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface px-2 py-1 text-[11px] font-medium text-foreground">
                    {DESIGNER_CATEGORIES.find((item) => item.slug === service.category)
                      ?.label ?? service.category}
                  </span>
                </div>

                <p className="mt-3 flex-1 text-sm leading-6 text-muted">
                  {service.description}
                </p>

                <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted">Scope</dt>
                    <dd className="max-w-[60%] text-right text-foreground">
                      {service.scope}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted">Delivery</dt>
                    <dd className="inline-flex items-center gap-1 text-foreground">
                      <ClockIcon className="h-3.5 w-3.5 text-muted" />
                      {service.deliveryDays} days
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted">Starting at</dt>
                    <dd className="font-semibold text-foreground">
                      ${service.startingPrice.toLocaleString("en-US")}
                    </dd>
                  </div>
                </dl>

                <Link
                  href={`/designers/${service.provider.slug}`}
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  View profile
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
