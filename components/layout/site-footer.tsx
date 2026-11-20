import Link from "next/link";

import { FacebookIcon, InstagramIcon, PinterestIcon, XIcon } from "@/components/ui/icons";

const PRIMARY_LINKS = [
  { href: "/search?tab=designers", label: "For designers" },
  { href: "/search?tab=designers", label: "Hire talent" },
  { href: "/", label: "Inspiration" },
  { href: "#", label: "Advertising" },
  { href: "#", label: "Blog" },
  { href: "#", label: "About" },
  { href: "#", label: "Support" },
];

const LEGAL_LINKS = [
  { href: "#", label: "Terms" },
  { href: "#", label: "Privacy" },
  { href: "#", label: "Cookies" },
];

const SECONDARY_LINKS = [
  { href: "#", label: "Jobs" },
  { href: "/search?tab=shots", label: "Tags" },
  { href: "#", label: "Places" },
  { href: "#", label: "Resources" },
];

const SOCIAL_LINKS = [
  { href: "#", label: "X", Icon: XIcon },
  { href: "#", label: "Facebook", Icon: FacebookIcon },
  { href: "#", label: "Instagram", Icon: InstagramIcon },
  { href: "#", label: "Pinterest", Icon: PinterestIcon },
];

const linkClasses =
  "rounded-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/"
            className="flex shrink-0 items-baseline gap-0.5 text-lg font-bold tracking-tight"
          >
            <span>dribbble</span>
            <span className="text-brand">.</span>
            <span className="text-xs font-medium text-muted">clone</span>
          </Link>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {PRIMARY_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className={linkClasses}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-foreground/20 hover:text-foreground ${linkClasses}`}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-muted">© 2026 DribbbleClone</span>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className={linkClasses}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {SECONDARY_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className={linkClasses}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
