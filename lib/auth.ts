import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/app";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
});
