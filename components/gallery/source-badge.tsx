import { CameraIcon, GlobeIcon, LayersIcon } from "@/components/ui/icons";
import type { GallerySource } from "@/lib/gallery/types";

const PROVIDER_LINKS: { source: GallerySource; label: string; href: string }[] = [
  { source: "pexels", label: "Pexels", href: "https://www.pexels.com" },
  { source: "unsplash", label: "Unsplash", href: "https://unsplash.com" },
  { source: "openverse", label: "Openverse", href: "https://openverse.org" },
  { source: "pixabay", label: "Pixabay", href: "https://pixabay.com" },
];

export function SourceIcon({ source }: { source: GallerySource }) {
  if (source === "openverse") {
    return <GlobeIcon />;
  }

  if (source === "pixabay") {
    return <LayersIcon />;
  }

  return <CameraIcon />;
}

export function sourceLabel(source: GallerySource) {
  return source === "openverse"
    ? "Openverse"
    : `Photo: ${source[0].toUpperCase()}${source.slice(1)}`;
}

/** Short license form for card badges, e.g. "CC BY-NC-ND 2.0" -> "CC BY-NC-ND". */
export function shortLicense(license: string | null): string | null {
  if (!license) {
    return null;
  }

  return license.replace(/\s*v?\d+(\.\d+)*$/i, "").trim();
}

export function SourceBadge({
  source,
  license,
}: {
  source: GallerySource;
  license?: string | null;
}) {
  const short = shortLicense(license ?? null);

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-foreground backdrop-blur">
      <SourceIcon source={source} />
      <span className="truncate">
        {source === "openverse"
          ? short
            ? `Openverse · ${short}`
            : "Openverse"
          : sourceLabel(source)}
      </span>
    </span>
  );
}

export function ProviderCredits() {
  return (
    <p className="text-xs leading-5 text-muted">
      Imagery is provided by{" "}
      {PROVIDER_LINKS.map((provider, index) => (
        <span key={provider.source}>
          <a
            href={provider.href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-2 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {provider.label}
          </a>
          {index < PROVIDER_LINKS.length - 1 ? ", " : ""}
        </span>
      ))}
      . Each card links to its original source and shows that provider&rsquo;s
      attribution. Saved designs are bookmarks to the original image; no copyright is
      transferred.
    </p>
  );
}

export function OpenverseDisclaimer() {
  return (
    <p className="rounded-xl border border-dashed border-border bg-white px-3 py-2 text-[11px] leading-5 text-muted">
      Openverse does not verify every image&rsquo;s licensing information. License labels
      and creator names are passed through from Openverse as-is, and each card links to
      the original source page. Check the source before reuse.
    </p>
  );
}
