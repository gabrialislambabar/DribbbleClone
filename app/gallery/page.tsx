import type { Metadata } from "next";

import { GalleryExperience } from "@/components/gallery/gallery-experience";
import { getUser } from "@/lib/auth";
import { getSavedDesignIds } from "@/lib/data/saved-designs";
import { buildGalleryHref, parseGalleryFilters } from "@/lib/gallery/params";
import { searchGallery } from "@/lib/gallery/search";

export const metadata: Metadata = {
  title: "Design discovery gallery",
  description:
    "Photography and illustration from Pexels, Unsplash, Openverse, and Pixabay, grouped by design category with attribution.",
};

type GalleryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const filters = parseGalleryFilters(await searchParams);
  const user = await getUser();

  const [result, savedIds] = await Promise.all([
    searchGallery(filters),
    user ? getSavedDesignIds(user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <GalleryExperience
      key={buildGalleryHref(filters)}
      initialFilters={filters}
      initialResult={result}
      initialSavedIds={[...savedIds]}
      signedIn={Boolean(user)}
    />
  );
}
