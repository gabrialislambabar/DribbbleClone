import type { ShotStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type ShotStatusBadgeProps = {
  status: ShotStatus;
};

export function ShotStatusBadge({ status }: ShotStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        status === "published"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700",
      )}
    >
      {status}
    </span>
  );
}
