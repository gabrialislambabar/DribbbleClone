"use client";

import Link from "next/link";
import { useState } from "react";

import { ContactDesignerDialog } from "@/components/designers/contact-designer-dialog";
import { PortfolioGrid } from "@/components/designers/portfolio-grid";
import { ProfileTabs } from "@/components/designers/profile-tabs";
import { ServiceCard } from "@/components/designers/service-card";
import {
  BadgeCheckIcon,
  ClockIcon,
  GlobeIcon,
  MapPinIcon,
  QuoteIcon,
  StarIcon,
} from "@/components/ui/icons";
import { ARTWORK_GRADIENTS } from "@/lib/designers/data";
import { DESIGNER_CATEGORIES, type Designer } from "@/lib/designers/types";
import { cn } from "@/lib/utils";

type DesignerProfileProps = {
  designer: Designer;
};

function formatFollowers(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

function categoryLabel(slug: Designer["categories"][number]): string {
  return DESIGNER_CATEGORIES.find((item) => item.slug === slug)?.label ?? slug;
}

function EmptyTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}

function ReviewsPanel({ designer }: { designer: Designer }) {
  if (designer.reviews.length === 0) {
    return (
      <EmptyTab
        title="No reviews yet"
        description="This demo profile has no review data. Reviews will appear here once projects are completed."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-4xl font-semibold text-foreground">
          {designer.rating.toFixed(1)}
        </p>
        <div className="mt-2 flex items-center gap-1" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <StarIcon
              key={index}
              className={cn(
                "h-4 w-4",
                index < Math.round(designer.rating) ? "text-amber-500" : "text-border",
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">Based on {designer.reviewCount} reviews</p>
        <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-xs text-muted">
          Demo data. Ratings and reviews are illustrative and not verified.
        </p>
      </div>

      <ul className="space-y-4">
        {designer.reviews.map((review) => (
          <li key={review.id} className="rounded-2xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{review.author}</p>
                <p className="text-xs text-muted">{review.project}</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon
                    key={index}
                    className={cn(
                      "h-3.5 w-3.5",
                      index < review.rating ? "" : "text-border",
                    )}
                  />
                ))}
              </div>
            </div>
            <blockquote className="mt-3 flex gap-2 text-sm leading-6 text-muted">
              <QuoteIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-border" />
              <span>{review.body}</span>
            </blockquote>
            <time dateTime={review.date} className="mt-3 block text-xs text-muted">
              {new Date(review.date).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DesignerProfile({ designer }: DesignerProfileProps) {
  const [contactOpen, setContactOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(designer.followers);

  function toggleFollow() {
    setFollowing((current) => !current);
    setFollowers((current) => current + (following ? -1 : 1));
  }

  const workTab = <PortfolioGrid shots={designer.shots} gradients={ARTWORK_GRADIENTS} />;

  const servicesTab =
    designer.services.length > 0 ? (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {designer.services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onContact={() => setContactOpen(true)}
          />
        ))}
      </div>
    ) : (
      <EmptyTab
        title="No services published"
        description="This profile has not listed pre-packaged services yet."
      />
    );

  const reviewsTab = <ReviewsPanel designer={designer} />;

  const collectionsTab = (
    <EmptyTab
      title="No collections yet"
      description="Collections group saved projects. This demo profile has not published any."
    />
  );

  const likedTab = (
    <EmptyTab
      title="No liked shots"
      description="Shots this profile liked are private space. Nothing has been shared here yet."
    />
  );

  const membersTab = (
    <EmptyTab
      title="Team details are private"
      description="This demo profile does not publish member information."
    />
  );

  const aboutTab = (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-2xl border border-border bg-white p-5">
        <h3 className="text-sm font-semibold text-foreground">About</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{designer.bio}</p>

        <h3 className="mt-5 text-sm font-semibold text-foreground">Skills</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {designer.skills.map((skill) => (
            <li
              key={skill}
              className="rounded-full border border-border px-3 py-1 text-xs text-foreground"
            >
              {skill}
            </li>
          ))}
        </ul>

        <h3 className="mt-5 text-sm font-semibold text-foreground">Categories</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {designer.categories.map((category) => (
            <li key={category}>
              <Link
                href={`/designers?category=${category}`}
                className="rounded-full bg-surface px-3 py-1 text-xs text-foreground hover:bg-surface/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {categoryLabel(category)}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <dl className="rounded-2xl border border-border bg-white p-5 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted">Location</dt>
          <dd className="text-right text-foreground">{designer.location}</dd>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <dt className="text-muted">Website</dt>
          <dd className="max-w-[60%] truncate text-right">
            {designer.website ? (
              <a
                href={designer.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-foreground underline underline-offset-4 hover:text-brand"
              >
                <GlobeIcon className="h-3.5 w-3.5" />
                Visit site
              </a>
            ) : (
              <span className="text-muted">Not listed</span>
            )}
          </dd>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <dt className="text-muted">Response time</dt>
          <dd className="max-w-[60%] text-right text-foreground">
            {designer.responseTime}
          </dd>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <dt className="text-muted">Availability</dt>
          <dd className="text-right">
            {designer.availableForWork ? (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <BadgeCheckIcon className="h-3.5 w-3.5" />
                Available
              </span>
            ) : (
              <span className="text-muted">Booked</span>
            )}
          </dd>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <dt className="text-muted">Starting budget</dt>
          <dd className="text-right text-foreground">
            ${designer.startingBudget.toLocaleString("en-US")}
          </dd>
        </div>
      </dl>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12">
      <header className="border-b border-border py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className={cn(
                "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-semibold text-foreground/70 sm:h-24 sm:w-24",
                designer.avatar.tint,
              )}
              aria-hidden="true"
            >
              {designer.avatar.initials}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {designer.name}
                </h1>
                {designer.isPro ? (
                  <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                    PRO
                  </span>
                ) : null}
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
                  Demo
                </span>
                {designer.availableForWork ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    <BadgeCheckIcon className="h-3.5 w-3.5" />
                    Available for work
                  </span>
                ) : null}
              </div>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                {designer.tagline}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <StarIcon className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium text-foreground">
                    {designer.rating.toFixed(1)}
                  </span>
                  <span>({designer.reviewCount} reviews)</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {designer.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {designer.responseTime}
                </span>
                <span>{designer.completedProjects} projects completed</span>
              </div>

              <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                <div className="flex items-center gap-1">
                  <dt className="sr-only">Followers</dt>
                  <dd>
                    <span className="font-medium text-foreground">
                      {formatFollowers(followers)}
                    </span>{" "}
                    followers
                  </dd>
                </div>
                <div className="flex items-center gap-1">
                  <dt className="sr-only">Likes</dt>
                  <dd>
                    <span className="font-medium text-foreground">
                      {formatFollowers(designer.likes)}
                    </span>{" "}
                    likes
                  </dd>
                </div>
                <div className="flex items-center gap-1">
                  <dt className="sr-only">Following</dt>
                  <dd>
                    <span className="font-medium text-foreground">
                      {designer.following}
                    </span>{" "}
                    following
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-white transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Get in touch
            </button>
            <button
              type="button"
              aria-pressed={following}
              onClick={toggleFollow}
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                following
                  ? "border-foreground bg-surface text-foreground"
                  : "border-border bg-white text-foreground hover:border-foreground/25",
              )}
            >
              {following ? "Following" : "Follow"}
            </button>
            {designer.website ? (
              <a
                href={designer.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <GlobeIcon className="h-4 w-4" />
                Website
              </a>
            ) : null}
            <span className="hidden text-xs text-muted sm:inline">
              Demo profile — sample values
            </span>
          </div>
        </div>
      </header>

      <div className="pt-2">
        <ProfileTabs
          initialTab="work"
          tabs={[
            { id: "work", label: "Work", content: workTab, count: designer.shots.length },
            {
              id: "services",
              label: "Services",
              content: servicesTab,
              count: designer.services.length,
            },
            {
              id: "reviews",
              label: "Reviews",
              content: reviewsTab,
              count: designer.reviewCount,
            },
            { id: "collections", label: "Collections", content: collectionsTab },
            { id: "liked", label: "Liked Shots", content: likedTab },
            { id: "members", label: "Members", content: membersTab },
            { id: "about", label: "About", content: aboutTab },
          ]}
        />
      </div>

      <ContactDesignerDialog
        designer={designer}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
