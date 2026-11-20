import Link from "next/link";

import { publishShot, unpublishShot } from "@/app/shots/actions";
import { DeleteShotForm } from "@/components/shots/delete-shot-form";
import { Button, buttonClasses } from "@/components/ui/button";
import type { ShotStatus } from "@/lib/types/database";

type ShotActionsProps = {
  shotId: string;
  status: ShotStatus;
};

export function ShotActions({ shotId, status }: ShotActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/shots/${shotId}/edit`} className={buttonClasses("secondary", "sm")}>
        Edit
      </Link>

      {status === "published" ? (
        <form action={unpublishShot.bind(null, shotId)}>
          <Button type="submit" variant="secondary" size="sm">
            Unpublish
          </Button>
        </form>
      ) : (
        <form action={publishShot.bind(null, shotId)}>
          <Button type="submit" size="sm">
            Publish
          </Button>
        </form>
      )}

      <DeleteShotForm shotId={shotId} />
    </div>
  );
}
