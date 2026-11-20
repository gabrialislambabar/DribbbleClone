"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { markNotificationRead } from "@/app/notifications/actions";
import { Avatar } from "@/components/ui/avatar";
import { avatarUrl } from "@/lib/storage";
import type { NotificationItem } from "@/lib/types/app";
import { cn, formatDate } from "@/lib/utils";

type NotificationItemProps = {
  notification: NotificationItem;
};

function excerpt(value: string, maxLength = 120): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

export function NotificationRow({ notification }: NotificationItemProps) {
  const router = useRouter();
  const unread = !notification.read_at;
  const actorName = notification.actor?.display_name ?? "Someone";

  return (
    <li
      className={cn(
        "rounded-xl border border-border bg-white transition-colors",
        unread && "border-brand/30 bg-brand/5",
      )}
    >
      <Link
        href={notification.href}
        onClick={(event) => {
          if (!unread) {
            return;
          }

          event.preventDefault();
          void markNotificationRead(notification.id)
            .catch(() => undefined)
            .finally(() => {
              router.push(notification.href);
            });
        }}
        className="flex gap-3 p-4"
      >
        <Avatar
          src={avatarUrl(notification.actor?.avatar_path)}
          name={actorName}
          size={40}
        />

        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-6">
            <span className="font-medium">{actorName}</span>{" "}
            {notification.type === "follow" ? (
              <span className="text-foreground/90">followed you.</span>
            ) : (
              <>
                <span className="text-foreground/90">commented on</span>{" "}
                <span className="font-medium">
                  {notification.shot?.title ?? "your shot"}
                </span>
                <span className="text-foreground/90">.</span>
              </>
            )}
          </span>

          {notification.type === "comment" && notification.comment ? (
            <span className="mt-1 block rounded bg-surface px-2 py-1 text-xs text-muted">
              {excerpt(notification.comment.body)}
            </span>
          ) : null}

          <span className="mt-1 block text-xs text-muted">
            {formatDate(notification.created_at)}
          </span>
        </span>

        {unread ? (
          <span
            aria-label="Unread"
            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand"
          />
        ) : null}
      </Link>
    </li>
  );
}
