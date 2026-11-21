import { SiteHeaderShell } from "@/components/layout/site-header-shell";
import { getCurrentProfile, getUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/data/notifications";
import { isSupabaseConfigured } from "@/lib/env";

export async function SiteHeader() {
  const configured = isSupabaseConfigured();
  const user = configured ? await getUser() : null;
  const profile = user ? await getCurrentProfile() : null;
  const unread = user ? await getUnreadCount(user.id) : 0;

  const displayName = profile?.display_name ?? user?.email ?? "Account";

  return (
    <SiteHeaderShell
      configured={configured}
      user={
        user
          ? {
              id: user.id,
              displayName,
              avatarPath: profile?.avatar_path ?? null,
              unread,
            }
          : null
      }
    />
  );
}
