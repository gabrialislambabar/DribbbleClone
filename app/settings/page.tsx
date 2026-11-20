import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DeleteAccount } from "@/components/profile/delete-account";
import { ProfileForm } from "@/components/profile/profile-form";
import { getCurrentProfile, getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/sign-in?next=/settings");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your public profile and account.</p>
      </div>

      <ProfileForm profile={profile} />

      <DeleteAccount
        username={profile.username}
        enabled={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}
      />
    </div>
  );
}
