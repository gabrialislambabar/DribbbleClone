import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FollowList } from "@/components/profile/follow-list";
import { getUser } from "@/lib/auth";
import { getFollowList } from "@/lib/data/social";
import { getProfileByUsername } from "@/lib/data/profiles";
import { decodeFollowCursor } from "@/lib/follows/params";

export const metadata: Metadata = {
  title: "Followers",
};

type FollowersPageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function FollowersPage({
  params,
  searchParams,
}: FollowersPageProps) {
  const { username } = await params;
  const rawCursor = (await searchParams).cursor;
  const cursor = decodeFollowCursor(Array.isArray(rawCursor) ? rawCursor[0] : rawCursor);

  const profile = await getProfileByUsername(username);
  if (!profile) {
    notFound();
  }

  const [page, user] = await Promise.all([
    getFollowList(profile.id, "followers", cursor),
    getUser(),
  ]);

  return (
    <FollowList
      profile={profile}
      direction="followers"
      items={page.items}
      nextCursor={page.nextCursor}
      currentUserId={user?.id ?? null}
    />
  );
}
