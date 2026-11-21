import type { Metadata } from "next";

import { markAllNotificationsRead } from "@/app/notifications/actions";
import { LoadMore } from "@/components/feed/load-more";
import { NotificationRow } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { getNotifications, getUnreadCount } from "@/lib/data/notifications";
import {
  buildNotificationsHref,
  decodeNotificationCursor,
} from "@/lib/notifications/params";

export const metadata: Metadata = {
  title: "Notifications",
};

export const dynamic = "force-dynamic";

type NotificationsPageProps = {
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const user = await requireUser();
  const rawCursor = (await searchParams).cursor;
  const cursor = decodeNotificationCursor(
    Array.isArray(rawCursor) ? rawCursor[0] : rawCursor,
  );

  const [page, unread] = await Promise.all([
    getNotifications(user.id, cursor),
    getUnreadCount(user.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted">
            {unread > 0 ? `${unread} unread` : "You're all caught up."}
          </p>
        </div>

        {unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary" size="sm">
              Mark all read
            </Button>
          </form>
        ) : null}
      </div>

      {page.items.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="Follows and comments on your shots will show up here."
        />
      ) : (
        <ul className="space-y-3">
          {page.items.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} />
          ))}
        </ul>
      )}

      {page.nextCursor ? (
        <LoadMore
          href={buildNotificationsHref(page.nextCursor)}
          label="Older notifications"
        />
      ) : null}
    </div>
  );
}
