import Link from "next/link";

import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    label: "Web Design",
    href: "/explore?category=web-design",
    tint: "from-sky-100 via-sky-50 to-white",
  },
  {
    label: "Mobile",
    href: "/explore?category=mobile",
    tint: "from-rose-100 via-rose-50 to-white",
  },
  {
    label: "Typography",
    href: "/explore?category=typography",
    tint: "from-amber-100 via-amber-50 to-white",
  },
  {
    label: "Print",
    href: "/explore?category=print",
    tint: "from-emerald-100 via-emerald-50 to-white",
  },
  {
    label: "Animation",
    href: "/explore?category=animation",
    tint: "from-violet-100 via-violet-50 to-white",
  },
  {
    label: "Illustration",
    href: "/explore?category=illustration",
    tint: "from-orange-100 via-orange-50 to-white",
  },
  {
    label: "Product Design",
    href: "/explore?category=product-design",
    tint: "from-cyan-100 via-cyan-50 to-white",
  },
  {
    label: "Branding",
    href: "/explore?category=branding",
    tint: "from-fuchsia-100 via-fuchsia-50 to-white",
  },
  {
    label: "Web Development",
    href: "/search?q=web%20development",
    tint: "from-lime-100 via-lime-50 to-white",
  },
];

function MarqueeGroup({ copy = false }: { copy?: boolean }) {
  return (
    <ul
      aria-hidden={copy || undefined}
      inert={copy || undefined}
      className={cn("flex shrink-0 gap-4 pr-4", copy && "marquee-copy")}
    >
      {CATEGORIES.map((category) => (
        <li
          key={`${copy ? "copy" : "main"}-${category.label}`}
          className="w-36 shrink-0 sm:w-44"
        >
          <Link
            href={category.href}
            className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl border border-border transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg motion-reduce:transition-none">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none",
                  category.tint,
                )}
              />
              <span
                aria-hidden="true"
                className="absolute -right-6 -bottom-8 h-24 w-24 rounded-full bg-white/50"
              />
            </span>
            <span className="mt-2 block truncate text-xs font-medium text-muted group-hover:text-foreground">
              {category.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CategoryMarquee() {
  return (
    <section aria-labelledby="categories-heading" className="mt-14 pb-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id="categories-heading" className="text-lg font-semibold tracking-tight">
          Browse by category
        </h2>
        <Link
          href="/search"
          className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          View all
        </Link>
      </div>

      <div className="marquee -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="marquee-track">
          <MarqueeGroup />
          <MarqueeGroup copy />
        </div>
      </div>
    </section>
  );
}
