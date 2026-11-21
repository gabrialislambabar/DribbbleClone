import "server-only";

import { logWarn } from "@/lib/observability/logger";
import {
  galleryItemKey,
  type GalleryItem,
  type GalleryOrientation,
  type GalleryProviderResult,
  type GallerySource,
} from "@/lib/gallery/types";

const TIMEOUT_MS = 7000;
const MAX_ITEMS_PER_PROVIDER = 24;

type RawItem = Record<string, unknown>;

function str(value: unknown, max = 500): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().slice(0, max)
    : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isAllowedImageUrl(raw: string | null): string | null {
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function cleanTitle(raw: string | null, fallback: string): string {
  if (!raw) {
    return fallback;
  }

  return raw
    .replace(/\.[a-z]{2,5}$/i, "")
    .replace(/^file:/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function orientationFor(item: {
  width: number | null;
  height: number | null;
}): GalleryOrientation {
  if (!item.width || !item.height) {
    return "any";
  }

  const ratio = item.width / item.height;

  if (ratio > 1.2) return "landscape";
  if (ratio < 0.85) return "portrait";
  return "square";
}

export function matchesOrientation(
  item: GalleryItem,
  orientation: GalleryOrientation,
): boolean {
  return orientation === "any" || orientationFor(item) === orientation;
}

function failure(
  source: GallerySource,
  error: string,
  configured = true,
): GalleryProviderResult {
  return { source, items: [], error, configured };
}

async function fetchJson(url: string, init: RequestInit): Promise<RawItem | null> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`upstream ${response.status}`);
  }

  return (await response.json()) as RawItem;
}

// ---------------------------------------------------------------------------
// Pexels — https://www.pexels.com/api/documentation/
// Key is sent as an Authorization header and never leaves the server.
// Attribution: "Photo by <photographer> on Pexels", linked to the photo page.
// ---------------------------------------------------------------------------

type PexelsPhoto = {
  id?: unknown;
  width?: unknown;
  height?: unknown;
  url?: unknown;
  photographer?: unknown;
  photographer_url?: unknown;
  avg_color?: unknown;
  alt?: unknown;
  src?: Record<string, unknown>;
};

export async function searchPexels(
  term: string,
  page: number,
  orientation: GalleryOrientation,
  category: string,
): Promise<GalleryProviderResult> {
  const key = process.env.PEXELS_API_KEY;

  if (!key) {
    return failure("pexels", "Pexels is not configured.", false);
  }

  try {
    const params = new URLSearchParams({
      query: term,
      per_page: String(MAX_ITEMS_PER_PROVIDER),
      page: String(page),
    });

    if (orientation !== "any") {
      params.set("orientation", orientation);
    }

    const data = await fetchJson(
      `https://api.pexels.com/v1/search?${params.toString()}`,
      { headers: { Authorization: key } },
    );

    const photos = (data?.photos as PexelsPhoto[] | undefined) ?? [];

    const items = photos
      .map((photo): GalleryItem | null => {
        const id = photo.id;
        const src = photo.src ?? {};
        const imageUrl = isAllowedImageUrl(str(src.large) ?? str(src.original));
        const thumbnailUrl = isAllowedImageUrl(
          str(src.medium) ?? str(src.small) ?? imageUrl,
        );
        const sourceUrl = str(photo.url);

        if (
          (typeof id !== "number" && typeof id !== "string") ||
          !imageUrl ||
          !thumbnailUrl ||
          !sourceUrl
        ) {
          return null;
        }

        const photographer = str(photo.photographer, 120) ?? "Pexels contributor";
        const photographerUrl = str(photo.photographer_url, 500);

        return {
          id: galleryItemKey("pexels", String(id)),
          source: "pexels",
          sourceItemId: String(id),
          title: cleanTitle(str(photo.alt, 300), `Pexels photo ${id}`),
          category,
          imageUrl,
          thumbnailUrl,
          width: num(photo.width),
          height: num(photo.height),
          sourceUrl,
          creatorName: photographer,
          creatorUrl: photographerUrl,
          licenseName: "Pexels License",
          licenseUrl: "https://www.pexels.com/license/",
          attribution: `Photo by ${photographer} on Pexels`,
          dominantColor: str(photo.avg_color, 16),
        };
      })
      .filter((item): item is GalleryItem => item !== null);

    return { source: "pexels", items, error: null, configured: true };
  } catch {
    logWarn("gallery.pexels", "search failed");
    return failure("pexels", "Pexels did not respond.");
  }
}

// ---------------------------------------------------------------------------
// Unsplash — https://unsplash.com/developers
// Uses the hotlinked urls returned by the API. Attribution includes the
// photographer profile link with the required utm parameters.
// ---------------------------------------------------------------------------

