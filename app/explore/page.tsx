import type { Metadata } from "next";

import { ExploreExperience } from "@/components/explore/explore-experience";
import { CategoryMarquee } from "@/components/home/category-marquee";
import { SetupNotice } from "@/components/layout/setup-notice";
import { getUser } from "@/lib/auth";
import { getExploreShots } from "@/lib/data/explore";
import { isSupabaseConfigured } from "@/lib/env";
import {
  buildExploreHref,
  parseExploreFilters,
  toExploreProjects,
} from "@/lib/explore/filters";

export const metadata: Metadata = {
  title: "Explore projects",
};

type ExplorePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const params = await searchParams;
  const filters = parseExploreFilters(params);
  const [shots, user] = await Promise.all([getExploreShots(), getUser()]);
  const projects = toExploreProjects(shots);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <ExploreExperience
        key={buildExploreHref(filters)}
        projects={projects}
        initialFilters={filters}
        signedIn={Boolean(user)}
      />
      <CategoryMarquee />
    </div>
  );
}
