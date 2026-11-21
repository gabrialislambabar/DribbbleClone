export type GallerySource = "pexels" | "unsplash" | "openverse" | "pixabay";

export type GallerySort = "featured" | "source" | "title";

export type GalleryOrientation = "any" | "landscape" | "portrait" | "square";

/**
 * A normalized gallery item. Every provider response is mapped to this shape so
 * the card, save action, and URL state stay provider-agnostic.
 *
 * Images are hotlinked from the provider's CDN; nothing is rehosted here.
 */
export type GalleryItem = {
  /** Composite key: `${source}:${sourceItemId}`. Safe in URLs and DB rows. */
  id: string;
  source: GallerySource;
  sourceItemId: string;
  title: string;
  /** Project category slug, not a claim about the image's content. */
  category: string;
  imageUrl: string;
  thumbnailUrl: string;
  width: number | null;
  height: number | null;
  sourceUrl: string;
  creatorName: string | null;
  creatorUrl: string | null;
  licenseName: string | null;
  licenseUrl: string | null;
  /** Human-readable attribution shown on the card. */
  attribution: string;
  /** Average color, used as a loading placeholder background. */
  dominantColor: string | null;
};

export type GalleryCategory = {
  slug: string;
  label: string;
  /** Distinct search terms so a category does not repeat the same images. */
  terms: string[];
  tint: string;
};

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  {
    slug: "product-design",
    label: "Product design",
    terms: [
      "product design workspace",
      "ui design desk",
      "app prototype",
      "design sprint",
      "wireframe sketch",
      "product team meeting",
    ],
    tint: "from-cyan-100 via-cyan-50 to-white",
  },
  {
    slug: "web-design",
    label: "Web design",
    terms: [
      "web design desk",
      "website layout",
      "laptop design mockup",
      "responsive website",
      "browser interface",
      "designer laptop",
    ],
    tint: "from-sky-100 via-sky-50 to-white",
  },
  {
    slug: "mobile-design",
    label: "Mobile design",
    terms: [
      "smartphone mockup",
      "mobile app hands",
      "phone photography",
      "mobile interface",
      "tablet design",
      "device flat lay",
    ],
    tint: "from-rose-100 via-rose-50 to-white",
  },
  {
    slug: "branding",
    label: "Branding",
    terms: [
      "brand identity",
      "stationery mockup",
      "business cards",
      "packaging design",
      "logo sketch",
      "brand guidelines",
    ],
    tint: "from-fuchsia-100 via-fuchsia-50 to-white",
  },
  {
    slug: "illustration",
    label: "Illustration",
    terms: [
      "digital illustration",
      "illustrated poster",
      "editorial illustration",
      "hand drawn art",
      "colorful artwork",
      "sketchbook drawing",
    ],
    tint: "from-orange-100 via-orange-50 to-white",
  },
  {
    slug: "animation",
    label: "Animation & motion",
    terms: [
      "motion design",
      "animation studio",
      "stop motion",
      "light trails",
      "motion blur",
      "animation workspace",
    ],
    tint: "from-violet-100 via-violet-50 to-white",
  },
  {
    slug: "typography",
    label: "Typography",
    terms: [
      "typography poster",
      "letterpress",
      "neon sign letters",
      "font specimen",
      "type print",
      "signage letters",
    ],
    tint: "from-amber-100 via-amber-50 to-white",
  },
  {
    slug: "print",
    label: "Print",
    terms: [
      "print design",
      "magazine spread",
      "poster print",
      "risograph print",
      "book layout",
      "paper texture",
    ],
    tint: "from-emerald-100 via-emerald-50 to-white",
  },
  {
    slug: "icons",
    label: "Icons",
    terms: [
      "line icon set",
      "pictogram signage",
      "symbol pattern",
      "glyph design",
      "wayfinding icons",
      "minimal symbols",
    ],
    tint: "from-slate-100 via-slate-50 to-white",
  },
  {
    slug: "3d-art",
    label: "3D & digital art",
    terms: [
      "3d render",
      "digital art neon",
      "abstract 3d",
      "generative art",
      "cgi render",
      "digital sculpture",
    ],
    tint: "from-indigo-100 via-indigo-50 to-white",
  },
];

export const GALLERY_SORTS: { value: GallerySort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "source", label: "By source" },
  { value: "title", label: "Title A–Z" },
];

export const GALLERY_ORIENTATIONS: {
  value: GalleryOrientation;
  label: string;
}[] = [
  { value: "any", label: "Any shape" },
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
  { value: "square", label: "Square" },
];

export const GALLERY_SOURCE_LABELS: Record<GallerySource, string> = {
  pexels: "Photo: Pexels",
  unsplash: "Photo: Unsplash",
  openverse: "Openverse",
  pixabay: "Photo: Pixabay",
};

export type GalleryFilters = {
  query: string;
  category: string;
  sort: GallerySort;
  orientation: GalleryOrientation;
  sources: GallerySource[];
  page: number;
};

export type GalleryProviderResult = {
  source: GallerySource;
  items: GalleryItem[];
  /** Present when the provider failed or is not configured. */
  error: string | null;
  /** Distinguishes "no matches" from "no key". */
  configured: boolean;
};

export const GALLERY_PAGE_SIZE = 24;

export function isGallerySource(value: string): value is GallerySource {
  return (
    value === "pexels" ||
    value === "unsplash" ||
    value === "openverse" ||
    value === "pixabay"
  );
}

export function galleryItemKey(source: GallerySource, sourceItemId: string) {
  return `${source}:${sourceItemId}`;
}
