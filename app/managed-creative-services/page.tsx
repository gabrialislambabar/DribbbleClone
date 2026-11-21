import type { Metadata } from "next";

import {
  BookCallButton,
  BookingProvider,
  RequestCallForm,
} from "@/components/managed/booking";
import { ComparisonTable } from "@/components/managed/comparison-table";
import { FaqAccordion } from "@/components/managed/faq-accordion";
import { ProjectShowcase } from "@/components/managed/project-showcase";
import { RibbonBand } from "@/components/managed/ribbon-band";
import {
  CalendarVisual,
  RosterVisual,
  ShortlistVisual,
  TrackerVisual,
} from "@/components/managed/visuals";
import { ArrowDownIcon } from "@/components/ui/icons";
import {
  MANAGED_BENEFITS,
  MANAGED_FAQS,
  MANAGED_FOOTNOTES,
  MANAGED_METRICS,
  MANAGED_SECTION_LINKS,
  MANAGED_SERVICES,
  MANAGED_STEPS,
} from "@/lib/managed/content";

export const metadata: Metadata = {
  title: "Managed creative services",
  description:
    "Pick the designers, and a managed team runs the work. Illustrative clone page for a managed creative service.",
};

const STEP_VISUALS = {
  roster: RosterVisual,
  shortlist: ShortlistVisual,
  tracker: TrackerVisual,
  calendar: CalendarVisual,
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
      {children}
    </p>
  );
}

export default function ManagedCreativeServicesPage() {
  return (
    <BookingProvider>
      <div className="relative isolate overflow-x-clip">
        {/* A. Hero */}
        <section className="relative mx-auto w-full max-w-6xl px-4 pt-12 sm:pt-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-64 max-w-4xl opacity-40 blur-2xl"
          >
            <div className="h-full w-full rounded-[50%] bg-gradient-to-r from-pink-200/70 via-rose-100 to-indigo-200/70" />
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Managed creative services</Eyebrow>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              You pick the designers.
              <span className="block">We run the work.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-muted sm:text-base">
              Your brand chooses the designer or design team from a wide roster, while a
              managed team coordinates briefs, deadlines, and admin from first concept to
              final files. Illustrative page for this clone.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <BookCallButton />
              <a
                href="#how-it-works"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                See how it works
                <ArrowDownIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <ProjectShowcase />
        </section>

        {/* B. Metrics */}
        <section
          aria-label="The numbers behind Studio"
          className="relative mx-auto mt-16 w-full max-w-6xl px-4"
        >
          <div className="rounded-3xl border border-border bg-white/80 p-6 sm:p-8">
            <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {MANAGED_METRICS.map((metric) => (
                <div key={metric.value} className="min-w-0">
                  <dt className="sr-only">{metric.label}</dt>
                  <dd>
                    <span className="block text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      {metric.value}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">
                      {metric.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* C. Why this service */}
        <section
          id="why-managed"
          className="relative mx-auto mt-20 w-full max-w-6xl scroll-mt-24 px-4 sm:mt-24"
        >
          <RibbonBand variant="middle" className="top-0 -z-10 h-64 opacity-60" />

          <div className="max-w-2xl">
            <Eyebrow>Why Studio</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              100K+ designers and design teams.
              <span className="block">One managed team for your brand.</span>
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              The community is where designers show their best work. Studio turns that
              community into a creative team for your brand: matched to your brand
              guidelines and run from brief to final files.
            </p>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MANAGED_BENEFITS.map((benefit, index) => (
              <li
                key={benefit.title}
                className="flex min-w-0 flex-col rounded-2xl border border-border bg-white p-5"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-muted">
                  {benefit.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* D. How it works */}
        <section
          id="how-it-works"
          className="relative mx-auto mt-20 w-full max-w-6xl scroll-mt-24 px-4 sm:mt-24"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                From brief to final files
                <span className="block">without the hiring</span>
              </h2>
            </div>
            <BookCallButton variant="outline" />
          </div>

          <ol className="mt-10 space-y-10">
            {MANAGED_STEPS.map((step, index) => {
              const Visual = STEP_VISUALS[step.visual];
              const flipped = index % 2 === 1;

              return (
                <li
                  key={step.title}
                  className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12"
                >
                  <div
                    className={flipped ? "min-w-0 lg:order-2 lg:pl-4" : "min-w-0 lg:pr-4"}
                  >
                    <span className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
                      {step.step}
                    </span>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                      {step.description}
                    </p>
                  </div>

                  <div className={flipped ? "min-w-0 lg:order-1" : "min-w-0"}>
                    <Visual />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* E. Campaign services */}
        <section
          id="what-we-design"
          className="relative mx-auto mt-20 w-full max-w-6xl scroll-mt-24 px-4 sm:mt-24"
        >
          <Eyebrow>What we design</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything your campaign calendar needs
          </h2>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
            <div className="relative min-w-0 overflow-hidden rounded-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/designers/hello-lab/orbit.png"
                alt="Placeholder campaign portfolio cover: blue gradient card titled Atlas. Replace with real campaign work."
                className="h-64 w-full object-cover sm:h-80 lg:h-96"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/25 to-transparent p-5 pt-16">
                <p className="text-sm font-semibold text-white">Full campaign packs</p>
                <p className="mt-1 text-xs text-white/80">
                  Key visuals, fonts, and editable source files for every placement.
                </p>
              </div>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {MANAGED_SERVICES.map((service) => (
                <li
                  key={service.title}
                  className="min-w-0 rounded-2xl border border-border bg-white p-4"
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    {service.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {service.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <BookCallButton variant="outline">Get a campaign quote</BookCallButton>
          </div>
        </section>

        {/* F. Comparison */}
        <section className="relative mx-auto mt-20 w-full max-w-6xl px-4 sm:mt-24">
          <Eyebrow>Compare</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Dribbble Studio vs in-house, agencies and freelancers
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Summary of the reference comparison. This clone does not provide a managed
            service, so treat the row values as illustrative copy.
          </p>

          <div className="mt-8">
            <ComparisonTable />
          </div>
        </section>

        {/* G. FAQ */}
        <section
          id="faq"
          className="relative mx-auto mt-20 w-full max-w-6xl scroll-mt-24 px-4 sm:mt-24"
        >
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div>
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Creative as a service:
                <span className="block">what brand teams ask us</span>
              </h2>

              <div className="mt-6 rounded-2xl border border-border bg-white p-5">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
                  Still have questions?
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  One call covers your calendar, the work you need, and how pricing would
                  work for you.
                </p>
                <div className="mt-4">
                  <BookCallButton />
                </div>
              </div>
            </div>

            <FaqAccordion items={MANAGED_FAQS} />
          </div>
        </section>

        {/* H. Final contact */}
        <section className="relative mt-20 sm:mt-24">
          <RibbonBand variant="bottom" className="bottom-0 -z-10 h-48 opacity-60" />
          <div className="mx-auto w-full max-w-4xl px-4">
            <div className="rounded-3xl bg-foreground px-6 py-10 text-center sm:px-10">
              <Eyebrow>
                <span className="text-white/60">Next step</span>
              </Eyebrow>
              <h2 className="mx-auto mt-4 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Put the right designers on your next campaign.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/70">
                Tell us what you are shipping next quarter. A live version would reply
                within one business day and pick a time together.
              </p>

              <div className="mt-7 flex justify-center">
                <RequestCallForm />
              </div>

              <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/60">
                {MANAGED_FOOTNOTES.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section shortcuts */}
        <nav aria-label="On this page" className="mx-auto mt-12 w-full max-w-6xl px-4">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            {MANAGED_SECTION_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </BookingProvider>
  );
}