type UnsplashPhoto = {
  id?: unknown;
  width?: unknown;
  height?: unknown;
  alt_description?: unknown;
  description?: unknown;
  color?: unknown;
  urls?: Record<string, unknown>;
  links?: Record<string, unknown>;
  user?: { name?: unknown; username?: unknown; links?: Record<string, unknown> };
};

export async function searchUnsplash(
  term: string,
  page: number,
  orientation: GalleryOrientation,
  category: string,
): Promise<GalleryProviderResult> {
  const key = process.env.UNSPLASH_ACCESS_KEY;

  if (!key) {
    return failure("unsplash", "Unsplash is not configured.", false);
  }

  try {
    const params = new URLSearchParams({
      query: term,
      per_page: String(MAX_ITEMS_PER_PROVIDER),
      page: String(page),
    });

    if (orientation !== "any") {
      params.set("orientation", orientation === "square" ? "squarish" : orientation);
    }

    const data = await fetchJson(
      `https://api.unsplash.com/search/photos?${params.toString()}`,
      {
        headers: {
          Authorization: `Client-ID ${key}`,
          "Accept-Version": "v1",
        },
      },
    );

    const photos = (data?.results as UnsplashPhoto[] | undefined) ?? [];

    const items = photos
      .map((photo): GalleryItem | null => {
        const id = str(photo.id, 64);
        const urls = photo.urls ?? {};
        const imageUrl = isAllowedImageUrl(str(urls.regular) ?? str(urls.full));
        const thumbnailUrl = isAllowedImageUrl(
          str(urls.small) ?? str(urls.thumb) ?? imageUrl,
        );
        const sourceUrl = str(photo.links?.html);

        if (!id || !imageUrl || !thumbnailUrl || !sourceUrl) {
          return null;
        }

        const name = str(photo.user?.name, 120) ?? "Unsplash contributor";
        const username = str(photo.user?.username, 120);
        const profile = username
          ? `https://unsplash.com/@${username}?utm_source=dribbble-clone&utm_medium=referral`
          : str(photo.user?.links?.html);

        return {
          id: galleryItemKey("unsplash", id),
          source: "unsplash",
          sourceItemId: id,
          title: cleanTitle(
            str(photo.alt_description, 300) ?? str(photo.description, 300),
            `Unsplash photo ${id}`,
          ),
          category,
          imageUrl,
          thumbnailUrl,
          width: num(photo.width),
          height: num(photo.height),
          sourceUrl,
          creatorName: name,
          creatorUrl: profile,
          licenseName: "Unsplash License",
          licenseUrl: "https://unsplash.com/license",
          attribution: `Photo by ${name} on Unsplash`,
          dominantColor: str(photo.color, 16),
        };
      })
      .filter((item): item is GalleryItem => item !== null);

    return { source: "unsplash", items, error: null, configured: true };
  } catch {
    logWarn("gallery.unsplash", "search failed");
    return failure("unsplash", "Unsplash did not respond.");
  }
}

// ---------------------------------------------------------------------------
// Openverse — https://api.openverse.org/v1/
// Preserves creator, license, license URL, source page, and attribution text.
// License metadata is passed through, not guaranteed by this clone.
// ---------------------------------------------------------------------------

type OpenverseImage = {
  id?: unknown;
  title?: unknown;
  url?: unknown;
  thumbnail?: unknown;
  creator?: unknown;
  creator_url?: unknown;
  foreign_landing_url?: unknown;
  license?: unknown;
  license_version?: unknown;
  license_url?: unknown;
  width?: unknown;
  height?: unknown;
  attribution?: unknown;
};

const SHOWCASE_LICENSES = "by,by-sa,by-nc,by-nd,by-nc-sa,by-nc-nd,cc0,pdm";

export async function searchOpenverse(
  term: string,
  page: number,
  orientation: GalleryOrientation,
  category: string,
): Promise<GalleryProviderResult> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = process.env.OPENVERSE_API_TOKEN;

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Openverse caps anonymous requests at 20 results per page.
    const pageSize = Math.min(MAX_ITEMS_PER_PROVIDER, token ? 24 : 20);

    const params = new URLSearchParams({
      q: term,
      page: String(page),
      page_size: String(pageSize),
      license: SHOWCASE_LICENSES,
      mature: "false",
    });

    const data = await fetchJson(
      `https://api.openverse.org/v1/images/?${params.toString()}`,
      { headers },
    );

    const results = (data?.results as OpenverseImage[] | undefined) ?? [];

    const items = results
      .map((image): GalleryItem | null => {
        const id = str(image.id, 64);
        const imageUrl = isAllowedImageUrl(str(image.url));
        const thumbnailUrl = isAllowedImageUrl(str(image.thumbnail)) ?? imageUrl;
        const sourceUrl = str(image.foreign_landing_url);

        if (!id || !imageUrl || !thumbnailUrl || !sourceUrl) {
          return null;
        }

        const creator = str(image.creator, 160);
        const license = str(image.license, 24);
        const version = str(image.license_version, 16);
        const licenseLabel = license
          ? `CC ${license.toUpperCase()}${version ? ` ${version}` : ""}`
          : null;
        const attribution = str(image.attribution, 400);

        return {
          id: galleryItemKey("openverse", id),
          source: "openverse",
          sourceItemId: id,
          title: cleanTitle(str(image.title, 300), `Openverse image ${id}`),
          category,
          imageUrl,
          thumbnailUrl,
          width: num(image.width),
          height: num(image.height),
          sourceUrl,
          creatorName: creator,
          creatorUrl: str(image.creator_url, 500),
          licenseName: licenseLabel,
          licenseUrl: str(image.license_url, 500),
          attribution:
            attribution ??
            (creator
              ? `${creator}${licenseLabel ? ` · ${licenseLabel}` : ""}`
              : "Openverse result"),
          dominantColor: null,
        };
      })
      .filter((item): item is GalleryItem => item !== null);

    return { source: "openverse", items, error: null, configured: true };
  } catch {
    logWarn("gallery.openverse", "search failed");
    return failure("openverse", "Openverse did not respond.");
  }
}

