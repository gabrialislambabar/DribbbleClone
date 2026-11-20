"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BellIcon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

type NotificationBellProps = {
  userId: string;
  initialUnread: number;
};

export function NotificationBell({ userId, initialUnread }: NotificationBellProps) {
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function refreshCount() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .is("read_at", null);

      if (!cancelled && typeof count === "number") {
        setUnread(count);
      }
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          void refreshCount();
          if (payload.eventType === "INSERT") {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId, router]);

  const label = unread > 0 ? `Notifications (${unread} unread)` : "Notifications";

  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
    >
      <BellIcon />
      {unread > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-4 font-semibold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
