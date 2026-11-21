"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { toSafeMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/social";

export type NotificationPreferencesState = {
  error?: string;
  success?: string;
};

export async function markNotificationRead(notificationId: string): Promise<void> {
  const user = await requireUser();
  const parsed = uuidSchema.safeParse(notificationId);

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("recipient_id", user.id)
    .is("read_at", null);

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function updateNotificationPreferences(
  _previousState: NotificationPreferencesState,
  formData: FormData,
): Promise<NotificationPreferencesState> {
  const user = await requireUser();
  const follows = formData.get("follows") === "on";
  const comments = formData.get("comments") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: user.id, follows, comments }, { onConflict: "user_id" });

  if (error) {
    return {
      error: toSafeMessage(error, "We couldn't update your notification settings."),
    };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: "Notification settings updated." };
}