// ---------------------------------------------------------------------------
// Pixabay — https://pixabay.com/api/docs/
// Display-only search results: URLs are hotlinked, not rehosted, and each card
// links back to the Pixabay page.
// ---------------------------------------------------------------------------

type PixabayHit = {
  id?: unknown;
  pageURL?: unknown;
  previewURL?: unknown;
  webformatURL?: unknown;
  largeImageURL?: unknown;
  imageWidth?: unknown;
  imageHeight?: unknown;
  user?: unknown;
  user_id?: unknown;
  tags?: unknown;
};

export async function searchPixabay(
  term: string,
  page: number,
  orientation: GalleryOrientation,
  category: string,
): Promise<GalleryProviderResult> {
  const key = process.env.PIXABAY_API_KEY;

  if (!key) {
    return failure("pixabay", "Pixabay is not configured.", false);
  }

  try {
    const params = new URLSearchParams({
      key,
      q: term,
      image_type: "photo",
      safesearch: "true",
      per_page: String(MAX_ITEMS_PER_PROVIDER),
      page: String(page),
    });

    if (orientation === "landscape" || orientation === "portrait") {
      params.set("orientation", orientation === "portrait" ? "vertical" : "horizontal");
    }

    const data = await fetchJson(`https://pixabay.com/api/?${params.toString()}`, {});

    const hits = (data?.hits as PixabayHit[] | undefined) ?? [];

    const items = hits
      .map((hit): GalleryItem | null => {
        if (typeof hit.id !== "number") {
          return null;
        }

        const imageUrl = isAllowedImageUrl(
          str(hit.largeImageURL) ?? str(hit.webformatURL),
        );
        const thumbnailUrl =
          isAllowedImageUrl(str(hit.webformatURL)) ??
          isAllowedImageUrl(str(hit.previewURL)) ??
          imageUrl;
        const sourceUrl = str(hit.pageURL);

        if (!imageUrl || !thumbnailUrl || !sourceUrl) {
          return null;
        }

        const user = str(hit.user, 120) ?? "Pixabay contributor";
        const userId = num(hit.user_id);

        return {
          id: galleryItemKey("pixabay", String(hit.id)),
          source: "pixabay",
          sourceItemId: String(hit.id),
          title: cleanTitle(
            str(hit.tags, 200)?.split(",")[0] ?? null,
            `Pixabay image ${hit.id}`,
          ),
          category,
          imageUrl,
          thumbnailUrl,
          width: num(hit.imageWidth),
          height: num(hit.imageHeight),
          sourceUrl,
          creatorName: user,
          creatorUrl: userId
            ? `https://pixabay.com/users/${encodeURIComponent(user.toLowerCase().replace(/\s+/g, "-"))}-${userId}/`
            : null,
          licenseName: "Pixabay Content License",
          licenseUrl: "https://pixabay.com/service/license-summary/",
          attribution: `Image from ${user} on Pixabay`,
          dominantColor: null,
        };
      })
      .filter((item): item is GalleryItem => item !== null);

    return { source: "pixabay", items, error: null, configured: true };
  } catch {
    logWarn("gallery.pixabay", "search failed");
    return failure("pixabay", "Pixabay did not respond.");
  }
}

export const PROVIDER_SEARCH = {
  pexels: searchPexels,
  unsplash: searchUnsplash,
  openverse: searchOpenverse,
  pixabay: searchPixabay,
} satisfies Record<GallerySource, typeof searchPexels>;

export function isProviderConfigured(source: GallerySource): boolean {
  switch (source) {
    case "pexels":
      return Boolean(process.env.PEXELS_API_KEY);
    case "unsplash":
      return Boolean(process.env.UNSPLASH_ACCESS_KEY);
    case "openverse":
      return true;
    case "pixabay":
      return Boolean(process.env.PIXABAY_API_KEY);
  }
}
