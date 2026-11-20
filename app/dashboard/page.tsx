import type { Metadata } from "next";
import Link from "next/link";

import { ShotActions } from "@/components/shots/shot-actions";
import { ShotCard } from "@/components/shots/shot-card";
import { ShotStatusBadge } from "@/components/shots/shot-status-badge";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { getShotsForDashboard } from "@/lib/data/shots";
import type { ShotListItem } from "@/lib/types/app";

export const metadata: Metadata = {
  title: "Dashboard",
};

function ShotSection({
  title,
  description,
  shots,
}: {
  title: string;
  description: string;
  shots: ShotListItem[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      {shots.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted">
          Nothing here yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shots.map((shot) => (
            <div key={shot.id} className="space-y-3">
              <ShotCard shot={shot} />
              <div className="flex items-center justify-between gap-2">
                <ShotStatusBadge status={shot.status} />
                <ShotActions shotId={shot.id} status={shot.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const shots = await getShotsForDashboard(user.id);

  const drafts = shots.filter((shot) => shot.status === "draft");
  const published = shots.filter((shot) => shot.status === "published");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your shots</h1>
          <p className="mt-1 text-sm text-muted">Manage drafts and published work.</p>
        </div>
        <Link href="/shots/new" className={buttonClasses()}>
          New shot
        </Link>
      </div>

      {shots.length === 0 ? (
        <EmptyState
          title="No shots yet"
          description="Create a private draft, add a cover image, and publish when you are happy with it."
          action={
            <Link href="/shots/new" className={buttonClasses()}>
              Create your first shot
            </Link>
          }
        />
      ) : (
        <>
          <ShotSection
            title="Drafts"
            description="Only you can see these."
            shots={drafts}
          />
          <ShotSection
            title="Published"
            description="Visible in the public feed."
            shots={published}
          />
        </>
      )}
    </div>
  );
}
