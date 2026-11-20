import type { Metadata } from "next";
import Link from "next/link";

import { ReportActions } from "@/components/moderation/report-actions";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdmin } from "@/lib/auth";
import { getOpenReports } from "@/lib/data/reports";
import type { ReportItem } from "@/lib/types/app";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Moderation",
};

function excerpt(value: string, maxLength = 160): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

function TargetSummary({ report }: { report: ReportItem }) {
  if (report.shot) {
    return (
      <p className="text-sm">
        Shot:{" "}
        <Link href={`/shots/${report.shot.id}`} className="font-medium hover:text-brand">
          {report.shot.title}
        </Link>{" "}
        by @{report.shot.creator_username}{" "}
        <span className="text-muted">({report.shot.status})</span>
      </p>
    );
  }

  if (report.comment) {
    return (
      <div className="text-sm">
        <p>
          Comment by @{report.comment.author_username} on{" "}
          <Link
            href={`/shots/${report.comment.shot_id}#comment-${report.comment.id}`}
            className="font-medium hover:text-brand"
          >
            shot {report.comment.shot_id.slice(0, 8)}
          </Link>
        </p>
        <p className="mt-1 rounded bg-surface px-2 py-1 text-xs text-muted">
          {excerpt(report.comment.body)}
        </p>
      </div>
    );
  }

  if (report.profile) {
    return (
      <p className="text-sm">
        Profile:{" "}
        <Link
          href={`/u/${report.profile.username}`}
          className="font-medium hover:text-brand"
        >
          {report.profile.display_name} (@{report.profile.username})
        </Link>
      </p>
    );
  }

  return <p className="text-sm text-muted">Target no longer exists.</p>;
}

export default async function ModerationPage() {
  await requireAdmin();
  const reports = await getOpenReports();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Moderation</h1>
          <p className="mt-1 text-sm text-muted">
            Open reports from the community, oldest first.
          </p>
        </div>
        <Link href="/" className={buttonClasses("secondary", "sm")}>
          Back to site
        </Link>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="No open reports"
          description="When someone reports a shot, comment, or profile, it will appear here."
        />
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li
              key={report.id}
              className="space-y-3 rounded-2xl border border-border bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted uppercase">
                  {report.reason}
                </span>
                <span className="text-xs text-muted">
                  {formatDate(report.created_at)} · reported by{" "}
                  {report.reporter ? `@${report.reporter.username}` : "deleted user"}
                </span>
              </div>

              <TargetSummary report={report} />

              {report.details ? (
                <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  {report.details}
                </p>
              ) : null}

              <ReportActions reportId={report.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
