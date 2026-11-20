import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShotGrid } from "@/components/shots/shot-grid";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getProfileByUsername } from "@/lib/data/profiles";
import { getPublishedShotsByCreator } from "@/lib/data/shots";
import { avatarUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  return {
    title: profile
      ? `${profile.display_name} (@${profile.username})`
      : "Profile not found",
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const shots = await getPublishedShotsByCreator(profile.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="rounded-2xl border border-border bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar
            src={avatarUrl(profile.avatar_path)}
            name={profile.display_name}
            size={96}
          />

          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              {profile.display_name}
            </h1>
            <p className="mt-1 text-sm text-muted">@{profile.username}</p>

            {profile.bio ? (
              <p className="mt-4 max-w-2xl text-sm leading-6 whitespace-pre-line text-foreground/90">
                {profile.bio}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              {profile.portfolio_url ? (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand hover:text-brand-dark"
                >
                  Portfolio ↗
                </a>
              ) : null}
              <span className="text-muted">Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-10 space-y-5">
        <h2 className="text-xl font-semibold tracking-tight">
          Shots <span className="text-sm font-normal text-muted">({shots.length})</span>
        </h2>

        {shots.length === 0 ? (
          <EmptyState
            title="No published shots yet"
            description="When this designer publishes work, it will appear here."
            action={
              <Link href="/" className={buttonClasses("secondary")}>
                Back to discover
              </Link>
            }
          />
        ) : (
          <ShotGrid shots={shots} />
        )}
      </section>
    </div>
  );
}
